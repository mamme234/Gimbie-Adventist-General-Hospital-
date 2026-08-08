// routes/index.js
const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const doctorRoutes = require('./doctor.routes');
const nurseRoutes = require('./nurse.routes');
const adminRoutes = require('./admin.routes');
const appointmentRoutes = require('./appointment.routes');
const departmentRoutes = require('./department.routes');
const laboratoryRoutes = require('./laboratory.routes');
const radiologyRoutes = require('./radiology.routes');
const pharmacyRoutes = require('./pharmacy.routes');
const emergencyRoutes = require('./emergency.routes');
const surgeryRoutes = require('./surgery.routes');
const wardRoutes = require('./ward.routes');
const bedRoutes = require('./bed.routes');
const billingRoutes = require('./billing.routes');
const paymentRoutes = require('./payment.routes');
const insuranceRoutes = require('./insurance.routes');
const hrRoutes = require('./hr.routes');
const payrollRoutes = require('./payroll.routes');
const inventoryRoutes = require('./inventory.routes');
const supplierRoutes = require('./supplier.routes');
const ambulanceRoutes = require('./ambulance.routes');
const telemedicineRoutes = require('./telemedicine.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const reportRoutes = require('./reports.routes');
const analyticsRoutes = require('./analytics.routes');
const galleryRoutes = require('./gallery.routes');
const newsRoutes = require('./news.routes');
const blogRoutes = require('./blog.routes');
const eventRoutes = require('./event.routes');
const contactRoutes = require('./contact.routes');
const settingsRoutes = require('./settings.routes');
const uploadRoutes = require('./upload.routes');
const dashboardRoutes = require('./dashboard.routes');
const aiRoutes = require('./ai.routes'); // <-- AI ROUTES ADDED

// ============================================
// AUTH MIDDLEWARE
// ============================================
const auth = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.use('/auth', authRoutes);
router.use('/uploads', express.static('uploads'));

// ============================================
// BANKS INFORMATION (Public)
// ============================================
router.get('/banks', (req, res) => {
  const paymentConfig = require('../config/payment');
  const banks = paymentConfig.getEnabledBanks ? paymentConfig.getEnabledBanks() : [];
  res.json({
    success: true,
    data: banks.map(bank => ({
      id: bank.shortName.toLowerCase(),
      name: bank.name,
      shortName: bank.shortName,
      logo: bank.logo,
      supportedMethods: bank.supportedMethods,
      description: bank.description
    })),
    defaultCurrency: paymentConfig.defaultCurrency || 'ETB',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// HEALTH CHECK (Public)
// ============================================
router.get('/health', (req, res) => {
  const config = require('../config/server');
  const paymentConfig = require('../config/payment');
  
  res.json({
    success: true,
    status: 'ok',
    hospital: config.hospital?.name || 'Gimbie Adventist General Hospital',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../package.json').version,
    banks: paymentConfig.getEnabledBanks ? paymentConfig.getEnabledBanks().map(b => b.shortName) : []
  });
});

// ============================================
// AI STATUS (Public - no auth required)
// ============================================
const aiService = require('../services/ai.service');
router.get('/ai/status', (req, res) => {
  res.json({
    success: true,
    aiAvailable: aiService.isAvailable(),
    geminiEnabled: process.env.AI_ENABLED === 'true',
    model: process.env.GEMINI_MODEL || 'gemini-pro'
  });
});

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================
router.use(auth.authenticate);

// ============================================
// PATIENT MANAGEMENT
// ============================================
router.use('/patients', patientRoutes);

// ============================================
// STAFF MANAGEMENT
// ============================================
router.use('/doctors', doctorRoutes);
router.use('/nurses', nurseRoutes);
router.use('/admin', adminRoutes);

// ============================================
// APPOINTMENTS & SCHEDULING
// ============================================
router.use('/appointments', appointmentRoutes);
router.use('/departments', departmentRoutes);

// ============================================
// CLINICAL SERVICES
// ============================================
router.use('/laboratory', laboratoryRoutes);
router.use('/radiology', radiologyRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/surgery', surgeryRoutes);

// ============================================
// WARD & BED MANAGEMENT
// ============================================
router.use('/wards', wardRoutes);
router.use('/beds', bedRoutes);

// ============================================
// FINANCIAL MANAGEMENT
// ============================================
router.use('/billing', billingRoutes);
router.use('/payments', paymentRoutes);
router.use('/insurance', insuranceRoutes);

// ============================================
// HUMAN RESOURCES
// ============================================
router.use('/hr', hrRoutes);
router.use('/payroll', payrollRoutes);

// ============================================
// INVENTORY & SUPPLY CHAIN
// ============================================
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', supplierRoutes);

// ============================================
// EMERGENCY SERVICES
// ============================================
router.use('/ambulance', ambulanceRoutes);

// ============================================
// TELEMEDICINE
// ============================================
router.use('/telemedicine', telemedicineRoutes);

// ============================================
// COMMUNICATION
// ============================================
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);

// ============================================
// REPORTS & ANALYTICS
// ============================================
router.use('/reports', reportRoutes);
router.use('/analytics', analyticsRoutes);

// ============================================
// CONTENT MANAGEMENT
// ============================================
router.use('/gallery', galleryRoutes);
router.use('/news', newsRoutes);
router.use('/blog', blogRoutes);
router.use('/events', eventRoutes);

// ============================================
// CONTACTS & SETTINGS
// ============================================
router.use('/contacts', contactRoutes);
router.use('/settings', settingsRoutes);

// ============================================
// FILE UPLOADS
// ============================================
router.use('/upload', uploadRoutes);

// ============================================
// DASHBOARD
// ============================================
router.use('/dashboard', dashboardRoutes);

// ============================================
// AI ROUTES (Gemini AI Integration)
// ============================================
router.use('/ai', aiRoutes);

// ============================================
// ERROR HANDLING FOR ROUTES
// ============================================
router.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED'
    });
  }
  next(err);
});

module.exports = router;
