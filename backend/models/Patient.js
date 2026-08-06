/**
 * ============================================
 * PATIENT.JS - Patient Model
 * ============================================
 */

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    patientId: {
      type: String,
      unique: true,
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed'],
      default: 'Single'
    },
    occupation: {
      type: String,
      trim: true
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Ethiopia' }
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true }
    },
    insurance: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      planType: { type: String, trim: true },
      expiryDate: { type: Date }
    },
    medicalHistory: [
      {
        condition: { type: String, trim: true },
        diagnosedDate: { type: Date },
        status: {
          type: String,
          enum: ['Active', 'Resolved', 'Chronic'],
          default: 'Active'
        },
        notes: { type: String, trim: true }
      }
    ],
    allergies: [
      {
        allergen: { type: String, trim: true },
        type: {
          type: String,
          enum: ['Medication', 'Food', 'Environmental', 'Other']
        },
        severity: {
          type: String,
          enum: ['Mild', 'Moderate', 'Severe']
        },
        reaction: { type: String, trim: true },
        diagnosedDate: { type: Date }
      }
    ],
    medications: [
      {
        name: { type: String, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        prescribedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor'
        },
        status: {
          type: String,
          enum: ['Active', 'Completed', 'Discontinued'],
          default: 'Active'
        }
      }
    ],
    vaccinations: [
      {
        vaccine: { type: String, trim: true },
        date: { type: Date },
        administeredBy: { type: String, trim: true },
        nextDueDate: { type: Date }
      }
    ],
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Critical'],
      default: 'Active'
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse'
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// Virtual Fields
// ============================================

patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// ============================================
// Indexes
// ============================================

patientSchema.index({ patientId: 1 });
patientSchema.index({ userId: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ 'address.city': 1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
