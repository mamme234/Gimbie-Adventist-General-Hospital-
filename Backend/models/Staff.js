const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    staffId: {
        type: String,
        unique: true,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    position: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Volunteer'],
        default: 'Full-time',
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: Date,
    salary: {
        amount: Number,
        currency: {
            type: String,
            default: 'ETB',
        },
        frequency: {
            type: String,
            enum: ['Monthly', 'Bi-weekly', 'Weekly', 'Hourly'],
            default: 'Monthly',
        },
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number,
        country: String,
    }],
    certifications: [{
        name: String,
        issuingAuthority: String,
        issueDate: Date,
        expiryDate: Date,
    }],
    languages: [String],
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
    },
    schedule: {
        shift: {
            type: String,
            enum: ['Morning', 'Afternoon', 'Night', 'Rotating'],
        },
        daysOff: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        }],
    },
    status: {
        type: String,
        enum: ['Active', 'On Leave', 'Suspended', 'Terminated', 'Resigned'],
        default: 'Active',
    },
    documents: [{
        name: String,
        type: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    }],
}, {
    timestamps: true,
});

// ===== INDEXES =====
StaffSchema.index({ staffId: 1 });
StaffSchema.index({ department: 1 });
StaffSchema.index({ position: 1 });
StaffSchema.index({ status: 1 });

module.exports = mongoose.model('Staff', StaffSchema);
