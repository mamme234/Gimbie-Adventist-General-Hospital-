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
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            'https://gimbie-hospital.vercel.app',
            'https://gimbie-adventist-general-hospital.vercel.app',
            'https://gimbie-adventist-hospital.vercel.app',
            'https://gimbie-hospital.netlify.app',
            'https://gimbieadventist.com',
            'https://www.gimbieadventist.com',
            /\.onrender\.com$/,
            /\.vercel\.app$/,
        ];

        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') return origin === allowed;
            if (allowed instanceof RegExp) return allowed.test(origin);
            return false;
        });

        if (isAllowed || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn('⚠️ CORS blocked origin:', origin);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// ADDITIONAL CORS HEADERS (Fallback)
// ============================================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

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
// API ROUTES - MOUNT SEED FIRST
// ============================================
const routes = require('./routes');
const seedRoutes = require('./routes/seed');

// ⭐ MOUNT SEED ROUTES FIRST (BEFORE catch-all)
app.use('/api/seed', seedRoutes);

// ⭐ THEN MOUNT MAIN ROUTES
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
            nursing: '/api/nursing'
        },
    });
});

// ============================================
// 404 HANDLER FOR NON-API ROUTES
// ============================================
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // API routes - return JSON
        res.status(404).json({
            success: false,
            message: `API route not found: ${req.method} ${req.originalUrl}`,
            availableRoutes: [
                '/auth',
                '/patients',
                '/doctors',
                '/appointments',
                '/pharmacy',
                '/laboratory',
                '/radiology',
                '/billing',
                '/departments',
                '/testimonials',
                '/notifications',
                '/beds',
                '/staff',
                '/reports',
                '/dashboard',
                '/insurance',
                '/inventory',
                '/procurement',
                '/settings',
                '/upload',
                '/nursing',
                '/health',
                '/docs',
                '/seed'
            ]
        });
    } else {
        // Non-API routes
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    }
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('========================================');
    console.error('❌ ERROR:', err.message);
    console.error('📚 STACK:', err.stack);
    console.error('📁 PATH:', req.originalUrl);
    console.error('🔧 METHOD:', req.method);
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
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS error: ' + err.message
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
    console.log('📧 Doctor: michael.abebe@gimbiehospital.com');
    console.log('🔑 Password: DrMike@GP2026#Gimbie!');
    console.log('📧 Nurse: almaz.tesfaye@gimbiehospital.com');
    console.log('🔑 Password: Almaz@NurseMgr2026#Gimbie');
    console.log('========================================');
    console.log('✅ CORS enabled for:');
    console.log('   - gimbie-adventist-general-hospital.vercel.app');
    console.log('   - *.vercel.app');
    console.log('   - *.onrender.com');
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
    console.error('📚 Stack:', err.stack);
});

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
    console.error('📚 Stack:', err.stack);
});

module.exports = { app, server };
