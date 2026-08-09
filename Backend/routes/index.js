const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const nursingRoutes = require('./nursing');
const pharmacyRoutes = require('./pharmacy');
const laboratoryRoutes = require('./laboratory');
const radiologyRoutes = require('./radiology');
const billingRoutes = require('./billing');
const inventoryRoutes = require('./inventory');
const staffRoutes = require('./staff');
const bedRoutes = require('./beds');
const reportRoutes = require('./reports');
const departmentRoutes = require('./departments');
const testimonialRoutes = require('./testimonials');
const notificationRoutes = require('./notifications');
const insuranceRoutes = require('./insurance');
const procurementRoutes = require('./procurement');
const settingsRoutes = require('./settings');
const uploadRoutes = require('./upload');
const dashboardRoutes = require('./dashboard');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/nursing', nursingRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/laboratory', laboratoryRoutes);
router.use('/radiology', radiologyRoutes);
router.use('/billing', billingRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/staff', staffRoutes);
router.use('/beds', bedRoutes);
router.use('/reports', reportRoutes);
router.use('/departments', departmentRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/procurement', procurementRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        hospital: 'Gimbie Adventist General Hospital',
        version: '1.0.0',
    });
});

module.exports = router;
