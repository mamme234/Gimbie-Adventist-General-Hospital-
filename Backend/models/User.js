// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    role: {
        type: String,
        enum: [
            'super_admin',
            'admin',
            'doctor',
            'nurse',
            'pharmacist',
            'lab_technician',
            'radiologist',
            'accountant',
            'receptionist',
            'hr_manager',
            'inventory_manager',
            'procurement_manager',
            'patient',
        ],
        default: 'patient',
    },
    department: {
        type: String,
        enum: [
            'Administration',
            'Medical',
            'Nursing',
            'Pharmacy',
            'Laboratory',
            'Radiology',
            'Finance',
            'HR',
            'Inventory',
            'Procurement',
            'OPD',
            'Inpatient',
            'Emergency',
            'Health Information',
            'Community Outreach',
        ],
    },
    staffId: {
        type: String,
        unique: true,
        sparse: true,
    },
    profileImage: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    preferences: {
        language: {
            type: String,
            enum: ['English', 'Afaan Oromo', 'Amharic'],
            default: 'English',
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light',
        },
    },
}, {
    timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate staff ID based on role
UserSchema.methods.generateStaffId = function() {
    const roleMap = {
        'super_admin': 'SUP',
        'admin': 'ADM',
        'doctor': 'DR',
        'nurse': 'NUR',
        'pharmacist': 'PHA',
        'lab_technician': 'LAB',
        'radiologist': 'RAD',
        'accountant': 'ACC',
        'receptionist': 'REC',
        'hr_manager': 'HR',
        'inventory_manager': 'INV',
        'procurement_manager': 'PRO',
    };
    const prefix = roleMap[this.role] || 'STA';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GAH-${prefix}-${random}`;
};

// Virtual for full name with title
UserSchema.virtual('fullNameWithTitle').get(function() {
    const titles = {
        'doctor': 'Dr.',
        'nurse': 'Nurse',
        'pharmacist': 'Pharm.',
        'lab_technician': 'Lab Tech',
        'radiologist': 'Dr.',
    };
    const title = titles[this.role] || '';
    return title ? `${title} ${this.fullName}` : this.fullName;
});

// Ensure indexes are properly defined - remove duplicate indexes
UserSchema.index({ email: 1 });
UserSchema.index({ staffId: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
