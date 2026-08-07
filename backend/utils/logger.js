// utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom file transport with rotation
const fileTransport = new winston.transports.File({
  filename: path.join(logDir, 'error.log'),
  level: 'error',
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  tailable: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

const combinedFileTransport = new winston.transports.File({
  filename: path.join(logDir, 'combined.log'),
  maxsize: 10485760, // 10MB
  maxFiles: 5,
  tailable: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
    })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),
    // Error file transport
    fileTransport,
    // Combined file transport
    combinedFileTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`REQUEST: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Capture response
  const oldJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info(`RESPONSE: ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`
    });

    // Log errors
    if (res.statusCode >= 400) {
      logger.error(`ERROR: ${req.method} ${req.originalUrl} ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        error: data
      });
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }

    return oldJson.call(this, data);
  };

  next();
};

// Custom log methods
const customLogger = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  verbose: (message, meta = {}) => logger.verbose(message, meta),
  silly: (message, meta = {}) => logger.silly(message, meta),
  
  // Security logs
  security: (message, meta = {}) => {
    logger.info(`SECURITY: ${message}`, {
      ...meta,
      timestamp: new Date().toISOString(),
      type: 'security'
    });
  },
  
  // Business logs
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
  logger: customLogger,
  requestLogger,
  winston: logger
};
