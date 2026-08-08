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
            'patient'
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
            'Emergency'
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
}, {
    timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
