/**
 * ============================================
 * APPOINTMENT.JS - Appointment Model
 * ============================================
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
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
      default: 30 // minutes
    },
    type: {
      type: String,
      enum: ['In-Person', 'Telemedicine', 'Phone Consultation'],
      default: 'In-Person'
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No-Show'],
      default: 'Pending'
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent', 'Emergency'],
      default: 'Normal'
    },
    symptoms: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    diagnosis: {
      type: String,
      trim: true
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    vitals: {
      bloodPressure: { type: String, trim: true },
      heartRate: { type: String, trim: true },
      temperature: { type: String, trim: true },
      weight: { type: String, trim: true },
      height: { type: String, trim: true },
      bmi: { type: String, trim: true }
    },
    reminders: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      emailReminder: { type: Boolean, default: true },
      smsReminder: { type: Boolean, default: false }
    },
    followUp: {
      required: { type: Boolean, default: false },
      date: { type: Date },
      notes: { type: String, trim: true }
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// Indexes
// ============================================

appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, time: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
