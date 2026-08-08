// routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const auth = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Triage emergency using AI
router.post('/triage', auth.authenticate, async (req, res) => {
  try {
    const result = await aiService.triageEmergency(req.body);
    res.json({
      success: true,
      data: result,
      aiAvailable: aiService.isAvailable()
    });
  } catch (error) {
    logger.error('AI Triage error:', error);
    res.status(500).json({
      success: false,
      message: 'AI triage failed',
      error: error.message
    });
  }
});

// Analyze patient condition
router.post('/analyze', auth.authenticate, async (req, res) => {
  try {
    const { vitals, symptoms, history } = req.body;
    const result = await aiService.analyzePatientCondition(vitals, symptoms, history);
    res.json({
      success: true,
      data: result,
      aiAvailable: aiService.isAvailable()
    });
  } catch (error) {
    logger.error('AI Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: error.message
    });
  }
});

// Predict emergency volume
router.post('/predict', auth.authenticate, async (req, res) => {
  try {
    const result = await aiService.predictEmergencyVolume(req.body);
    res.json({
      success: true,
      data: result,
      aiAvailable: aiService.isAvailable()
    });
  } catch (error) {
    logger.error('AI Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'AI prediction failed',
      error: error.message
    });
  }
});

// Generate health insights
router.post('/insights', auth.authenticate, async (req, res) => {
  try {
    const result = await aiService.generateHealthInsights(req.body);
    res.json({
      success: true,
      data: result,
      aiAvailable: aiService.isAvailable()
    });
  } catch (error) {
    logger.error('AI Insights error:', error);
    res.status(500).json({
      success: false,
      message: 'AI insights failed',
      error: error.message
    });
  }
});

// Check AI status
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    aiAvailable: aiService.isAvailable(),
    geminiEnabled: process.env.AI_ENABLED === 'true',
    model: process.env.GEMINI_MODEL || 'gemini-pro'
  });
});

module.exports = router;
