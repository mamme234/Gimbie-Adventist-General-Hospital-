// utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console logging
const consoleFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
});

// Custom format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    
    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    
    // Daily rotate file for errors only
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat
    })
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat
    })
  ]
});

// ============================================
// REQUEST LOGGER MIDDLEWARE
// ============================================
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info(`➡️  ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Capture response
  const oldJson = res.json;
  const oldSend = res.send;
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info(`⬅️  ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    // Log errors
    if (res.statusCode >= 400) {
      logger.error(`❌ ${req.method} ${req.originalUrl} ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        error: data
      });
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`🐌 SLOW REQUEST: ${req.method} ${req.originalUrl} ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }

    return oldJson.call(this, data);
  };

  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info(`⬅️  ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms (send)`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    return oldSend.call(this, data);
  };

  next();
};

// ============================================
// CUSTOM LOG METHODS
// ============================================
const customLogger = {
  // Standard log levels
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  verbose: (message, meta = {}) => logger.verbose(message, meta),
  silly: (message, meta = {}) => logger.silly(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),
  
  // Security logging
  security: (message, meta = {}) => {
    logger.info(`🔒 SECURITY: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'security',
      severity: meta.severity || 'info'
    });
  },
  
  // Business logging
  business: (message, meta = {}) => {
    logger.info(`💼 BUSINESS: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'business'
    });
  },
  
  // System logging
  system: (message, meta = {}) => {
    logger.info(`⚙️ SYSTEM: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'system'
    });
  },
  
  // Audit logging
  audit: (message, meta = {}) => {
    logger.info(`📋 AUDIT: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'audit'
    });
  },
  
  // Performance logging
  performance: (message, meta = {}) => {
    logger.info(`⚡ PERFORMANCE: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'performance'
    });
  },
  
  // Database logging
  database: (message, meta = {}) => {
    logger.info(`🗄️ DATABASE: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'database'
    });
  },
  
  // API logging
  api: (message, meta = {}) => {
    logger.info(`🌐 API: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'api'
    });
  },
  
  // Payment logging
  payment: (message, meta = {}) => {
    logger.info(`💳 PAYMENT: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'payment'
    });
  },
  
  // Emergency logging
  emergency: (message, meta = {}) => {
    logger.info(`🚑 EMERGENCY: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'emergency'
    });
  }
};

// ============================================
// DATABASE LOGGER HELPER
// ============================================
const dbLogger = (collection, operation, query, options = {}) => {
  const startTime = process.hrtime();
  
  return {
    finish: (result) => {
      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1000 + diff[1] / 1000000);
      
      logger.debug(`DATABASE: ${operation} on ${collection}`, {
        operation,
        collection,
        query,
        duration: `${duration.toFixed(2)}ms`,
        resultSize: result?.length || 0,
        ...options
      });

      if (duration > 100) {
        logger.performance(`Slow query: ${operation} on ${collection}`, {
          duration: `${duration.toFixed(2)}ms`,
          query
        });
      }
    },
    error: (error) => {
      logger.error(`DATABASE ERROR: ${operation} on ${collection}`, {
        operation,
        collection,
        query,
        error: error.message,
        stack: error.stack
      });
    }
  };
};

// ============================================
// MEMORY USAGE LOGGER
// ============================================
const logMemoryUsage = () => {
  const memory = process.memoryUsage();
  logger.debug('Memory usage', {
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`
  });
};

// ============================================
// EXPORT
// ============================================
module.exports = {
  logger: customLogger,
  requestLogger,
  dbLogger,
  logMemoryUsage,
  winston: logger // Export raw winston instance if needed
};
