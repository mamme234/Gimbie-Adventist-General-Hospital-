// models/Insurance.js
const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  providerName: { type: String, required: true },
  policyNumber: { type: String, required: true, unique: true },
  groupNumber: String,
  coverageType: {
    type: String,
    enum: ['basic', 'premium', 'comprehensive', 'government'],
    required: true
  },
  coverageDetails: {
    emergency: { type: Number, default: 80 },
    ambulance: { type: Number, default: 100 },
    hospitalization: { type: Number, default: 70 },
    medication: { type: Number, default: 50 }
  },
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  claims: [{
    claimId: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

InsuranceSchema.methods.validateCoverage = function(serviceType) {
  return this.coverageDetails[serviceType] || 0;
};

InsuranceSchema.methods.submitClaim = async function(emergencyId, amount) {
  // Submit claim to insurance provider API
  const claim = {
    claimId: `CLM-${Date.now()}`,
    amount: amount * (this.coverageDetails.emergency / 100),
    status: 'pending',
    date: new Date()
  };
  
  this.claims.push(claim);
  await this.save();
  return claim;
};

module.exports = mongoose.model('Insurance', InsuranceSchema);
