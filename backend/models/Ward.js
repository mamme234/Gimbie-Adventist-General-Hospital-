/**
 * ============================================
 * WARD.JS - Ward Model
 * ============================================
 */

const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    wardId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    type: {
      type: String,
      enum: ['General', 'ICU', 'Maternity', 'Pediatrics', 'Isolation', 'Emergency', 'Cardiac', 'Neurology', 'Orthopedic', 'Surgical'],
      default: 'General'
    },
    capacity: {
      type: Number,
      default: 10
    },
    headNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse'
    },
    location: {
      wing: { type: String, trim: true },
      floor: { type: String, trim: true }
    },
    facilities: [{
      type: String,
      trim: true
    }],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
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
wardSchema.index({ wardId: 1 });
wardSchema.index({ name: 1 });
wardSchema.index({ department: 1 });
wardSchema.index({ type: 1 });
wardSchema.index({ isActive: 1 });

const Ward = mongoose.model('Ward', wardSchema);

module.exports = Ward;
