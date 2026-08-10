// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { seedStaff } = require('./config/scripts/seed/seedRunner');

// Load environment variables
dotenv.config();

// ============================================
// DATABASE CONNECTION
// ============================================
connectDB();

const app = express();

// ============================================
// TRUST PROXY (FOR RENDER)
// ============================================
app.set('trust proxy', 1);

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
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
}));

// ============================================
// RATE LIMITING
// ============================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || 'unknown';
    },
});

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

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
// REQUEST LOGGING
// ============================================
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        next();
    });
}

// ============================================
// SEED STAFF ON SERVER START
// ============================================
// This will run once when the server starts
// It will NOT overwrite existing accounts
(async function initStaff() {
    try {
        console.log('🔄 Checking staff database...');
        await seedStaff();
        console.log('✅ Staff seeding complete!');
    } catch (error) {
        console.error('❌ Staff seeding error:', error.message);
    }
})();

// ============================================
// API ROUTES
// ============================================
const routes = require('./routes');
const seedRoutes = require('./routes/seed');

app.use('/api', routes);
app.use('/api/seed', seedRoutes); // ← ADDED SEED ROUTES

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gimbie Adventist General Hospital API',
        version: '1.0.0',
        status: 'Online',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            docs: '/api/docs',
            seed: '/api/seed',
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
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
        },
        staffCredentials: {
            admin: {
                email: 'daniel.bekele@gimbiehospital.com',
                password: 'Admin@2026#Secure$Gimbie'
            },
            doctor: {
                email: 'michael.abebe@gimbiehospital.com',
                password: 'DrMike@GP2026#Gimbie!'
            },
            nurse: {
                email: 'almaz.tesfaye@gimbiehospital.com',
                password: 'Almaz@NurseMgr2026#Gimbie'
            }
        },
        endpoints: {
            seed: {
                path: '/seed',
                description: 'Seed endpoints (Super Admin only)',
                routes: [
                    { method: 'POST', path: '/staff', description: 'Seed all staff from seed file' },
                    { method: 'POST', path: '/department/:department', description: 'Seed staff by department' },
                    { method: 'POST', path: '/single', description: 'Seed single staff member' },
                    { method: 'GET', path: '/status', description: 'Check seed status' },
                ],
            },
            auth: {
                path: '/auth',
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
            appointments: {
                path: '/appointments',
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
            patients: {
                path: '/patients',
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
            doctors: {
                path: '/doctors',
                description: 'Doctor management',
                routes: [
                    { method: 'GET', path: '/', description: 'Get all doctors' },
                    { method: 'GET', path: '/:id', description: 'Get doctor' },
                    { method: 'GET', path: '/by-department/:department', description: 'Get doctors by department' },
                ],
            },
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
            'POST /api/appointments/book',
            'GET /api/appointments',
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
    console.log(`🌱 Seed: https://alpha-af1q.onrender.com/api/seed`);
    console.log('========================================');
    console.log('👨‍⚕️ Staff accounts seeded with strong passwords');
    console.log('📧 Admin: daniel.bekele@gimbiehospital.com');
    console.log('🔑 Password: Admin@2026#Secure$Gimbie');
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
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

module.exports = { app, server };
