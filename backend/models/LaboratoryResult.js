/**
 * ============================================
 * LABORATORYRESULT.JS - Laboratory Result Model
 * ============================================
 */

const mongoose = require('mongoose');

const laboratoryResultSchema = new mongoose.Schema(
  {
    resultId: {
      type: String,
      unique: true,
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    testName: {
      type: String,
      required: true,
      trim: true
    },
    testCode: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['Hematology', 'Chemistry', 'Microbiology', 'Immunology', 'Pathology', 'Molecular', 'Urinalysis', 'Other'],
      default: 'Other'
    },
    specimen: {
      type: {
        type: String,
        enum: ['Blood', 'Urine', 'Stool', 'CSF', 'Sputum', 'Tissue', 'Swab', 'Other'],
        default: 'Blood'
      },
      collectionDate: { type: Date },
      collectionTime: { type: String },
      collectedBy: { type: String, trim: true }
    },
    results: [{
      parameter: { type: String, trim: true },
      value: { type: String, trim: true },
      unit: { type: String, trim: true },
      referenceRange: { type: String, trim: true },
      isAbnormal: { type: Boolean, default: false },
      flag: { type: String, enum: ['High', 'Low', 'Critical', 'Normal'], default: 'Normal' }
    }],
    interpretation: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    attachments: [{
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      type: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Verified', 'Released', 'Cancelled'],
      default: 'Pending'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    releasedAt: {
      type: Date
    },
    isAbnormal: {
      type: Boolean,
      default: false
    },
    criticalFlags: [{
      parameter: { type: String, trim: true },
      value: { type: String, trim: true },
      message: { type: String, trim: true }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
laboratoryResultSchema.index({ resultId: 1 });
laboratoryResultSchema.index({ order: 1 });
laboratoryResultSchema.index({ patient: 1 });
laboratoryResultSchema.index({ doctor: 1 });
laboratoryResultSchema.index({ testName: 1 });
laboratoryResultSchema.index({ status: 1 });
laboratoryResultSchema.index({ isAbnormal: 1 });

const LaboratoryResult = mongoose.model('LaboratoryResult', laboratoryResultSchema);

module.exports = LaboratoryResult;
