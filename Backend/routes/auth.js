// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register, getMe, getCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);
router.get('/credentials', getCredentials); // ← ADD THIS

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
