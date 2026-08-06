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
  winston.format.json(),
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
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
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

// If not in production, also log to console with simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

/**
 * Create a child logger with additional context
 * @param {string} context - Context name (e.g., 'AuthService')
 * @param {Object} metadata - Additional metadata
 * @returns {winston.Logger}
 */
const createChildLogger = (context, metadata = {}) => {
  return logger.child({ context, ...metadata });
};

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
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
 * @param {string} operation - Database operation
 * @param {string} collection - Collection name
 * @param {Object} query - Query object
 * @param {number} duration - Duration in ms
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
 * @param {string} endpoint - API endpoint
 * @param {Object} request - Request data
 * @param {Object} response - Response data
 * @param {number} status - HTTP status
 * @param {number} duration - Duration in ms
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
 * @param {string} event - Event type (login, logout, etc.)
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {Object} metadata - Additional metadata
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
 * @param {string} event - Event type
 * @param {Object} data - Event data
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
