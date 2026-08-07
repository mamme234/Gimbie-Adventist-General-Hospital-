// models/AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'error'],
    required: true
  },
  resource: {
    type: String,
    enum: [
      'emergency',
      'ambulance',
      'employee',
      'patient',
      'payment',
      'insurance',
      'chat',
      'message',
      'notification',
      'news',
      'blog',
      'event',
      'gallery',
      'contact',
      'setting'
    ],
    required: true
  },
  resourceId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  ip: String,
  userAgent: String,
  details: {
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changes: [String],
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'error'],
    default: 'success'
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  location: {
    lat: Number,
    lng: Number
  },
  sessionId: String,
  deviceId: String,
  createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

AuditLogSchema.methods.log = async function() {
  // Check for suspicious activities
  if (this.severity === 'critical') {
    await notifySecurityTeam(this);
  }
  return this.save();
};

// Middleware to auto-log operations
AuditLogSchema.statics.logAction = async function({
  action,
  resource,
  resourceId,
  userId,
  details,
  status = 'success',
  severity = 'info'
}) {
  const log = new this({
    action,
    resource,
    resourceId,
    userId,
    details,
    status,
    severity
  });
  return log.log();
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
