// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const routes = require('./routes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
    'https://gimbie-hospital.vercel.app',
    'https://gimbie-hospital-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'https://alpha-af1q.onrender.com',
    process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('Blocked CORS request from:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
}));

// ============================================
// RATE LIMITING
// ============================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    skipSuccessfulRequests: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ============================================
// BODY PARSER
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// REQUEST LOGGING (Development only)
// ============================================
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        next();
    });
}

// ============================================
// API ROUTES
// ============================================
app.use('/api', routes);

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gimbie Adventist General Hospital API',
        version: '1.0.0',
        status: 'Online',
        endpoints: {
            health: '/api/health',
            docs: '/api/docs',
            auth: '/api/auth',
            patients: '/api/patients',
            doctors: '/api/doctors',
            appointments: '/api/appointments',
            pharmacy: '/api/pharmacy',
            laboratory: '/api/laboratory',
            radiology: '/api/radiology',
            billing: '/api/billing',
            inventory: '/api/inventory',
            staff: '/api/staff',
            beds: '/api/beds',
            reports: '/api/reports',
            departments: '/api/departments',
            testimonials: '/api/testimonials',
            notifications: '/api/notifications',
            insurance: '/api/insurance',
            procurement: '/api/procurement',
            settings: '/api/settings',
            upload: '/api/upload',
            dashboard: '/api/dashboard',
        },
    });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        hospital: 'Gimbie Adventist General Hospital',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    });
});

// ============================================
// API DOCS
// ============================================
app.get('/api/docs', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gimbie Adventist General Hospital API Documentation',
        version: '1.0.0',
        baseUrl: 'https://alpha-af1q.onrender.com/api',
        endpoints: [
            {
                path: '/auth',
                methods: ['POST'],
                description: 'Authentication endpoints',
                routes: [
                    { method: 'POST', path: '/register', description: 'Register new user' },
                    { method: 'POST', path: '/login', description: 'Login user' },
                    { method: 'GET', path: '/me', description: 'Get current user (Authenticated)' },
                    { method: 'PUT', path: '/profile', description: 'Update profile (Authenticated)' },
                    { method: 'PUT', path: '/change-password', description: 'Change password (Authenticated)' },
                    { method: 'POST', path: '/forgot-password', description: 'Forgot password' },
                    { method: 'POST', path: '/reset-password', description: 'Reset password' },
                    { method: 'POST', path: '/logout', description: 'Logout (Authenticated)' },
                ],
            },
            {
                path: '/appointments',
                methods: ['GET', 'POST'],
                description: 'Appointment management',
                routes: [
                    { method: 'POST', path: '/book', description: 'Book appointment (Public)' },
                    { method: 'GET', path: '/', description: 'Get all appointments (Authenticated)' },
                    { method: 'POST', path: '/', description: 'Create appointment (Authenticated)' },
                    { method: 'GET', path: '/:id', description: 'Get appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id', description: 'Update appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id/cancel', description: 'Cancel appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id/reschedule', description: 'Reschedule appointment (Authenticated)' },
                    { method: 'GET', path: '/today', description: 'Get today\'s appointments (Authenticated)' },
                    { method: 'GET', path: '/queue', description: 'Get appointment queue (Authenticated)' },
                ],
            },
            {
                path: '/patients',
                methods: ['GET', 'POST'],
                description: 'Patient management',
                routes: [
                    { method: 'GET', path: '/me', description: 'Get current patient (Authenticated)' },
                    { method: 'GET', path: '/', description: 'Get all patients (Authenticated)' },
                    { method: 'POST', path: '/', description: 'Create patient (Authenticated)' },
                    { method: 'GET', path: '/:id', description: 'Get patient (Authenticated)' },
                    { method: 'PUT', path: '/:id', description: 'Update patient (Authenticated)' },
                    { method: 'GET', path: '/:id/appointments', description: 'Get patient appointments (Authenticated)' },
                    { method: 'GET', path: '/:id/bills', description: 'Get patient bills (Authenticated)' },
                    { method: 'GET', path: '/:id/history', description: 'Get patient history (Authenticated)' },
                ],
            },
        ],
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            login: 'POST /api/auth/login',
        },
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'GET /api/docs',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/appointments',
            'POST /api/appointments/book',
            'GET /api/patients',
            'GET /api/doctors',
        ],
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('========================================');
    console.error('ERROR:', err.message);
    console.error('STACK:', err.stack);
    console.error('PATH:', req.originalUrl);
    console.error('METHOD:', req.method);
    console.error('BODY:', req.body);
    console.error('========================================');

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for ${field}. Please use a different value.`,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: messages,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired. Please login again.',
        });
    }

    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS not allowed for this origin',
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err,
        }),
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

// Import mongoose for health check
const mongoose = require('mongoose');

const server = app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 SERVER STARTED SUCCESSFULLY');
    console.log('========================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Hospital: Gimbie Adventist General Hospital`);
    console.log(`📅 Established: 1948`);
    console.log(`🔗 API URL: https://alpha-af1q.onrender.com`);
    console.log(`📚 Docs: https://alpha-af1q.onrender.com/api/docs`);
    console.log(`❤️ Health: https://alpha-af1q.onrender.com/api/health`);
    console.log('========================================');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('🛑 Server closed');
        mongoose.connection.close(false, () => {
            console.log('📦 Database connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('🛑 Server closed');
        mongoose.connection.close(false, () => {
            console.log('📦 Database connection closed');
            process.exit(0);
        });
    });
});

// ============================================
// UNHANDLED REJECTIONS
// ============================================
process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION:', err);
    // Don't crash the server, just log
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
    // Don't crash the server, just log
});

// Export for testing
module.exports = { app, server };
