// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sms', 'email', 'push', 'whatsapp'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  from: {
    name: String,
    email: String,
    phone: String
  },
  to: {
    email: String,
    phone: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }
  },
  subject: String,
  content: {
    text: String,
    html: String,
    template: String,
    templateData: mongoose.Schema.Types.Mixed
  },
  attachments: [{
    filename: String,
    path: String,
    contentType: String
  }],
  status: {
    type: String,
    enum: ['queued', 'sending', 'sent', 'delivered', 'failed', 'read'],
    default: 'queued'
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  scheduledFor: { type: Date },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  correlationId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MessageSchema.methods.send = async function() {
  this.status = 'sending';
  this.deliveryAttempts += 1;
  
  try {
    // Send via appropriate provider
    const result = await sendMessage(this);
    this.status = 'sent';
    this.sentAt = new Date();
    await this.save();
    return result;
  } catch (error) {
    this.status = 'failed';
    this.error = {
      code: error.code || 'SEND_FAILED',
      message: error.message,
      details: error.details
    };
    await this.save();
    throw error;
  }
};

MessageSchema.methods.retry = async function() {
  if (this.deliveryAttempts < this.maxAttempts) {
    this.status = 'queued';
    await this.save();
    return this.send();
  }
  return false;
};

module.exports = mongoose.model('Message', MessageSchema);
