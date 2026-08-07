/**
 * ============================================
 * SURGERY.JS - Surgery Model
 * ============================================
 */

const mongoose = require('mongoose');

const surgerySchema = new mongoose.Schema(
  {
    surgeryId: {
      type: String,
      unique: true,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    surgeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    assistantSurgeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    anesthesiologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    surgeryType: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Cardiac', 'Neurological', 'Orthopedic', 'General', 'Obstetric', 'Gynecological', 'Urological', 'Ophthalmic', 'ENT', 'Dental', 'Plastic', 'Other'],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['Elective', 'Urgent', 'Emergency'],
      default: 'Elective'
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 60 // minutes
    },
    actualDuration: {
      type: Number
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OperatingTheatre',
      required: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurgeryTeam'
    },
    preOpAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreOpAssessment'
    },
    postOpCare: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PostOpCare'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Pre-Op', 'In Progress', 'Recovery', 'Completed', 'Cancelled', 'Postponed'],
      default: 'Scheduled'
    },
    outcome: {
      type: String,
      trim: true
    },
    complications: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    preOpInstructions: {
      type: String,
      trim: true
    },
    postOpInstructions: {
      type: String,
      trim: true
    },
    completedAt: {
      type: Date
    },
    startedAt: {
      type: Date
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
surgerySchema.index({ surgeryId: 1 });
surgerySchema.index({ patient: 1 });
surgerySchema.index({ surgeon: 1 });
surgerySchema.index({ date: 1 });
surgerySchema.index({ status: 1 });
surgerySchema.index({ priority: 1 });

const Surgery = mongoose.model('Surgery', surgerySchema);

module.exports = Surgery;
