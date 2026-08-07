
// models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorId: {
      type: String,
      unique: true,
      required: true
    },
    specialty: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: String, trim: true }
      }
    ],
    certifications: [
      {
        name: { type: String, trim: true },
        issuingAuthority: { type: String, trim: true },
        date: { type: Date },
        expiry: { type: Date }
      }
    ],
    consultationFee: {
      type: Number,
      default: 0
    },
    consultationDuration: {
      type: Number,
      default: 30
    },
    languages: [{
      type: String,
      trim: true
    }],
    availability: {
      monday: { isAvailable: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      tuesday: { isAvailable: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      wednesday: { isAvailable: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      thursday: { isAvailable: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      friday: { isAvailable: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      saturday: { isAvailable: { type: Boolean, default: false }, start: { type: String, default: '09:00' }, end: { type: String, default: '13:00' } },
      sunday: { isAvailable: { type: Boolean, default: false }, start: { type: String, default: '09:00' }, end: { type: String, default: '13:00' } }
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    bio: {
      type: String,
      trim: true
    },
    achievements: [{
      type: String,
      trim: true
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ isAvailable: 1 });

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  if (this.userId && this.userId.firstName) {
    return `${this.userId.firstName} ${this.userId.lastName}`;
  }
  return null;
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
