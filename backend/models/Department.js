/**
 * ============================================
 * DEPARTMENT.JS - Department Model
 * ============================================
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    location: {
      wing: { type: String, trim: true },
      floor: { type: String, trim: true },
      roomNumbers: [String]
    },
    totalBeds: {
      type: Number,
      default: 0
    },
    availableBeds: {
      type: Number,
      default: 0
    },
    services: [{
      type: String,
      trim: true
    }],
    equipment: [
      {
        name: { type: String, trim: true },
        quantity: { type: Number, default: 0 },
        status: { type: String, enum: ['Working', 'Maintenance', 'Out of Service'], default: 'Working' }
      }
    ],
    staffCount: {
      doctors: { type: Number, default: 0 },
      nurses: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// Indexes
// ============================================

departmentSchema.index({ departmentId: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
