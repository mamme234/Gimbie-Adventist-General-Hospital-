// models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['employee', 'patient', 'family', 'emergency_contact', 'supplier', 'hospital', 'partner'],
    required: true
  },
  name: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: String,
    title: String
  },
  contactDetails: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    secondaryPhone: String,
    fax: String,
    website: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' },
    isPrimary: { type: Boolean, default: true }
  },
  organization: {
    name: String,
    department: String,
    role: String,
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
  },
  relationships: [{
    type: String,
    relatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    description: String
  }],
  tags: [String],
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    createdAt: { type: Date, default: Date.now }
  }],
  preferences: {
    language: { type: String, default: 'en' },
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'any'],
      default: 'any'
    },
    timezone: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  lastContacted: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ContactSchema.index({ 'name.firstName': 1, 'name.lastName': 1 });

ContactSchema.methods.getFullName = function() {
  return `${this.name.firstName} ${this.name.lastName}`;
};

ContactSchema.methods.isEmergencyContact = function() {
  return this.type === 'emergency_contact';
};

module.exports = mongoose.model('Contact', ContactSchema);
