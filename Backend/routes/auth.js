const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    logout,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

// Admin only routes
router.post('/admin/register', protect, authorize('super_admin', 'admin'), register);

module.exports = router;
