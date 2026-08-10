// routes/seed.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ============================================
// IMPORT STAFF DATA FROM config/scripts/seed.js
// ============================================
const { 
    staffData, 
    getAllStaff, 
    getStaffByDepartment, 
    getStaffByRole, 
    getStaffById,
    getLoginCredentials
} = require('../config/scripts/seed/staffSeed');

// ============================================
// @route   GET /api/seed
// @desc    Check if seed routes are working
// @access  Public
// ============================================
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🌱 Seed routes are working!',
        timestamp: new Date().toISOString(),
        available: {
            staff: 'POST /api/seed/staff - Seed all staff to Users',
            staffGet: 'GET /api/seed/staff - Get all staff from config',
            status: 'GET /api/seed/status - Get seed status',
            clear: 'DELETE /api/seed/clear?confirm=YES - Clear seed users',
            department: 'POST /api/seed/department/:dept - Seed by department',
            role: 'POST /api/seed/role/:role - Seed by role',
            single: 'POST /api/seed/single - Seed single staff member',
            credentials: 'GET /api/seed/credentials - Get all credentials'
        }
    });
});

// ============================================
// @route   GET /api/seed/staff
// @desc    Get all staff from config (not database)
// @access  Public
// ============================================
router.get('/staff', (req, res) => {
    try {
        const allStaff = getAllStaff();
        res.status(200).json({
            success: true,
            data: allStaff,
            count: allStaff.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Get staff error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   POST /api/seed/staff
// @desc    Seed all staff from config to Users collection
// @access  Public
// ============================================
router.post('/staff', async (req, res) => {
    try {
        const allStaff = getAllStaff();
        console.log(`📋 Seeding ${allStaff.length} staff members to Users...`);

        const results = {
            total: allStaff.length,
            created: 0,
            updated: 0,
            failed: 0,
            details: []
        };

        for (const staff of allStaff) {
            try {
                console.log(`👤 Processing: ${staff.fullName} (${staff.email})`);

                // Check if user exists
                let user = await User.findOne({ email: staff.email });
                let isNewUser = false;

                if (!user) {
                    user = await User.create({
                        fullName: staff.fullName,
                        email: staff.email,
                        password: staff.password,
                        role: staff.role,
                        department: staff.department,
                        phone: staff.phone || '',
                        isActive: true
                    });
                    isNewUser = true;
                    results.created++;
                    console.log(`✅ User created: ${staff.fullName}`);
                } else {
                    // Update existing user
                    user.fullName = staff.fullName;
                    user.role = staff.role;
                    user.department = staff.department;
                    user.phone = staff.phone || user.phone;
                    user.isActive = true;
                    await user.save();
                    results.updated++;
                    console.log(`🔄 User updated: ${staff.fullName}`);
                }

                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    role: staff.role,
                    department: staff.department,
                    staffId: staff.staffId,
                    status: isNewUser ? 'created' : 'updated',
                    userId: user._id
                });

            } catch (error) {
                results.failed++;
                console.error(`❌ Failed to seed ${staff.fullName}:`, error.message);
                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`✅ Seeding complete: ${results.created} created, ${results.updated} updated, ${results.failed} failed`);

        res.status(200).json({
            success: true,
            message: 'Staff seeding completed',
            data: results
        });

    } catch (error) {
        console.error('❌ Seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
});

// ============================================
// @route   POST /api/seed/department/:department
// @desc    Seed staff by department
// @access  Public
// ============================================
router.post('/department/:department', async (req, res) => {
    try {
        const { department } = req.params;
        const staffList = getStaffByDepartment(department);

        if (!staffList || staffList.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No staff found for department: ${department}`
            });
        }

        console.log(`📋 Seeding ${staffList.length} staff members in ${department}...`);

        const results = {
            department,
            total: staffList.length,
            created: 0,
            updated: 0,
            failed: 0,
            details: []
        };

        for (const staff of staffList) {
            try {
                let user = await User.findOne({ email: staff.email });
                let isNewUser = false;

                if (!user) {
                    user = await User.create({
                        fullName: staff.fullName,
                        email: staff.email,
                        password: staff.password,
                        role: staff.role,
                        department: staff.department,
                        phone: staff.phone || '',
                        isActive: true
                    });
                    isNewUser = true;
                    results.created++;
                } else {
                    user.fullName = staff.fullName;
                    user.role = staff.role;
                    user.department = staff.department;
                    user.phone = staff.phone || user.phone;
                    user.isActive = true;
                    await user.save();
                    results.updated++;
                }

                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    role: staff.role,
                    department: staff.department,
                    staffId: staff.staffId,
                    status: isNewUser ? 'created' : 'updated',
                    userId: user._id
                });

            } catch (error) {
                results.failed++;
                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Staff seeding completed for department: ${department}`,
            data: results
        });

    } catch (error) {
        console.error('❌ Department seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   POST /api/seed/role/:role
// @desc    Seed staff by role
// @access  Public
// ============================================
router.post('/role/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const staffList = getStaffByRole(role);

        if (!staffList || staffList.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No staff found with role: ${role}`
            });
        }

        console.log(`📋 Seeding ${staffList.length} staff members with role: ${role}...`);

        const results = {
            role,
            total: staffList.length,
            created: 0,
            updated: 0,
            failed: 0,
            details: []
        };

        for (const staff of staffList) {
            try {
                let user = await User.findOne({ email: staff.email });
                let isNewUser = false;

                if (!user) {
                    user = await User.create({
                        fullName: staff.fullName,
                        email: staff.email,
                        password: staff.password,
                        role: staff.role,
                        department: staff.department,
                        phone: staff.phone || '',
                        isActive: true
                    });
                    isNewUser = true;
                    results.created++;
                } else {
                    user.fullName = staff.fullName;
                    user.role = staff.role;
                    user.department = staff.department;
                    user.phone = staff.phone || user.phone;
                    user.isActive = true;
                    await user.save();
                    results.updated++;
                }

                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    role: staff.role,
                    department: staff.department,
                    staffId: staff.staffId,
                    status: isNewUser ? 'created' : 'updated',
                    userId: user._id
                });

            } catch (error) {
                results.failed++;
                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Staff seeding completed for role: ${role}`,
            data: results
        });

    } catch (error) {
        console.error('❌ Role seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   POST /api/seed/single
// @desc    Seed a single staff member
// @access  Public
// @body    { email, fullName, role, department, password, position, specialty, phone }
// ============================================
router.post('/single', async (req, res) => {
    try {
        const { email, fullName, role, department, password, position, specialty, phone } = req.body;

        if (!email || !fullName || !role || !department || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide: email, fullName, role, department, password'
            });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            user = await User.create({
                fullName,
                email,
                password,
                role,
                department,
                phone: phone || '',
                isActive: true
            });
            isNewUser = true;
        } else {
            user.fullName = fullName;
            user.role = role;
            user.department = department;
            user.phone = phone || user.phone;
            user.isActive = true;
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: 'Staff member seeded successfully',
            data: {
                email,
                fullName,
                role,
                department,
                status: isNewUser ? 'created' : 'updated',
                userId: user._id
            }
        });

    } catch (error) {
        console.error('❌ Single seed error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   GET /api/seed/status
// @desc    Get seed status (Users only, no Staff model)
// @access  Public
// ============================================
router.get('/status', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const usersByDepartment = await User.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        // Get total from config
        const totalConfigStaff = getAllStaff().length;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalConfigStaff,
                usersByRole,
                usersByDepartment,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   DELETE /api/seed/clear?confirm=YES
// @desc    Clear seeded users (only staff roles)
// @access  Public
// ============================================
router.delete('/clear', async (req, res) => {
    try {
        const { confirm } = req.query;
        if (confirm !== 'YES') {
            return res.status(400).json({
                success: false,
                message: '⚠️ Please confirm with ?confirm=YES'
            });
        }

        // Get all staff emails from config
        const allStaff = getAllStaff();
        const staffEmails = allStaff.map(s => s.email);

        // Delete users with staff emails
        const deletedUsers = await User.deleteMany({
            email: { $in: staffEmails }
        });

        res.status(200).json({
            success: true,
            message: '🧹 Staff users cleared successfully',
            data: {
                deletedUsers: deletedUsers.deletedCount
            }
        });
    } catch (error) {
        console.error('❌ Clear error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   DELETE /api/seed/reset
// @desc    Reset and reseed all staff
// @access  Public
// ============================================
router.delete('/reset', async (req, res) => {
    try {
        const { confirm } = req.query;
        if (confirm !== 'YES') {
            return res.status(400).json({
                success: false,
                message: '⚠️ Please confirm with ?confirm=YES'
            });
        }

        // Get all staff emails from config
        const allStaff = getAllStaff();
        const staffEmails = allStaff.map(s => s.email);

        // Delete existing users
        await User.deleteMany({ email: { $in: staffEmails } });

        // Reseed all staff
        const results = {
            total: allStaff.length,
            created: 0,
            failed: 0,
            details: []
        };

        for (const staff of allStaff) {
            try {
                await User.create({
                    fullName: staff.fullName,
                    email: staff.email,
                    password: staff.password,
                    role: staff.role,
                    department: staff.department,
                    phone: staff.phone || '',
                    isActive: true
                });
                results.created++;
                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    status: 'created'
                });
            } catch (error) {
                results.failed++;
                results.details.push({
                    email: staff.email,
                    fullName: staff.fullName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: '🔄 Staff reset and reseeded successfully',
            data: results
        });

    } catch (error) {
        console.error('❌ Reset error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   GET /api/seed/credentials
// @desc    Get all staff credentials (for testing)
// @access  Public
// ============================================
router.get('/credentials', (req, res) => {
    try {
        const credentials = getLoginCredentials();
        res.status(200).json({
            success: true,
            data: credentials,
            count: credentials.length
        });
    } catch (error) {
        console.error('❌ Credentials error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// @route   GET /api/seed/staff/:staffId
// @desc    Get staff by ID from config
// @access  Public
// ============================================
router.get('/staff/:staffId', (req, res) => {
    try {
        const { staffId } = req.params;
        const staff = getStaffById(staffId);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: `Staff not found with ID: ${staffId}`
            });
        }

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        console.error('❌ Get staff by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// CATCH-ALL 404 HANDLER
// ============================================
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `❌ Seed route not found: ${req.method} ${req.originalUrl}`,
        available: {
            'GET /api/seed': 'Check seed routes',
            'GET /api/seed/staff': 'Get all staff from config',
            'POST /api/seed/staff': 'Seed all staff to Users',
            'POST /api/seed/department/:dept': 'Seed by department',
            'POST /api/seed/role/:role': 'Seed by role',
            'POST /api/seed/single': 'Seed single staff member',
            'GET /api/seed/status': 'Get seed status',
            'GET /api/seed/credentials': 'Get all credentials',
            'GET /api/seed/staff/:staffId': 'Get staff by ID',
            'DELETE /api/seed/clear?confirm=YES': 'Clear seeded users',
            'DELETE /api/seed/reset?confirm=YES': 'Reset and reseed'
        }
    });
});

module.exports = router;
