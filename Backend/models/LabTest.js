const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
    testId: {
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
    testName: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: [
            'Hematology',
            'Biochemistry',
            'Microbiology',
            'Serology',
            'Immunology',
            'Urinalysis',
            'Stool Analysis',
            'Hormone',
            'Tumor Markers',
            'Genetic',
            'Other'
        ],
        required: true,
    },
    priority: {
        type: String,
        enum: ['Routine', 'Urgent', 'Emergency'],
        default: 'Routine',
    },
    sampleType: {
        type: String,
        enum: ['Blood', 'Urine', 'Stool', 'CSF', 'Sputum', 'Tissue', 'Swab', 'Other'],
        required: true,
    },
    sampleCollected: {
        type: Boolean,
        default: false,
    },
    sampleCollectedAt: Date,
    sampleCollectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    sampleReceivedAt: Date,
    results: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    resultEnteredAt: Date,
    resultEnteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resultVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resultVerifiedAt: Date,
    notes: String,
    status: {
        type: String,
        enum: ['Pending', 'Sample Collected', 'Processing', 'Completed', 'Verified', 'Cancelled'],
        default: 'Pending',
    },
    isAbnormal: {
        type: Boolean,
        default: false,
    },
    referenceRange: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('LabTest', LabTestSchema);
