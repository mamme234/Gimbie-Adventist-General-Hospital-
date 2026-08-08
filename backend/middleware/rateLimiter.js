// middleware/rateLimiter.js
const { AuditLog } = require('../models/AuditLog');
const { logger } = require('../utils/logger');

// In-memory rate limit storage
const rateLimitStore = new Map();

class RateLimiter {
  constructor() {
    this.defaultConfig = {
      windowMs: 60000,
      maxRequests: 100,
      blockDuration: 300000
    };
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  create(config = {}) {
    const options = { ...this.defaultConfig, ...config };
    
    return async (req, res, next) => {
      try {
        const key = this.getRateLimitKey(req);
        const currentCount = await this.getRequestCount(key);
        
        const isBlocked = this.isBlocked(key);
        if (isBlocked) {
          return this.handleBlocked(req, res);
        }

        if (currentCount >= options.maxRequests) {
          this.blockKey(key, options.blockDuration);
          return this.handleRateLimitExceeded(req, res, options);
        }

        this.incrementRequestCount(key, options.windowMs);
        
        this.setRateLimitHeaders(res, {
          limit: options.maxRequests,
          remaining: Math.max(0, options.maxRequests - currentCount - 1),
          reset: new Date(Date.now() + options.windowMs)
        });

        next();
      } catch (error) {
        logger.error('Rate limiter error:', error);
        next();
      }
    };
  }

  getRateLimitKey(req) {
    const baseKey = 'rate_limit';
    const userKey = req.user?._id || req.ip || req.connection?.remoteAddress || 'anonymous';
    const endpointKey = this.getEndpointKey(req);
    return `${baseKey}:${userKey}:${endpointKey}`;
  }

  getEndpointKey(req) {
    const method = req.method;
    const path = req.originalUrl?.split('?')[0] || req.url || '/';
    return `${method}:${path}`;
  }

  getRequestCount(key) {
    const data = rateLimitStore.get(key);
    if (!data) return 0;
    if (Date.now() > data.windowEnd) {
      rateLimitStore.delete(key);
      return 0;
    }
    return data.count || 0;
  }

  incrementRequestCount(key, windowMs) {
    const now = Date.now();
    const data = rateLimitStore.get(key) || { count: 0, windowEnd: now + windowMs };
    
    if (now > data.windowEnd) {
      data.count = 1;
      data.windowEnd = now + windowMs;
    } else {
      data.count += 1;
    }
    
    rateLimitStore.set(key, data);
  }

  blockKey(key, duration) {
    const blockKey = `${key}:blocked`;
    rateLimitStore.set(blockKey, {
      blocked: true,
      expiresAt: Date.now() + duration
    });
  }

  isBlocked(key) {
    const blockKey = `${key}:blocked`;
    const data = rateLimitStore.get(blockKey);
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
      rateLimitStore.delete(blockKey);
      return false;
    }
    return data.blocked || false;
  }

  handleRateLimitExceeded(req, res, options) {
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

  handleBlocked(req, res) {
    return res.status(429).json({
      success: false,
      message: 'You have been temporarily blocked due to excessive requests.',
      code: 'RATE_LIMIT_BLOCKED',
      retryAfter: 300
    });
  }

  setRateLimitHeaders(res, info) {
    res.set({
      'X-RateLimit-Limit': info.limit,
      'X-RateLimit-Remaining': info.remaining,
      'X-RateLimit-Reset': info.reset.getTime()
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.windowEnd && now > value.windowEnd) {
        rateLimitStore.delete(key);
      }
      if (value.expiresAt && now > value.expiresAt) {
        rateLimitStore.delete(key);
      }
    }
  }

  createAuth() {
    return this.create({
      windowMs: 300000,
      maxRequests: 20,
      blockDuration: 1800000
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
      windowMs: 3600000,
      maxRequests: 100,
      blockDuration: 3600000
    });
  }

  createBulk() {
    return this.create({
      windowMs: 60000,
      maxRequests: 10,
      blockDuration: 600000
    });
  }

  createEmergency() {
    return this.create({
      windowMs: 60000,
      maxRequests: 30,
      blockDuration: 300000
    });
  }

  createChat() {
    return this.create({
      windowMs: 10000,
      maxRequests: 20,
      blockDuration: 60000
    });
  }

  createUpload() {
    return this.create({
      windowMs: 3600000,
      maxRequests: 50,
      blockDuration: 3600000
    });
  }

  createPayment() {
    return this.create({
      windowMs: 600000,
      maxRequests: 10,
      blockDuration: 1800000
    });
  }
}

module.exports = new RateLimiter();
