// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Login validation
const loginValidation = [
  validate.body({
    email: { type: 'string', required: true, email: true },
    password: { type: 'string', required: true, min: 6 }
  })
];

// Register validation
const registerValidation = [
  validate.body({
    firstName: { type: 'string', required: true, min: 2, max: 50 },
    lastName: { type: 'string', required: true, min: 2, max: 50 },
    email: { type: 'string', required: true, email: true },
    password: { type: 'string', required: true, min: 8 },
    phone: { type: 'string', required: true },
    role: { type: 'string', enum: ['patient', 'doctor', 'nurse', 'admin'] }
  })
];

// Forgot password validation
const forgotPasswordValidation = [
  validate.body({
    email: { type: 'string', required: true, email: true }
  })
];

// Reset password validation
const resetPasswordValidation = [
  validate.body({
    token: { type: 'string', required: true },
    password: { type: 'string', required: true, min: 8 }
  })
];

// Change password validation (FIXED: Only declared once)
const changePasswordValidation = [
  validate.body({
    currentPassword: { type: 'string', required: true },
    newPassword: { type: 'string', required: true, min: 8 }
  })
];

// Refresh token validation
const refreshTokenValidation = [
  validate.body({
    refreshToken: { type: 'string', required: true }
  })
];

// ============================================
// ROUTES
// ============================================

// Public routes
router.post('/login', loginValidation, rateLimiter.createAuth(), authController.login);
router.post('/register', registerValidation, rateLimiter.createAuth(), authController.register);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

// Protected routes (require authentication)
router.use(authController.authenticate);

// Change password
router.put('/change-password', changePasswordValidation, authController.changePassword);

// Logout
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authController.getCurrentUser);

// Update profile
router.put('/profile', authController.updateProfile);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Resend verification
router.post('/resend-verification', authController.resendVerification);

// Enable 2FA
router.post('/2fa/enable', authController.enable2FA);

// Verify 2FA
router.post('/2fa/verify', authController.verify2FA);

// Disable 2FA
router.post('/2fa/disable', authController.disable2FA);

module.exports = router;
