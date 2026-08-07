// models/Ambulance.js
const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['basic', 'advanced', 'critical_care', 'neonatal'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'on-duty', 'maintenance', 'out-of-service'],
    default: 'available'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  paramedicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  equipment: [{
    name: String,
    status: { type: String, enum: ['functional', 'needs-service', 'out-of-stock'] },
    lastChecked: Date
  }],
  fuelLevel: { type: Number, min: 0, max: 100, default: 100 },
  mileage: { type: Number, default: 0 },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    cost: Number
  }],
  currentEmergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AmbulanceSchema.index({ location: '2dsphere' });

AmbulanceSchema.methods.assignToEmergency = async function(emergencyId, driverId) {
  this.status = 'on-duty';
  this.currentEmergencyId = emergencyId;
  this.driverId = driverId;
  await this.save();
};

AmbulanceSchema.methods.calculateETA = function(destination) {
  // Calculate distance and ETA using Google Maps API
  const distance = calculateDistance(this.location.coordinates, destination);
  const avgSpeed = 40; // km/h in city
  const etaMinutes = (distance / avgSpeed) * 60;
  return etaMinutes;
};

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
