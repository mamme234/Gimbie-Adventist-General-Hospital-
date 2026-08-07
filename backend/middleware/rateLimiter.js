// middleware/rateLimiter.js
const redis = require('../config/redis');
const { AuditLog } = require('../models/AuditLog');

class RateLimiter {
  constructor() {
    this.defaultConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      blockDuration: 300000 // 5 minutes
    };
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
        console.error('Rate limiter error:', error);
        next(); // Fail open
      }
    };
  }

  // Get rate limit key
  getRateLimitKey(req) {
    const baseKey = 'rate_limit';
    const userKey = req.user?._id || req.ip;
    const endpointKey = this.getEndpointKey(req);
    return `${baseKey}:${userKey}:${endpointKey}`;
  }

  // Get endpoint key
  getEndpointKey(req) {
    const method = req.method;
    const path = req.originalUrl.split('?')[0];
    return `${method}:${path}`;
  }

  // Get request count from Redis
  async getRequestCount(key) {
    const count = await redis.get(key);
    return parseInt(count) || 0;
  }

  // Increment request count
  async incrementRequestCount(key, windowMs) {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(windowMs / 1000));
    await multi.exec();
  }

  // Block key
  async blockKey(key, duration) {
    const blockKey = `${key}:blocked`;
    await redis.setex(blockKey, Math.ceil(duration / 1000), '1');
  }

  // Check if blocked
  async isBlocked(key) {
    const blockKey = `${key}:blocked`;
    const blocked = await redis.get(blockKey);
    return !!blocked;
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
        method: req.method
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
      retryAfter
    });
  }

  // Handle blocked
  handleBlocked(req, res) {
    return res.status(429).json({
      success: false,
      message: 'You have been temporarily blocked due to excessive requests.',
      code: 'RATE_LIMIT_BLOCKED'
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

  // Create specialized limiters
  createGlobal() {
    return this.create({
      windowMs: 60000,
      maxRequests: 1000,
      blockDuration: 600000
    });
  }

  createAuth() {
    return this.create({
      windowMs: 300000, // 5 minutes
      maxRequests: 20,
      blockDuration: 1800000 // 30 minutes
    });
  }

  createApi() {
    return this.create({
      windowMs: 60000,
      maxRequests: 500,
      blockDuration: 300000
    });
  }

  createSensitive() {
    return this.create({
      windowMs: 3600000, // 1 hour
      maxRequests: 100,
      blockDuration: 3600000 // 1 hour
    });
  }

  createBulk() {
    return this.create({
      windowMs: 60000,
      maxRequests: 10,
      blockDuration: 600000
    });
  }

  // Specific endpoints
  createEmergency() {
    return this.create({
      windowMs: 60000,
      maxRequests: 30,
      blockDuration: 300000
    });
  }

  createChat() {
    return this.create({
      windowMs: 10000, // 10 seconds
      maxRequests: 20,
      blockDuration: 60000
    });
  }

  createUpload() {
    return this.create({
      windowMs: 3600000, // 1 hour
      maxRequests: 50,
      blockDuration: 3600000
    });
  }
}

// Export singleton
module.exports = new RateLimiter();
