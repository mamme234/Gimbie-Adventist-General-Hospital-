const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        required: true,
        // REMOVED: index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // REMOVED: index: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'Ethiopia',
        },
        zipCode: String,
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
        default: 'Unknown',
    },
    allergies: [{
        type: String,
        trim: true,
    }],
    medicalHistory: [{
        condition: String,
        diagnosis: String,
        date: Date,
        doctor: String,
        notes: String,
    }],
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['Active', 'Completed', 'Discontinued'],
            default: 'Active',
        },
    }],
    insurance: {
        provider: String,
        policyNumber: String,
        expiryDate: Date,
        coverage: String,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Pending'],
        default: 'Active',
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// ===== INDEXES - Defined once here =====
PatientSchema.index({ patientId: 1 });
PatientSchema.index({ userId: 1 });
PatientSchema.index({ fullName: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ email: 1 });

// Virtual for age
PatientSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
        age--;
    }
    return age;
});

// Method to get patient by userId
PatientSchema.statics.findByUserId = function(userId) {
    return this.findOne({ userId });
};

// Method to get patient by patientId
PatientSchema.statics.findByPatientId = function(patientId) {
    return this.findOne({ patientId });
};

module.exports = mongoose.model('Patient', PatientSchema);
