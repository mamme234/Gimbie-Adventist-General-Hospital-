// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: {
    type: String,
    enum: [
      'emergency_assignment',
      'status_update',
      'alert',
      'reminder',
      'system',
      'message'
    ],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  icon: String,
  image: String,
  data: {
    emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    url: String,
    action: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'high', 'critical'],
    default: 'low'
  },
  channels: [{
    type: String,
    enum: ['in-app', 'push', 'email', 'sms']
  }],
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  deviceTokens: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

NotificationSchema.methods.sendPush = async function() {
  if (!this.deviceTokens || this.deviceTokens.length === 0) return;
  
  // Send push notification via FCM/APNS
  const payload = {
    title: this.title,
    body: this.body,
    data: this.data,
    icon: this.icon,
    image: this.image
  };
  
  try {
    await sendPushNotification(this.deviceTokens, payload);
    this.isDelivered = true;
    this.deliveredAt = new Date();
    await this.save();
  } catch (error) {
    console.error('Push notification failed:', error);
  }
};

module.exports = mongoose.model('Notification', NotificationSchema);
