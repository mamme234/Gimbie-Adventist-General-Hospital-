/**
 * ============================================
 * PRESCRIPTION.JS - Prescription Model
 * ============================================
 */

const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    medications: [
      {
        name: { type: String, required: true, trim: true },
        strength: { type: String, trim: true },
        dosage: { type: String, required: true, trim: true },
        frequency: { type: String, required: true, trim: true },
        duration: { type: String, trim: true },
        quantity: { type: Number, default: 0 },
        refills: { type: Number, default: 0 },
        refillsRemaining: { type: Number, default: 0 },
        instructions: { type: String, trim: true },
        notes: { type: String, trim: true }
      }
    ],
    diagnosis: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Discontinued', 'Pending', 'Expired'],
      default: 'Active'
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    filledAt: {
      type: Date
    },
    filledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isEmergency: {
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

prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ status: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
