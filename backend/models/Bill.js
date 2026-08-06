/**
 * ============================================
 * BILL.JS - Bill Model
 * ============================================
 */

const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    billId: {
      type: String,
      unique: true,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    invoiceNumber: {
      type: String,
      unique: true,
      required: true
    },
    items: [
      {
        description: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        category: {
          type: String,
          enum: ['Consultation', 'Procedure', 'Lab Test', 'Imaging', 'Medication', 'Room', 'Surgery', 'Other']
        },
        date: { type: Date, default: Date.now }
      }
    ],
    subTotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    insuranceCoverage: {
      type: Number,
      default: 0
    },
    amountDue: {
      type: Number,
      required: true
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Pending'
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Insurance', 'Other']
    },
    paymentDate: {
      type: Date
    },
    dueDate: {
      type: Date,
      required: true
    },
    billingType: {
      type: String,
      enum: ['Inpatient', 'Outpatient', 'Insurance'],
      default: 'Outpatient'
    },
    notes: {
      type: String,
      trim: true
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isFullyPaid: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// Indexes
// ============================================

billSchema.index({ billId: 1 });
billSchema.index({ invoiceNumber: 1 });
billSchema.index({ patient: 1 });
billSchema.index({ status: 1 });
billSchema.index({ dueDate: 1 });
billSchema.index({ isFullyPaid: 1 });

const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
