// config/logger.js - FIXED
/**
 * ============================================
 * LOGGER.JS - Logging Configuration
 * ============================================
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // File transport - all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // File transport - error logs only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport only in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
} else {
  // In production, also log to console but without colors
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Create a child logger with additional context
 */
const createChildLogger = (context, metadata = {}) => {
  return logger.child({ context, ...metadata });
};

/**
 * Log HTTP request
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
    };

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode}`, logData);
    } else {
      logger.info(`HTTP ${res.statusCode}`, logData);
    }
  });

  next();
};

/**
 * Log database query
 */
const logDatabase = (operation, collection, query, duration) => {
  logger.debug('Database operation', {
    operation,
    collection,
    query,
    duration: `${duration}ms`,
  });
};

/**
 * Log API call
 */
const logApi = (endpoint, request, response, status, duration) => {
  logger.info('API call', {
    endpoint,
    status,
    duration: `${duration}ms`,
    requestSize: request ? JSON.stringify(request).length : 0,
    responseSize: response ? JSON.stringify(response).length : 0,
  });
};

/**
 * Log authentication event
 */
const logAuth = (event, userId, email, metadata = {}) => {
  logger.info(`Auth: ${event}`, {
    userId,
    email,
    ...metadata,
  });
};

/**
 * Log system event
 */
const logSystem = (event, data = {}) => {
  logger.info(`System: ${event}`, data);
};

module.exports = {
  logger,
  createChildLogger,
  requestLogger,
  logDatabase,
  logApi,
  logAuth,
  logSystem,
};
