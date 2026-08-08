const mongoose = require('mongoose');

const RadiologySchema = new mongoose.Schema({
    radiologyId: {
        type: String,
        unique: true,
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    examType: {
        type: String,
        enum: ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Mammogram', 'DEXA', 'PET Scan', 'Other'],
        required: true,
    },
    bodyPart: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['Routine', 'Urgent', 'Emergency'],
        default: 'Routine',
    },
    scheduledDate: Date,
    scheduledTime: String,
    images: [{
        url: String,
        description: String,
        uploadedAt: Date,
    }],
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    performedAt: Date,
    report: {
        findings: String,
        impression: String,
        recommendations: String,
    },
    reportGeneratedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reportGeneratedAt: Date,
    status: {
        type: String,
        enum: ['Scheduled', 'In Progress', 'Completed', 'Reported', 'Cancelled'],
        default: 'Scheduled',
    },
    notes: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Radiology', RadiologySchema);
