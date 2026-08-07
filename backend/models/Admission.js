/**
 * ============================================
 * ADMISSION.JS - Admission Model
 * ============================================
 */

const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      unique: true,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed'
    },
    admissionDate: {
      type: Date,
      default: Date.now
    },
    admissionType: {
      type: String,
      enum: ['Emergency', 'Scheduled', 'Transfer', 'Referral'],
      default: 'Scheduled'
    },
    admittingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    admittingNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse'
    },
    diagnosis: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Discharged', 'Transferred', 'Cancelled'],
      default: 'Active'
    },
    dischargeDate: {
      type: Date
    },
    dischargeType: {
      type: String,
      enum: ['Recovered', 'Transferred', 'Left Against Advice', 'Deceased', 'Other'],
      default: 'Recovered'
    },
    dischargeSummary: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
admissionSchema.index({ admissionId: 1 });
admissionSchema.index({ patient: 1 });
admissionSchema.index({ ward: 1 });
admissionSchema.index({ bed: 1 });
admissionSchema.index({ admissionDate: -1 });
admissionSchema.index({ status: 1 });
admissionSchema.index({ admissionType: 1 });

const Admission = mongoose.model('Admission', admissionSchema);

module.exports = Admission;
