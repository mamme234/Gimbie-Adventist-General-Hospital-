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
};    const transports = [
      // Console transport
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        ),
        level: process.env.LOG_LEVEL || 'info'
      }),
      // Error log file
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat
      }),
      // Combined log file
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat
      }),
      // Access log file
      new DailyRotateFile({
        filename: 'logs/access-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat
      })
    ];

    // Add exception handlers
    const exceptionHandlers = [
      new DailyRotateFile({
        filename: 'logs/exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
      })
    ];

    // Add rejection handlers
    const rejectionHandlers = [
      new DailyRotateFile({
        filename: 'logs/rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat
      })
    ];

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      levels: this.logLevels,
      format: logFormat,
      transports,
      exceptionHandlers,
      rejectionHandlers,
      defaultMeta: {
        service: 'emergency-system',
        environment: process.env.NODE_ENV || 'development',
        hostname: os.hostname(),
        pid: process.pid
      }
    });
  }

  // Basic logging methods
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  silly(message, meta = {}) {
    this.logger.silly(message, meta);
  }

  // Specialized logging methods
  security(message, meta = {}) {
    this.logger.info(`SECURITY: ${message}`, {
      ...meta,
      category: 'security',
      timestamp: new Date().toISOString()
    });
  }

  business(message, meta = {}) {
    this.logger.info(`BUSINESS: ${message}`, {
      ...meta,
      category: 'business',
      timestamp: new Date().toISOString()
    });
  }

  system(message, meta = {}) {
    this.logger.info(`SYSTEM: ${message}`, {
      ...meta,
      category: 'system',
      timestamp: new Date().toISOString()
    });
  }

  audit(message, meta = {}) {
    this.logger.info(`AUDIT: ${message}`, {
      ...meta,
      category: 'audit',
      timestamp: new Date().toISOString()
    });
  }

  performance(message, meta = {}) {
    this.logger.info(`PERFORMANCE: ${message}`, {
      ...meta,
      category: 'performance',
      timestamp: new Date().toISOString()
    });
  }

  // Request logging
  logRequest(req, res, next) {
    const startTime = Date.now();

    // Log request
    this.info(`REQUEST: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id || 'unauthenticated',
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params
    });

    // Capture response
    const oldSend = res.send;
    res.send = (data) => {
      const responseTime = Date.now() - startTime;
      
      // Log response
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userId: req.user?._id || 'unauthenticated'
      };

      if (res.statusCode >= 400) {
        this.error(`RESPONSE: ${req.method} ${req.url}`, logData);
      } else {
        this.info(`RESPONSE: ${req.method} ${req.url}`, logData);
      }

      // Log slow requests
      if (responseTime > 1000) {
        this.performance(`Slow request: ${req.method} ${req.url}`, {
          responseTime: `${responseTime}ms`,
          threshold: '1000ms'
        });
      }

      return oldSend.call(this, data);
    };

    next();
  }

  // Database logging
  logDatabase(operation, collection, query, options = {}) {
    const startTime = process.hrtime();

    return {
      finish: (result) => {
        const diff = process.hrtime(startTime);
        const duration = (diff[0] * 1000 + diff[1] / 1000000);
        
        this.debug(`DATABASE: ${operation} on ${collection}`, {
          operation,
          collection,
          query: this.sanitizeQuery(query),
          duration: `${duration.toFixed(2)}ms`,
          resultSize: result?.length || 0,
          ...options
        });

        // Log slow queries
        if (duration > 100) {
          this.performance(`Slow query: ${operation} on ${collection}`, {
            duration: `${duration.toFixed(2)}ms`,
            query: this.sanitizeQuery(query)
          });
        }
      },
      error: (error) => {
        this.error(`DATABASE ERROR: ${operation} on ${collection}`, {
          operation,
          collection,
          query: this.sanitizeQuery(query),
          error: error.message,
          stack: error.stack
        });
      }
    };
  }

  // Sanitize body for logging
  sanitizeBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Sanitize query for logging
  sanitizeQuery(query) {
    if (!query) return query;
    
    const sanitized = { ...query };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Log memory usage
  logMemoryUsage() {
    const memory = process.memoryUsage();
    this.debug('Memory usage', {
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`
    });
  }

  // Log system metrics
  logSystemMetrics() {
    const cpus = os.cpus();
    const load = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    this.info('System metrics', {
      cpu: {
        cores: cpus.length,
        loadAverage: load[0]
      },
      memory: {
        total: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2)} GB`
      },
      uptime: `${(os.uptime() / 3600).toFixed(2)} hours`
    });
  }

  // Create child logger
  child(meta) {
    const childLogger = this.logger.child(meta);
    return {
      error: (message, additionalMeta) => childLogger.error(message, { ...meta, ...additionalMeta }),
      warn: (message, additionalMeta) => childLogger.warn(message, { ...meta, ...additionalMeta }),
      info: (message, additionalMeta) => childLogger.info(message, { ...meta, ...additionalMeta }),
      debug: (message, additionalMeta) => childLogger.debug(message, { ...meta, ...additionalMeta }),
      verbose: (message, additionalMeta) => childLogger.verbose(message, { ...meta, ...additionalMeta })
    };
  }

  // Get logger instance
  getLogger() {
    return this.logger;
  }
}

module.exports = new Logger();
