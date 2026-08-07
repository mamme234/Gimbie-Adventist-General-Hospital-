// middleware/errorHandler.js
const { logger, customLogger } = require('./logger');
const { AuditLog } = require('../models/AuditLog');
const mongoose = require('mongoose');

class AppError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = {
  // Main error handler
  handle: (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?._id || null,
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Check if error is operational
    if (!err.isOperational) {
      customLogger.error('Non-operational error', {
        error: err,
        stack: err.stack,
        url: req.originalUrl
      });
    }

    // Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate value for ${field}`,
        code: 'DUPLICATE_ERROR',
        field
      });
    }

    // Mongoose cast error
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${err.path}: ${err.value}`,
        code: 'CAST_ERROR',
        field: err.path
      });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // JWT expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Multer errors
    if (err.name === 'MulterError') {
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'UPLOAD_ERROR'
      });
    }

    // Custom AppError
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
        details: err.details
      });
    }

    // Unknown errors
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    res.status(statusCode).json({
      success: false,
      message: message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    });

    // Log to audit for critical errors
    if (statusCode >= 500) {
      AuditLog.logAction({
        action: 'error',
        resource: 'system',
        userId: req.user?._id || null,
        details: {
          error: err.message,
          stack: err.stack,
          url: req.originalUrl,
          method: req.method
        },
        status: 'error',
        severity: 'critical'
      }).catch(err => logger.error('Audit log error:', err));
    }
  },

  // 404 handler
  notFound: (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    });
  },

  // Async handler wrapper
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  // Custom error factory
  createError: (message, statusCode, code, details = {}) => {
    return new AppError(message, statusCode, code, details);
  },

  // Common error creators
  badRequest: (message, code = 'BAD_REQUEST') => {
    return new AppError(message, 400, code);
  },
  
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') => {
    return new AppError(message, 401, code);
  },
  
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') => {
    return new AppError(message, 403, code);
  },
  
  notFound: (message = 'Not found', code = 'NOT_FOUND') => {
    return new AppError(message, 404, code);
  },
  
  conflict: (message = 'Conflict', code = 'CONFLICT') => {
    return new AppError(message, 409, code);
  },
  
  validation: (message = 'Validation failed', details) => {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  },
  
  database: (message = 'Database error', code = 'DATABASE_ERROR') => {
    return new AppError(message, 500, code);
  },
  
  external: (message = 'External service error', code = 'EXTERNAL_ERROR') => {
    return new AppError(message, 503, code);
  }
};

module.exports = {
  AppError,
  errorHandler
};
