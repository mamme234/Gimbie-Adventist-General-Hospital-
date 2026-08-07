// middleware/errorHandler.js
const { logger } = require('../utils/logger');
const { AuditLog } = require('../models/AuditLog');

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
  handle: (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?._id || null
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
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
    if (err.name === 'CastError') {
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
  },

  notFound: (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    });
  },

  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  createError: (message, statusCode, code, details = {}) => {
    return new AppError(message, statusCode, code, details);
  },

  badRequest: (message = 'Bad request', code = 'BAD_REQUEST') => {
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
  }
};

module.exports = {
  AppError,
  errorHandler
};
