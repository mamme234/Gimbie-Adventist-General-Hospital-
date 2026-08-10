// routes/seed.js
const express = require('express');
const router = express.Router();

// ============================================
// SEED ROUTES
// ============================================

// Test endpoint
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🌱 Seed routes are working!',
        timestamp: new Date().toISOString(),
        available: {
            staff: 'POST /api/seed/staff',
            status: 'GET /api/seed/status',
            clear: 'DELETE /api/seed/clear?confirm=YES'
        }
    });
});

// Get seed status
router.get('/status', async (req, res) => {
    try {
        const User = require('../models/User');
        const Staff = require('../models/Staff');
        
        const totalUsers = await User.countDocuments();
        const totalStaff = await Staff.countDocuments();
        const staffByRole = await Staff.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalStaff,
                staffByRole,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Seed staff
router.post('/staff', async (req, res) => {
    try {
        const User = require('../models/User');
        const Staff = require('../models/Staff');
        
        const staffData = [
            {
                fullName: 'Dr. Daniel Bekele',
                email: 'daniel.bekele@gimbiehospital.com',
                password: 'Admin@2026#Secure$Gimbie',
                role: 'admin',
                department: 'Administration',
                employeeNumber: 'GAH-ADM-001',
                title: 'Hospital Administrator'
            },
            {
                fullName: 'Dr. Michael Abebe',
                email: 'michael.abebe@gimbiehospital.com',
                password: 'DrMike@GP2026#Gimbie!',
                role: 'doctor',
                department: 'General Medicine',
                employeeNumber: 'GAH-DR-001',
                title: 'General Practitioner'
            },
            {
                fullName: 'Almaz Tesfaye',
                email: 'almaz.tesfaye@gimbiehospital.com',
                password: 'Almaz@NurseMgr2026#Gimbie',
                role: 'nurse',
                department: 'Nursing',
                employeeNumber: 'GAH-NUR-001',
                title: 'Nurse Manager'
            }
        ];

        const results = [];
        for (const staff of staffData) {
            try {
                let user = await User.findOne({ email: staff.email });
                if (!user) {
                    user = await User.create({
                        fullName: staff.fullName,
                        email: staff.email,
                        password: staff.password,
                        role: staff.role,
                        department: staff.department,
                        isActive: true
                    });
                }

                let staffRecord = await Staff.findOne({ email: staff.email });
                if (!staffRecord) {
                    staffRecord = await Staff.create({
                        userId: user._id,
                        employeeNumber: staff.employeeNumber,
                        fullName: staff.fullName,
                        email: staff.email,
                        role: staff.role,
                        department: staff.department,
                        title: staff.title || '',
                        isActive: true
                    });
                }

                results.push({
                    email: staff.email,
                    status: 'success',
                    user: user._id,
                    staff: staffRecord._id
                });
            } catch (error) {
                results.push({
                    email: staff.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Staff seeding completed',
            data: results
        });

    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Clear seed data
router.delete('/clear', async (req, res) => {
    try {
        const { confirm } = req.query;
        if (confirm !== 'YES') {
            return res.status(400).json({
                success: false,
                message: 'Please confirm with ?confirm=YES'
            });
        }

        const User = require('../models/User');
        const Staff = require('../models/Staff');

        const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
        const deletedStaff = await Staff.deleteMany({ role: { $ne: 'admin' } });

        res.status(200).json({
            success: true,
            message: 'Staff data cleared successfully',
            data: {
                deletedUsers: deletedUsers.deletedCount,
                deletedStaff: deletedStaff.deletedCount
            }
        });
    } catch (error) {
        console.error('Clear seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
