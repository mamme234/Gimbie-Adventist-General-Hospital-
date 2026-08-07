/**
 * ============================================
 * BED.JS - Bed Model
 * ============================================
 */

const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    bedId: {
      type: String,
      unique: true,
      required: true
    },
    ward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['General', 'ICU', 'Maternity', 'Pediatrics', 'Isolation', 'Private', 'Semi-Private'],
      default: 'General'
    },
    features: [{
      type: String,
      trim: true
    }],
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
      default: 'Available'
    },
    assignedAt: {
      type: Date
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maintenanceReason: {
      type: String,
      trim: true
    },
    estimatedReturn: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
bedSchema.index({ bedId: 1 });
bedSchema.index({ ward: 1 });
bedSchema.index({ bedNumber: 1 });
bedSchema.index({ status: 1 });
bedSchema.index({ patient: 1 });

const Bed = mongoose.model('Bed', bedSchema);

module.exports = Bed;
