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
    validateCredentials, 
    getStaffPayload,
    findStaffByEmail,
    getAllStaff 
} = require('../config/staff');

// ============================================
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ============================================
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phone, role, department } = req.body;

        console.log('Registration attempt for:', email);

        // Check if user exists in hardcoded staff
        const hardcodedStaff = findStaffByEmail(email);
        if (hardcodedStaff) {
            return res.status(400).json({
                success: false,
                message: 'This email is reserved for hospital staff. Please use the provided credentials.',
            });
        }

        // Check if user exists in database
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create user
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            phone,
            role: role || 'patient',
            department,
            isActive: true,
        });

        console.log('User created:', user._id);

        // If role is patient, create patient profile
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
            
            console.log('Patient profile created:', patient.patientId);
            
            // Update user with patientId
            user.patientId = patient.patientId;
            await user.save();
        }

        // Generate staff ID for staff roles
        if (role && role !== 'patient') {
            user.staffId = user.generateStaffId();
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
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Login user - WITH HARDCODED STAFF SUPPORT
// @route   POST /api/auth/login
// @access  Public
// ============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email);

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // ============================================
        // STEP 1: CHECK HARDCODED STAFF FIRST
        // ============================================
        const hardcodedStaff = validateCredentials(email, password);

        if (hardcodedStaff) {
            console.log('✅ Hardcoded staff login success:', hardcodedStaff.fullName);

            // Generate JWT token
            const token = generateToken(hardcodedStaff.id, hardcodedStaff.role);

            // Get user data
            const userData = getStaffPayload(hardcodedStaff);

            return res.status(200).json({
                success: true,
                message: 'Login successful (Staff)',
                token,
                user: {
                    id: userData.id,
                    fullName: userData.fullName,
                    email: userData.email,
                    role: userData.role,
                    staffId: userData.employeeNumber,
                    phone: userData.phone,
                    department: userData.department,
                    title: userData.title,
                    specialty: userData.specialty || null,
                    isActive: true,
                    isHardcoded: true,
                },
            });
        }

        // ============================================
        // STEP 2: CHECK DATABASE USERS
        // ============================================
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        console.log('Database user found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials - User not found',
            });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.',
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        console.log('Password match:', isPasswordMatch);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials - Wrong password',
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Get patientId if patient
        let patientId = null;
        if (user.role === 'patient') {
            const patient = await Patient.findOne({ userId: user._id });
            if (patient) {
                patientId = patient.patientId;
            }
        }

        // Generate token
        const token = generateToken(user._id, user.role);

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
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// ============================================
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        // ============================================
        // CHECK IF IT'S HARDCODED STAFF
        // ============================================
        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.id === userId);

        if (hardcodedStaff) {
            const userData = getStaffPayload(hardcodedStaff);
            return res.status(200).json({
                success: true,
                user: {
                    ...userData,
                    isHardcoded: true,
                },
            });
        }

        // ============================================
        // CHECK DATABASE USER
        // ============================================
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get patientId if patient
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
        
        // Check if hardcoded staff
        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.id === req.user.id);

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

        // Update patient profile if patient
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

        // Check if hardcoded staff
        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.id === req.user.id);

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

        // Check hardcoded staff first
        const hardcodedStaff = findStaffByEmail(email);
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

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        console.log('Reset token for', user.email, ':', resetToken);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to email',
            token: resetToken, // Remove in production
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

        // Check hardcoded staff
        const allStaff = getAllStaff();
        const hardcodedStaff = allStaff.find(s => s.id === userId);

        if (hardcodedStaff) {
            return res.status(200).json({
                success: true,
                user: {
                    id: hardcodedStaff.id,
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

// ============================================
// @desc    Get all hardcoded staff (Admin only)
// @route   GET /api/auth/staff
// @access  Private/Admin
// ============================================
exports.getAllHardcodedStaff = async (req, res) => {
    try {
        // Check if user is admin
        const allStaff = getAllStaff();
        const currentUser = allStaff.find(s => s.id === req.user.id);
        
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.',
            });
        }

        const staffList = allStaff.map(s => ({
            id: s.id,
            fullName: s.fullName,
            email: s.email,
            role: s.role,
            department: s.department,
            employeeNumber: s.employeeNumber,
            title: s.title,
            phone: s.phone,
            isActive: s.isActive,
        }));

        res.status(200).json({
            success: true,
            data: staffList,
            total: staffList.length,
        });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
