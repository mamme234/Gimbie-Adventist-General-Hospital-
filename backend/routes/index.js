// routes/index.js
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const doctorRoutes = require('./doctor.routes');
const nurseRoutes = require('./nurse.routes');
const adminRoutes = require('./admin.routes');
const appointmentRoutes = require('./appointment.routes');
const paymentRoutes = require('./payment.routes'); // <-- Add this

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication)
// ... other routes ...

// Payment routes
router.use('/payments', paymentRoutes); // <-- Add this

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hospital: 'Gimbie Adventist General Hospital',
    banks: require('../config/payment').getEnabledBanks().map(b => b.shortName)
  });
});

module.exports = router;
