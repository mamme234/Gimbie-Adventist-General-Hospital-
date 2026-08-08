const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    fullName: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: String,
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
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
    allergies: [String],
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
    documents: [{
        name: String,
        type: String,
        url: String,
        uploadedAt: Date,
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Deceased'],
        default: 'Active',
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Patient', PatientSchema);
