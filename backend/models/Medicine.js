/**
 * ============================================
 * MEDICINE.JS - Medicine Model
 * ============================================
 */

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    genericName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subCategory: {
      type: String,
      trim: true
    },
    strength: {
      type: String,
      trim: true
    },
    form: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Cream', 'Ointment', 'Drops', 'Suppository', 'Other'],
      default: 'Tablet'
    },
    manufacturer: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    indications: {
      type: String,
      trim: true
    },
    contraindications: {
      type: String,
      trim: true
    },
    sideEffects: {
      type: String,
      trim: true
    },
    storageConditions: {
      type: String,
      trim: true
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    quantity: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 10
    },
    maxStockLevel: {
      type: Number,
      default: 100
    },
    batchNumber: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    location: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Discontinued', 'Out of Stock'],
      default: 'Active'
    },
    requiresPrescription: {
      type: Boolean,
      default: true
    },
    controlledSubstance: {
      type: Boolean,
      default: false
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
medicineSchema.index({ medicineId: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ genericName: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ status: 1 });
medicineSchema.index({ expiryDate: 1 });

// Virtual for total value
medicineSchema.virtual('totalValue').get(function() {
  return this.quantity * this.unitPrice;
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
