/**
 * ============================================
 * PHARMACY.JS - Pharmacy Model
 * ============================================
 */

const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
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
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: false } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
    },
    services: [{
      name: { type: String, trim: true },
      description: { type: String, trim: true }
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
pharmacySchema.index({ pharmacyId: 1 });
pharmacySchema.index({ name: 1 });
pharmacySchema.index({ isActive: 1 });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

module.exports = Pharmacy;
