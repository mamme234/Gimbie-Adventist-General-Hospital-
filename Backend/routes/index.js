// routes/index.js
const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const pharmacyRoutes = require('./pharmacy');
const laboratoryRoutes = require('./laboratory');
const billingRoutes = require('./billing');
const departmentRoutes = require('./departments');
const testimonialRoutes = require('./testimonials');
const notificationRoutes = require('./notifications');
const bedRoutes = require('./beds');
const staffRoutes = require('./staff');
const reportsRoutes = require('./reports');
const dashboardRoutes = require('./dashboard');
const insuranceRoutes = require('./insurance');
const inventoryRoutes = require('./inventory');
const procurementRoutes = require('./procurement');
const radiologyRoutes = require('./radiology');
const settingsRoutes = require('./settings');
const uploadRoutes = require('./upload');
const nursingRoutes = require('./nursing');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/laboratory', laboratoryRoutes);
router.use('/billing', billingRoutes);
router.use('/departments', departmentRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/beds', bedRoutes);
router.use('/staff', staffRoutes);
router.use('/reports', reportsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/procurement', procurementRoutes);
router.use('/radiology', radiologyRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/nursing', nursingRoutes);

// Health check (already in server.js, but can also be here)
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'API is healthy'
    });
});

module.exports = router;
