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
    getLoginCredentials,
    getStaffByRole,
    getStaffById
} = require('../config/seed/staffSeed');

// ============================================
// @desc    Login user
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

        // STEP 1: CHECK HARDCODED STAFF FIRST
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

        // STEP 2: CHECK DATABASE USERS
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
};

// ============================================
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ============================================
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phone, role, department } = req.body;

        console.log('📝 Registration attempt for:', email);

        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (hardcodedStaff) {
            return res.status(400).json({
                success: false,
                message: 'This email is reserved for hospital staff. Please use the provided credentials.',
            });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            phone,
            role: role || 'patient',
            department,
            isActive: true,
        });

        console.log('✅ User created:', user._id);

        if (user.role === 'patient') {
            const patient = await Patient.create({
                patientId: generatePatientId(),
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                registeredBy: user._id,
                status: 'Active',
            });
            
            console.log('✅ Patient profile created:', patient.patientId);
            
            user.patientId = patient.patientId;
            await user.save();
        }

        if (role && role !== 'patient') {
            user.staffId = `GAH-${Date.now()}`;
            await user.save();
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully! Please login.',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                patientId: user.patientId || null,
            },
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get current user - FIXED: added async
// @route   GET /api/auth/me
// @access  Private
// ============================================
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const hardcodedStaff = getStaffById(userId);

        if (hardcodedStaff) {
            return res.status(200).json({
                success: true,
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

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        let patientId = null;
        if (user.role === 'patient') {
            const patient = await Patient.findOne({ userId: user._id });
            if (patient) {
                patientId = patient.patientId;
            }
        }

        res.status(200).json({
            success: true,
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
                preferences: user.preferences,
                isActive: user.isActive,
                isHardcoded: false,
            },
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, phone, preferences } = req.body;
        
        const hardcodedStaff = getStaffById(req.user.id);

        if (hardcodedStaff) {
            return res.status(403).json({
                success: false,
                message: 'Hardcoded staff profiles cannot be modified. Contact administrator.',
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        if (user.role === 'patient') {
            const patient = await Patient.findOne({ userId: user._id });
            if (patient) {
                if (fullName) patient.fullName = fullName;
                if (phone) patient.phone = phone;
                await patient.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                preferences: user.preferences,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const hardcodedStaff = getStaffById(req.user.id);

        if (hardcodedStaff) {
            return res.status(403).json({
                success: false,
                message: 'Hardcoded staff passwords cannot be changed. Contact administrator.',
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isPasswordMatch = await user.comparePassword(currentPassword);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email',
            });
        }

        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (hardcodedStaff) {
            return res.status(403).json({
                success: false,
                message: 'This is a hardcoded staff account. Please contact administrator for password reset.',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email',
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        console.log('Reset token for', user.email, ':', resetToken);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to email',
            token: resetToken,
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide token and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
// ============================================
exports.logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
// ============================================
exports.verifyToken = async (req, res) => {
    try {
        const userId = req.user.id;

        const hardcodedStaff = getStaffById(userId);

        if (hardcodedStaff) {
            return res.status(200).json({
                success: true,
                user: {
                    id: hardcodedStaff.staffId,
                    fullName: hardcodedStaff.fullName,
                    email: hardcodedStaff.email,
                    role: hardcodedStaff.role,
                    isActive: true,
                    isHardcoded: true,
                },
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                isHardcoded: false,
            },
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
