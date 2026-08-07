// routes/index.js
const express = require('express');
const router = express.Router();

// Import routes (simplified for now)
const authRoutes = require('./auth.routes');
const paymentRoutes = require('./payment.routes');

// ============================================
// PUBLIC ROUTES
// ============================================
router.use('/auth', authRoutes);

// ============================================
// PROTECTED ROUTES
// ============================================
// Add auth middleware here when ready
// router.use(auth.authenticate);

// ============================================
// PAYMENT ROUTES
// ============================================
router.use('/payments', paymentRoutes);

// ============================================
// BANKS INFORMATION
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
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
  const config = require('../config/server');
  const paymentConfig = require('../config/payment');
  
  res.json({
    success: true,
    status: 'ok',
    hospital: config.hospital.name || 'Gimbie Adventist General Hospital',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('../package.json').version,
    banks: paymentConfig.getEnabledBanks ? paymentConfig.getEnabledBanks().map(b => b.shortName) : []
  });
});

module.exports = router;
