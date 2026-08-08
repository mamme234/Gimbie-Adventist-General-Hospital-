const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

/**
 * General rate limiter - 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter - 20 requests per 5 minutes
 */
const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per window
    message: {
        success: false,
        message: 'Too many requests, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Auth rate limiter - 5 requests per 15 minutes (for login/register)
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    skipSuccessfulRequests: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Password reset limiter - 3 requests per hour
 */
const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * API rate limiter - 1000 requests per hour
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
    message: {
        success: false,
        message: 'API rate limit exceeded. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Create Redis store for rate limiting (optional)
 */
const createRedisStore = () => {
    if (process.env.REDIS_URL) {
        const client = redis.createClient({
            url: process.env.REDIS_URL,
        });
        
        return new RedisStore({
            sendCommand: (...args) => client.sendCommand(args),
        });
    }
    return null;
};

// Export with Redis support if available
const createRateLimiter = (options) => {
    const redisStore = createRedisStore();
    if (redisStore) {
        return rateLimit({
            store: redisStore,
            ...options,
        });
    }
    return rateLimit(options);
};

module.exports = {
    generalLimiter,
    strictLimiter,
    authLimiter,
    resetLimiter,
    apiLimiter,
    createRateLimiter,
};
