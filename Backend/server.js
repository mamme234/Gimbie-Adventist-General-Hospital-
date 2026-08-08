// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json());

// ===== IMPORT ROUTES =====
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const nursingRoutes = require('./routes/nursing');
const pharmacyRoutes = require('./routes/pharmacy');
const laboratoryRoutes = require('./routes/laboratory');
const radiologyRoutes = require('./routes/radiology');
const billingRoutes = require('./routes/billing');
const inventoryRoutes = require('./routes/inventory');
const staffRoutes = require('./routes/staff');
const bedRoutes = require('./routes/beds');
const reportRoutes = require('./routes/reports');
const departmentRoutes = require('./routes/departments');
const testimonialRoutes = require('./routes/testimonials');
const notificationRoutes = require('./routes/notifications');
const insuranceRoutes = require('./routes/insurance');
const procurementRoutes = require('./routes/procurement');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');

// ===== MOUNT ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/nursing', nursingRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/radiology', radiologyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        hospital: 'Gimbie Adventist General Hospital',
        message: 'API is running successfully!'
    });
});

// ===== ROOT =====
app.get('/', (req, res) => {
    res.json({
        message: 'Gimbie Adventist General Hospital API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            patients: '/api/patients',
            doctors: '/api/doctors',
            appointments: '/api/appointments',
            pharmacy: '/api/pharmacy',
            laboratory: '/api/laboratory',
            billing: '/api/billing',
        }
    });
});

// ===== 404 Handler =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/patients',
            'GET /api/doctors',
            'GET /api/appointments',
        ]
    });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🏥 Hospital: Gimbie Adventist General Hospital`);
});
