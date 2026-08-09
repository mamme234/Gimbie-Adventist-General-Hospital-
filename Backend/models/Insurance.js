const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
    insuranceId: {
        type: String,
        unique: true,
        required: true,
        // REMOVED: index: true
    },
    provider: {
        type: String,
        required: true,
        trim: true,
    },
    providerCode: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['Private', 'Government', 'NGO', 'Community', 'International'],
        required: true,
    },
    coverage: [{
        service: String,
        percentage: Number,
        maxAmount: Number,
    }],
    contactInfo: {
        phone: String,
        email: String,
        address: String,
        website: String,
    },
    policyNumber: String,
    expiryDate: Date,
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    coverageDetails: {
        annualLimit: Number,
        deductible: Number,
        copay: Number,
        coinsurance: Number,
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Suspended', 'Cancelled'],
        default: 'Active',
    },
    notes: String,
}, {
    timestamps: true,
});

// ===== INDEXES - Defined once here =====
InsuranceSchema.index({ insuranceId: 1 });
InsuranceSchema.index({ provider: 1 });
InsuranceSchema.index({ patient: 1 });
InsuranceSchema.index({ status: 1 });

// Method to check coverage
InsuranceSchema.methods.checkCoverage = function(service, amount) {
    const coverage = this.coverage.find(c => c.service === service);
    if (!coverage) return { covered: false, reason: 'Service not covered' };
    
    const coveredAmount = (amount * coverage.percentage) / 100;
    const maxAmount = coverage.maxAmount || this.coverageDetails.annualLimit || Infinity;
    
    return {
        covered: true,
        coveredAmount: Math.min(coveredAmount, maxAmount),
        percentage: coverage.percentage,
        maxAmount: coverage.maxAmount,
    };
};

module.exports = mongoose.model('Insurance', InsuranceSchema);
