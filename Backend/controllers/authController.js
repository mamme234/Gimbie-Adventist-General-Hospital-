// controllers/authController.js
const User = require('../models/User');
const Patient = require('../models/Patient');
const { generateToken } = require('../config/auth');
const { generatePatientId } = require('../utils/generateId');
const crypto = require('crypto');

// ============================================
// IMPORT HARDCODED STAFF CREDENTIALS
// ============================================
const { 
    getAllStaff,
    getLoginCredentials
} = require('../config/scripts/seed');

// ============================================
// @desc    Login user - HARDCODED STAFF FIRST
// @route   POST /api/auth/login
// @access  Public
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 ========================================');
        console.log('🔐 LOGIN ATTEMPT');
        console.log('🔐 Email:', email);
        console.log('🔐 Password length:', password?.length || 0);
        console.log('🔐 ========================================');

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // ============================================
        // STEP 1: CHECK HARDCODED STAFF FIRST
        // ============================================
        console.log('🔍 Checking hardcoded staff...');
        const allStaff = getAllStaff();
        console.log(`🔍 Total staff in config: ${allStaff.length}`);
        
        const hardcodedStaff = allStaff.find(s => 
            s.email.toLowerCase() === email.toLowerCase() && 
            s.password === password
        );

        console.log('🔍 Hardcoded staff found:', hardcodedStaff ? '✅ YES' : '❌ NO');
        
        if (hardcodedStaff) {
            console.log('✅ Hardcoded staff login success:', hardcodedStaff.fullName);
            console.log('✅ Role:', hardcodedStaff.role);

            // Generate JWT token
            const token = generateToken(hardcodedStaff.staffId, hardcodedStaff.role);

            return res.status(200).json({
                success: true,
                message: 'Login successful (Staff)',
                token,
                user: {
                    id: hardcodedStaff.staffId,
                    fullName: hardcodedStaff.fullName,
                    email: hardcodedStaff.email,
                    role: hardcodedStaff.role,
                    staffId: hardcodedStaff.staffId,
                    phone: hardcodedStaff.phone || '',
                    department: hardcodedStaff.department,
                    position: hardcodedStaff.position || '',
                    specialty: hardcodedStaff.specialty || '',
                    isActive: true,
                    isHardcoded: true,
                },
            });
        }

        // ============================================
        // STEP 2: CHECK DATABASE USERS
        // ============================================
        console.log('🔍 Checking database users...');
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        console.log('🔍 Database user found:', user ? '✅ YES' : '❌ NO');

        if (!user) {
            console.log('❌ No user found in database');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.',
            });
        }

        console.log('🔍 Checking password...');
        const isPasswordMatch = await user.comparePassword(password);
        console.log('🔍 Password match:', isPasswordMatch ? '✅ YES' : '❌ NO');

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        user.lastLogin = new Date();
        await user.save();

        let patientId = null;
        if (user.role === 'patient') {
            const patient = await Patient.findOne({ userId: user._id });
            if (patient) {
                patientId = patient.patientId;
            }
        }

        const token = generateToken(user._id, user.role);

        console.log('✅ Database user login success:', user.fullName);

        res.status(200).json({
            success: true,
            message: 'Login successful (Database User)',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                staffId: user.staffId,
                phone: user.phone,
                department: user.department,
                profileImage: user.profileImage,
                patientId: patientId || user.patientId || null,
                lastLogin: user.lastLogin,
                isHardcoded: false,
            },
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get credentials (for testing)
// @route   GET /api/auth/credentials
// @access  Public
// ============================================
exports.getCredentials = async (req, res) => {
    try {
        const credentials = getLoginCredentials();
        res.status(200).json({
            success: true,
            data: credentials
        });
    } catch (error) {
        console.error('❌ Credentials error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ... rest of your auth functions (register, getMe, etc.)
