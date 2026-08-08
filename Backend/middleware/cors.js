const cors = require('cors');

/**
 * CORS configuration
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Allow all origins in development
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }
        
        // Production: check against allowed origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            callback(null, true);
            return;
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
};

/**
 * CORS middleware
 */
const corsMiddleware = cors(corsOptions);

module.exports = {
    corsMiddleware,
    corsOptions,
};
