/**
 * ============================================
 * DISCHARGE.JS - Discharge Model
 * ============================================
 */

const mongoose = require('mongoose');

const dischargeSchema = new mongoose.Schema(
  {
    dischargeId: {
      type: String,
      unique: true,
      required: true
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
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
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse'
    },
    dischargeDate: {
      type: Date,
      default: Date.now
    },
    dischargeType: {
      type: String,
      enum: ['Recovered', 'Transferred', 'Left Against Advice', 'Deceased', 'Home Care', 'Other'],
      required: true
    },
    conditionAtDischarge: {
      type: String,
      enum: ['Stable', 'Improved', 'Unchanged', 'Deteriorated', 'Critical'],
      default: 'Stable'
    },
    diagnosis: {
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
      instructions: { type: String, trim: true }
    }],
    followUp: {
      required: { type: Boolean, default: false },
      date: { type: Date },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      instructions: { type: String, trim: true }
    },
    instructions: {
      diet: { type: String, trim: true },
      activity: { type: String, trim: true },
      woundCare: { type: String, trim: true },
      warningSigns: { type: String, trim:
