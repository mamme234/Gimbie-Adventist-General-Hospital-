// models/Setting.js
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: [
      'system',
      'emergency',
      'ambulance',
      'payment',
      'notification',
      'security',
      'integration',
      'email',
      'appearance'
    ],
    required: true
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    default: 'string'
  },
  description: String,
  isEncrypted: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    enum: [String]
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SettingSchema.methods.getValue = function() {
  if (this.isEncrypted) {
    return decryptValue(this.value);
  }
  return this.value;
};

SettingSchema.methods.setValue = async function(newValue) {
  if (this.isEncrypted) {
    this.value = encryptValue(newValue);
  } else {
    this.value = newValue;
  }
  this.updatedAt = new Date();
  await this.save();
};

module.exports = mongoose.model('Setting', SettingSchema);
