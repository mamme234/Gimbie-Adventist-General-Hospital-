// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['paramedic', 'doctor', 'nurse', 'dispatcher', 'admin', 'driver'],
    required: true
  },
  certifications: [{
    name: String,
    issuedBy: String,
    expiryDate: Date,
    isActive: Boolean
  }],
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night', 'flexible']
  },
  schedule: [{
    day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
    startTime: String,
    endTime: String,
    isActive: Boolean
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['active', 'on-leave', 'suspended', 'terminated'],
    default: 'active'
  },
  hireDate: { type: Date, default: Date.now },
  salary: Number,
  password: { type: String, required: true },
  refreshToken: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmployeeSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

EmployeeSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

EmployeeSchema.methods.isAvailable = function() {
  return this.status === 'active';
};

module.exports = mongoose.model('Employee', EmployeeSchema);
