// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// ============================================
// IMPORT ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const billingRoutes = require('./routes/billingRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bedRoutes = require('./routes/bedRoutes');
const staffRoutes = require('./routes/staffRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ============================================
// INITIALIZE APP
// ============================================
const app = express();

// ============================================
// CORS CONFIGURATION - FIXED FOR VERCEL
// ============================================
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            // Local development
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5000',
            
            // Vercel deployments
            'https://gimbie-hospital.vercel.app',
            'https://gimbie-adventist-general-hospital.vercel.app', // ← YOUR VERCEL URL
            'https://gimbie-adventist-hospital.vercel.app',
            
            // Netlify deployments
            'https://gimbie-hospital.netlify.app',
            
            // Custom domains
            'https://gimbieadventist.com',
            'https://www.gimbieadventist.com',
            
            // Allow all Render.com subdomains (backend)
            /\.onrender\.com$/,
            
            // Allow all Vercel subdomains (for preview deployments)
            /\.vercel\.app$/,
        ];

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            }
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ============================================
// ADDITIONAL CORS HEADERS (Fallback)
// ============================================
app.use((req, res, next) => {
    // Set CORS headers for all responses
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ============================================
// MIDDLEWARE
// ============================================
// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
}));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// REQUEST LOGGING
// ============================================
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('📦 Body:', JSON.stringify(req.body).substring(0, 200));
    }
    next();
});

// ============================================
// API ROUTES
// ============================================
const API_PREFIX = '/api';

// Public routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/testimonials`, testimonialRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentRoutes);

// Protected routes
app.use(`${API_PREFIX}/patients`, patientRoutes);
app.use(`${API_PREFIX}/doctors`, doctorRoutes);
app.use(`${API_PREFIX}/pharmacy`, pharmacyRoutes);
app.use(`${API_PREFIX}/laboratory`, laboratoryRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/beds`, bedRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        memory: process.memoryUsage(),
        version: process.version,
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        cors: 'Enabled',
        allowedOrigins: [
            'http://localhost:3000',
            'https://gimbie-adventist-general-hospital.vercel.app',
            '*.vercel.app',
            '*.onrender.com'
        ]
    });
});

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'Gimbie Adventist General Hospital API',
        version: '1.0.0',
        status: 'Running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/health',
            api: '/api',
            auth: '/api/auth',
            appointments: '/api/appointments',
            patients: '/api/patients',
            doctors: '/api/doctors'
        },
        documentation: 'https://github.com/your-repo/hospital-api'
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`,
        availableRoutes: [
            '/api/auth',
            '/api/patients',
            '/api/doctors',
            '/api/appointments',
            '/api/pharmacy',
            '/api/laboratory',
            '/api/billing',
            '/api/departments',
            '/api/testimonials',
            '/api/notifications',
            '/api/beds',
            '/api/staff',
            '/api/reports',
            '/api/admin'
        ]
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Global error:', err.message);
    console.error('📚 Stack:', err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: messages
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for ${field}. Please use a different value.`,
            field: field
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired. Please login again.'
        });
    }

    // CORS error
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS error: ' + err.message
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// DATABASE CONNECTION
// ============================================
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbie_hospital', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔗 Connection string: ${process.env.MONGODB_URI ? 'Using environment variable' : 'Using default localhost'}`);
        
        // Log collections
        try {
            const collections = await conn.connection.db.listCollections().toArray();
            console.log(`📁 Collections (${collections.length}):`, collections.map(c => c.name).join(', '));
        } catch (e) {
            console.log('⚠️ Could not list collections');
        }
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️ Continuing without database...');
        // Don't exit process, keep running for API testing
    }
};

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect to database
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`🚀 Gimbie Adventist Hospital API`);
        console.log(`📡 Running on: http://localhost:${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        console.log('='.repeat(60));
        console.log(`📖 Health check: http://localhost:${PORT}/health`);
        console.log(`📖 API root: http://localhost:${PORT}/api`);
        console.log(`📖 Auth: http://localhost:${PORT}/api/auth`);
        console.log(`📖 Appointments: http://localhost:${PORT}/api/appointments`);
        console.log('='.repeat(60));
        console.log('✅ CORS enabled for:');
        console.log('   - localhost:*');
        console.log('   - gimbie-adventist-general-hospital.vercel.app');
        console.log('   - *.vercel.app');
        console.log('   - *.onrender.com');
        console.log('='.repeat(60));
        console.log('✅ Server is ready!');
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\n🛑 Received shutdown signal');
        server.close(async () => {
            console.log('📡 HTTP server closed');
            await mongoose.connection.close();
            console.log('📊 Database connection closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
};

// ============================================
// HANDLE UNCAUGHT EXCEPTIONS
// ============================================
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    console.error('📚 Stack:', error.stack);
    // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise);
    console.error('📚 Reason:', reason);
});

// ============================================
// START THE APP
// ============================================
startServer();

// ============================================
// EXPORT FOR TESTING
// ============================================
module.exports = { app, startServer };
