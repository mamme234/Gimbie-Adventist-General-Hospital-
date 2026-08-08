/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not found error handler
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route not found - ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `Duplicate field value: ${field}. Please use another value.`;
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = `Validation error: ${messages.join(', ')}`;
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token. Please login again.', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired. Please login again.', 401);
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new AppError('File too large. Maximum size is 5MB.', 400);
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error = new AppError('Too many files. Maximum is 5.', 400);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = new AppError('Unexpected file field.', 400);
    }

    // Send response
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err,
        }),
    });
};

/**
 * Async handler - Wraps async functions to catch errors
 * @param   {Function} fn - Async function
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    notFound,
    errorHandler,
    asyncHandler,
};
