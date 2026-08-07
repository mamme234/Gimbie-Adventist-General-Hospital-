/**
 * ============================================
 * RADIOLOGY.JS - Radiology Model
 * ============================================
 */

const mongoose = require('mongoose');

const radiologySchema = new mongoose.Schema(
  {
    radId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Echocardiogram', 'Mammogram', 'PET', 'SPECT', 'Fluoroscopy'],
      default: 'X-Ray'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    location: {
      wing: { type: String, trim: true },
      floor: { type: String, trim: true },
      room: { type: String, trim: true }
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    staff: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    equipment: [{
      name: { type: String, trim: true },
      model: { type: String, trim: true },
      serialNumber: { type: String, trim: true },
      manufacturer: { type: String, trim: true },
      status: {
        type: String,
        enum: ['Operational', 'Maintenance', 'Out of Service', 'Calibration'],
        default: 'Operational'
      },
      lastCalibration: { type: Date },
      nextCalibration: { type: Date }
    }],
    services: [{
      name: { type: String, trim: true },
      code: { type: String, trim: true },
      description: { type: String, trim: true },
      duration: { type: String, trim: true },
      price: { type: Number, default: 0 },
      preparation: { type: String, trim: true }
    }],
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    accreditation: [{
      name: { type: String, trim: true },
      date: { type: Date },
      expiry: { type: Date },
      status: { type: String, enum: ['Active', 'Expired', 'Pending'], default: 'Active' }
    }],
    isActive: {
      type: Boolean,
      default: true
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
radiologySchema.index({ radId: 1 });
radiologySchema.index({ name: 1 });
radiologySchema.index({ type: 1 });
radiologySchema.index({ department: 1 });
radiologySchema.index({ isActive: 1 });

const Radiology = mongoose.model('Radiology', radiologySchema);

module.exports = Radiology;
