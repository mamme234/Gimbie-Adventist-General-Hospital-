// routes/seed.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { seedAllStaff } = require('../controllers/seedController');

// ============================================
// SEED ROUTES
// ============================================

// @desc    Seed all staff from seed file
// @route   POST /api/seed/staff
// @access  Private (Super Admin only)
router.post('/staff', protect, authorize('super_admin'), seedAllStaff);

// @desc    Seed specific department
// @route   POST /api/seed/department/:department
// @access  Private (Super Admin only)
router.post('/department/:department', protect, authorize('super_admin'), seedAllStaff);

// @desc    Seed single staff member
// @route   POST /api/seed/single
// @access  Private (Super Admin only)
router.post('/single', protect, authorize('super_admin'), seedAllStaff);

// @desc    Check seed status
// @route   GET /api/seed/status
// @access  Private (Super Admin only)
router.get('/status', protect, authorize('super_admin'), async (req, res) => {
    try {
        const User = require('../models/User');
        const total = await User.countDocuments();
        res.status(200).json({
            success: true,
            data: {
                totalUsers: total,
                message: 'Seed status checked'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
