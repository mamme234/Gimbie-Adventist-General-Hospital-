// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// ============================================
// IMPORT ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const pharmacyRoutes = require('./routes/pharmacy');
const laboratoryRoutes = require('./routes/laboratory');
const billingRoutes = require('./routes/billing');
const departmentRoutes = require('./routes/departments');
const testimonialRoutes = require('./routes/testimonials');
const notificationRoutes = require('./routes/notifications');
const bedRoutes = require('./routes/beds');
const staffRoutes = require('./routes/staff');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

// ============================================
// INITIALIZE APP
// ============================================
const app = express();

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
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// EXTRA CORS HEADERS
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
// MIDDLEWARE
// ============================================
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// REQUEST LOGGING
// ============================================
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
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
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        cors: 'Enabled'
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
            appointments: '/api/appointments'
        }
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate value for ${field}`
        });
    }

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

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// ============================================
// DATABASE CONNECTION
// ============================================
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbie_hospital');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log('='.repeat(60));
    });
};

startServer();

module.exports = { app };
