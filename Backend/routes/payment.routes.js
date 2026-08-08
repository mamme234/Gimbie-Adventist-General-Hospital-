// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const paymentConfig = require('../config/payment');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Get available banks
router.get('/banks', auth.authenticate, (req, res) => {
  try {
    const banks = paymentConfig.getEnabledBanks();
    res.json({
      success: true,
      banks: banks.map(bank => ({
        name: bank.name,
        shortName: bank.shortName,
        logo: bank.logo,
        supportedMethods: bank.supportedMethods,
        description: bank.description
      }))
    });
  } catch (error) {
    logger.error('Get banks error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Initiate payment
router.post('/initiate', auth.authenticate, async (req, res) => {
  try {
    const {
      amount,
      currency,
      bank,
      paymentMethod,
      description,
      metadata
    } = req.body;

    const result = await paymentService.processPayment({
      amount,
      currency,
      bankName: bank,
      customerId: req.user._id,
      customerName: `${req.user.firstName} ${req.user.lastName}`,
      customerEmail: req.user.email,
      customerPhone: req.user.phone,
      paymentMethod,
      description,
      metadata
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Initiate payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Check payment status
router.get('/status/:transactionId', auth.authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const status = await paymentService.checkPaymentStatus(transactionId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Check payment status error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Refund payment
router.post('/refund', auth.authenticate, async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const result = await paymentService.refundPayment(transactionId, amount);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Webhook handlers
router.post('/webhook/cbe', async (req, res) => {
  try {
    const result = await paymentService.handleWebhook('cbe', req.body);
    res.json(result);
  } catch (error) {
    logger.error('CBE webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/webhook/telebirr', async (req, res) => {
  try {
    const result = await paymentService.handleWebhook('telebirr', req.body);
    res.json(result);
  } catch (error) {
    logger.error('Telebirr webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/webhook/awash', async (req, res) => {
  try {
    const result = await paymentService.handleWebhook('awash', req.body);
    res.json(result);
  } catch (error) {
    logger.error('Awash webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/webhook/coop', async (req, res) => {
  try {
    const result = await paymentService.handleWebhook('coop', req.body);
    res.json(result);
  } catch (error) {
    logger.error('Coop webhook error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
