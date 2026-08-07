/**
 * ============================================
 * MEDICALRECORD.JS - Medical Record Model
 * ============================================
 */

const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    recordId: {
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
      ref: 'Doctor'
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    type: {
      type: String,
      enum: ['Consultation', 'Diagnosis', 'Procedure', 'Surgery', 'Lab Result', 'Imaging', 'Vaccination', 'Medication', 'Follow-up', 'Emergency'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    diagnosis: {
      code: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      details: {
        type: String,
        trim: true
      }
    },
    symptoms: [{
      type: String,
      trim: true
    }],
    findings: {
      type: String,
      trim: true
    },
    treatment: {
      type: String,
      trim: true
    },
    medications: [{
      name: { type: String, trim: true },
      dosage: { type: String, trim: true },
      frequency: { type: String, trim: true },
      duration: { type: String, trim: true },
      prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
      }
    }],
    procedures: [{
      name: { type: String, trim: true },
      date: { type: Date },
      notes: { type: String, trim: true }
    }],
    notes: {
      type: String,
      trim: true
    },
    attachments: [{
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      type: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    followUp: {
      required: { type: Boolean, default: false },
      date: { type: Date },
      notes: { type: String, trim: true }
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic', 'Monitoring', 'Completed'],
      default: 'Active'
    },
    isConfidential: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ doctor: 1 });
medicalRecordSchema.index({ date: -1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ status: 1 });

// Virtual for age at record creation
medicalRecordSchema.virtual('patientAge').get(function() {
  if (this.patient && this.patient.dateOfBirth) {
    const age = new Date(this.date).getFullYear() - new Date(this.patient.dateOfBirth).getFullYear();
    return age;
  }
  return null;
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
