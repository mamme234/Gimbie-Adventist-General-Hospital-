// middleware/rateLimiter.js
const redis = require('../config/redis');
const { AuditLog } = require('../models/AuditLog');
const { logger } = require('../utils/logger');

class RateLimiter {
  constructor() {
    this.defaultConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      blockDuration: 300000 // 5 minutes
    };
    
    // In-memory fallback if Redis is not available
    this.memoryStore = new Map();
    this.useRedis = false;
    
    // Check if Redis is available
    this.checkRedisConnection();
  }

  // Check Redis connection
  async checkRedisConnection() {
    try {
      const status = redis.getStatus ? redis.getStatus() : { connected: false };
      this.useRedis = status.connected || false;
      if (this.useRedis) {
        logger.info('✅ Rate limiter using Redis');
      } else {
        logger.warn('⚠️ Rate limiter using memory store (Redis not available)');
      }
    } catch (error) {
      this.useRedis = false;
      logger.warn('⚠️ Rate limiter using memory store (Redis connection failed)');
    }
  }

  // Main rate limiter middleware
  create(config = {}) {
    const options = { ...this.defaultConfig, ...config };
    
    return async (req, res, next) => {
      try {
        const key = this.getRateLimitKey(req);
        const currentCount = await this.getRequestCount(key);
        
        // Check if blocked
        const isBlocked = await this.isBlocked(key);
        if (isBlocked) {
          return this.handleBlocked(req, res);
        }

        // Check rate limit
        if (currentCount >= options.maxRequests) {
          await this.blockKey(key, options.blockDuration);
          return this.handleRateLimitExceeded(req, res, options);
        }

        // Increment counter
        await this.incrementRequestCount(key, options.windowMs);
        
        // Add rate limit headers
        this.setRateLimitHeaders(res, {
          limit: options.maxRequests,
          remaining: Math.max(0, options.maxRequests - currentCount - 1),
          reset: new Date(Date.now() + options.windowMs)
        });

        next();
      } catch (error) {
        logger.error('Rate limiter error:', error);
        next(); // Fail open - allow request if rate limiter fails
      }
    };
  }

  // Get rate limit key
  getRateLimitKey(req) {
    const baseKey = 'rate_limit';
    const userKey = req.user?._id || req.ip || req.connection.remoteAddress;
    const endpointKey = this.getEndpointKey(req);
    return `${baseKey}:${userKey}:${endpointKey}`;
  }

  // Get endpoint key
  getEndpointKey(req) {
    const method = req.method;
    const path = req.originalUrl?.split('?')[0] || req.url || '/';
    return `${method}:${path}`;
  }

  // Get request count
  async getRequestCount(key) {
    try {
      if (this.useRedis) {
        const count = await redis.get(key, false);
        return parseInt(count) || 0;
      } else {
        // Memory store fallback
        const data = this.memoryStore.get(key);
        if (!data) return 0;
        
        // Check if window has expired
        if (Date.now() > data.windowEnd) {
          this.memoryStore.delete(key);
          return 0;
        }
        return data.count || 0;
      }
    } catch (error) {
      logger.error('Get request count error:', error);
      return 0;
    }
  }

  // Increment request count
  async incrementRequestCount(key, windowMs) {
    try {
      if (this.useRedis) {
        // Use Redis multi for atomic operation
        const multi = redis.client.multi();
        multi.incr(key);
        multi.expire(key, Math.ceil(windowMs / 1000));
        await multi.exec();
      } else {
        // Memory store fallback
        const now = Date.now();
        const data = this.memoryStore.get(key) || { count: 0, windowEnd: now + windowMs };
        
        if (now > data.windowEnd) {
          data.count = 1;
          data.windowEnd = now + windowMs;
        } else {
          data.count += 1;
        }
        
        this.memoryStore.set(key, data);
        
        // Clean up expired entries periodically
        if (this.memoryStore.size > 1000) {
          this.cleanupMemoryStore();
        }
      }
    } catch (error) {
      logger.error('Increment request count error:', error);
      throw error;
    }
  }

  // Block key
  async blockKey(key, duration) {
    try {
      const blockKey = `${key}:blocked`;
      if (this.useRedis) {
        await redis.setex(blockKey, Math.ceil(duration / 1000), '1');
      } else {
        this.memoryStore.set(blockKey, {
          blocked: true,
          expiresAt: Date.now() + duration
        });
      }
    } catch (error) {
      logger.error('Block key error:', error);
    }
  }

  // Check if blocked
  async isBlocked(key) {
    try {
      const blockKey = `${key}:blocked`;
      if (this.useRedis) {
        const blocked = await redis.get(blockKey, false);
        return !!blocked;
      } else {
        const data = this.memoryStore.get(blockKey);
        if (!data) return false;
        if (Date.now() > data.expiresAt) {
          this.memoryStore.delete(blockKey);
          return false;
        }
        return data.blocked || false;
      }
    } catch (error) {
      logger.error('Check blocked error:', error);
      return false;
    }
  }

  // Handle rate limit exceeded
  handleRateLimitExceeded(req, res, options) {
    // Log rate limit exceeded
    AuditLog.logAction({
      action: 'rate_limit',
      resource: 'request',
      userId: req.user?._id || null,
      details: {
        ip: req.ip,
        endpoint: req.originalUrl,
        method: req.method,
        maxRequests: options.maxRequests,
        windowMs: options.windowMs
      },
      status: 'failure',
      severity: 'warning'
    }).catch(console.error);

    const retryAfter = Math.ceil(options.blockDuration / 1000);
    
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      limit: options.maxRequests,
      window: options.windowMs / 1000
    });
  }

  // Handle blocked
  handleBlocked(req, res) {
    return res.status(429).json({
      success: false,
      message: 'You have been temporarily blocked due to excessive requests.',
      code: 'RATE_LIMIT_BLOCKED',
      retryAfter: Math.ceil(300000 / 1000) // 5 minutes default
    });
  }

  // Set rate limit headers
  setRateLimitHeaders(res, info) {
    res.set({
      'X-RateLimit-Limit': info.limit,
      'X-RateLimit-Remaining': info.remaining,
      'X-RateLimit-Reset': info.reset.getTime()
    });
  }

  // Clean up memory store
  cleanupMemoryStore() {
    const now = Date.now();
    for (const [key, value] of this.memoryStore.entries()) {
      if (value.windowEnd && now > value.windowEnd) {
        this.memoryStore.delete(key);
      }
      if (value.expiresAt && now > value.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }

  // ============================================
  // SPECIALIZED RATE LIMITERS
  // ============================================

  // Global rate limiter
  createGlobal() {
    return this.create({
      windowMs: 60000,
      maxRequests: 1000,
      blockDuration: 600000 // 10 minutes
    });
  }

  // Authentication rate limiter (stricter)
  createAuth() {
    return this.create({
      windowMs: 300000, // 5 minutes
      maxRequests: 20,
      blockDuration: 1800000 // 30 minutes
    });
  }

  // API rate limiter
  createApi() {
    return this.create({
      windowMs: 60000,
      maxRequests: 500,
      blockDuration: 300000 // 5 minutes
    });
  }

  // Sensitive operations rate limiter
  createSensitive() {
    return this.create({
      windowMs: 3600000, // 1 hour
      maxRequests: 100,
      blockDuration: 3600000 // 1 hour
    });
  }

  // Bulk operations rate limiter
  createBulk() {
    return this.create({
      windowMs: 60000,
      maxRequests: 10,
      blockDuration: 600000 // 10 minutes
    });
  }

  // Emergency endpoints rate limiter
  createEmergency() {
    return this.create({
      windowMs: 60000,
      maxRequests: 30,
      blockDuration: 300000 // 5 minutes
    });
  }

  // Chat endpoints rate limiter
  createChat() {
    return this.create({
      windowMs: 10000, // 10 seconds
      maxRequests: 20,
      blockDuration: 60000 // 1 minute
    });
  }

  // File upload rate limiter
  createUpload() {
    return this.create({
      windowMs: 3600000, // 1 hour
      maxRequests: 50,
      blockDuration: 3600000 // 1 hour
    });
  }

  // Payment endpoints rate limiter
  createPayment() {
    return this.create({
      windowMs: 600000, // 10 minutes
      maxRequests: 10,
      blockDuration: 1800000 // 30 minutes
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  // Reset rate limit for a specific key
  async resetLimit(key) {
    try {
      if (this.useRedis) {
        await redis.del(key);
        await redis.del(`${key}:blocked`);
      } else {
        this.memoryStore.delete(key);
        this.memoryStore.delete(`${key}:blocked`);
      }
      return true;
    } catch (error) {
      logger.error('Reset limit error:', error);
      return false;
    }
  }

  // Get current rate limit status
  async getStatus(key) {
    try {
      const count = await this.getRequestCount(key);
      const isBlocked = await this.isBlocked(key);
      return {
        count,
        isBlocked,
        remaining: Math.max(0, 100 - count), // Assuming default max 100
        resetIn: isBlocked ? 300 : 60 // Seconds
      };
    } catch (error) {
      logger.error('Get status error:', error);
      return null;
    }
  }

  // Get all rate limit keys (for monitoring)
  async getAllKeys() {
    try {
      if (this.useRedis) {
        return await redis.keys('rate_limit:*');
      } else {
        return Array.from(this.memoryStore.keys());
      }
    } catch (error) {
      logger.error('Get all keys error:', error);
      return [];
    }
  }

  // Clear all rate limits
  async clearAll() {
    try {
      if (this.useRedis) {
        const keys = await redis.keys('rate_limit:*');
        for (const key of keys) {
          await redis.del(key);
        }
        return keys.length;
      } else {
        const count = this.memoryStore.size;
        this.memoryStore.clear();
        return count;
      }
    } catch (error) {
      logger.error('Clear all error:', error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new RateLimiter();
