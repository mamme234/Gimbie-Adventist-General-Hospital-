// models/Emergency.js
const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema({
  emergencyId: { type: String, required: true, unique: true },
  callerInfo: {
    name: String,
    phone: String,
    relationship: String
  },
  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    medicalConditions: [String],
    allergies: [String],
    medications: [String]
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    landmark: String
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  type: {
    type: String,
    enum: ['cardiac', 'respiratory', 'trauma', 'stroke', 'burn', 'poisoning', 'obstetric', 'pediatric', 'psychiatric', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'en-route', 'on-scene', 'transporting', 'hospital-arrived', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedAmbulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  assignedParamedics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  dispatcherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  hospitalDestination: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  timeline: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    notes: String
  }],
  vitals: [{
    timestamp: Date,
    heartRate: Number,
    bloodPressure: String,
    oxygenSaturation: Number,
    temperature: Number,
    respiratoryRate: Number,
    consciousnessLevel: String
  }],
  treatmentGiven: [{
    type: String,
    medication: String,
    dosage: String,
    time: Date,
    administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
  }],
  notes: String,
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmergencySchema.methods.addTimelineEntry = function(action, performedBy, notes) {
  this.timeline.push({
    action,
    performedBy,
    notes,
    timestamp: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

EmergencySchema.methods.updateStatus = async function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.addTimelineEntry(
    `Status changed from ${oldStatus} to ${newStatus}`,
    userId
  );
  
  if (newStatus === 'completed') {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  await this.save();
};

module.exports = mongoose.model('Emergency', EmergencySchema);
