// middleware/logger.js
const winston = require('winston');
const { format } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const { AuditLog } = require('../models/AuditLog');
const os = require('os');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: {
    service: 'emergency-system',
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    pid: process.pid
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    // Daily rotate file for errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // Access log
    new DailyRotateFile({
      filename: 'logs/access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// HTTP request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?._id || 'unauthenticated',
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  };

  logger.info(`REQUEST: ${req.method} ${req.originalUrl}`, logData);

  // Capture response
  const oldJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    const responseLog = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?._id || 'unauthenticated'
    };

    if (res.statusCode >= 400) {
      logger.error(`RESPONSE: ${req.method} ${req.originalUrl}`, {
        ...responseLog,
        error: data
      });
    } else {
      logger.info(`RESPONSE: ${req.method} ${req.originalUrl}`, responseLog);
    }

    // Log to audit trail for important actions
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      AuditLog.logAction({
        action: req.method.toLowerCase(),
        resource: req.originalUrl.split('/')[2] || 'unknown',
        userId: req.user?._id || null,
        details: {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          params: req.params,
          query: req.query,
          statusCode: res.statusCode,
          responseTime: responseTime
        },
        status: res.statusCode < 400 ? 'success' : 'failure',
        severity: res.statusCode >= 500 ? 'error' : 
                 res.statusCode >= 400 ? 'warning' : 'info'
      }).catch(err => logger.error('Audit log error:', err));
    }

    return oldJson.call(this, data);
  };

  next();
};

// Performance logging
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = process.hrtime();
    
    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const responseTime = diff[0] * 1000 + diff[1] / 1000000; // Convert to ms
      
      if (responseTime > threshold) {
        logger.warn(`Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`, {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          threshold: `${threshold}ms`
        });
      }
    });
    
    next();
  };
};

// Database query logger
const dbLogger = (collection, operation, query, options = {}) => {
  const startTime = process.hrtime();
  
  return {
    finish: (result) => {
      const diff = process.hrtime(startTime);
      const duration = diff[0] * 1000 + diff[1] / 1000000;
      
      logger.debug('Database operation', {
        collection,
        operation,
        query,
        duration: `${duration}ms`,
        resultSize: result?.length || 0,
        ...options
      });
    },
    error: (error) => {
      logger.error('Database error', {
        collection,
        operation,
        query,
        error: error.message
      });
    }
  };
};

// Custom log methods
const customLogger = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  verbose: (message, meta = {}) => logger.verbose(message, meta),
  
  // Security logs
  security: (message, meta = {}) => {
    logger.info(`SECURITY: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'security'
    });
  },
  
  // Business logic logs
  business: (message, meta = {}) => {
    logger.info(`BUSINESS: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'business'
    });
  },
  
  // System logs
  system: (message, meta = {}) => {
    logger.info(`SYSTEM: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'system'
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  dbLogger,
  customLogger
};
