/**
 * ============================================
 * SUPPLIER.JS - Supplier Model
 * ============================================
 */

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Ethiopia' }
    },
    taxId: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    },
    notes: {
      type: String,
      trim: true
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierProduct'
    }],
    contracts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierContract'
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
supplierSchema.index({ supplierId: 1 });
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ taxId: 1 });
supplierSchema.index({ status: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
