// models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['individual', 'group', 'emergency'],
    required: true
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    role: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    message: String,
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'location', 'emergency_alert'],
      default: 'text'
    },
    attachments: [{
      url: String,
      type: String,
      name: String,
      size: Number
    }],
    readBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      readAt: { type: Date, default: Date.now }
    }],
    sentAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }
  }],
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  isActive: { type: Boolean, default: true },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ChatSchema.methods.addMessage = async function(senderId, message, type = 'text', attachments = []) {
  const newMessage = {
    senderId,
    message,
    type,
    attachments,
    sentAt: new Date()
  };
  
  this.messages.push(newMessage);
  this.lastActivity = new Date();
  await this.save();
  
  return newMessage;
};

ChatSchema.methods.markAsRead = async function(messageId, userId) {
  const message = this.messages.id(messageId);
  if (message && !message.readBy.some(r => r.userId.toString() === userId.toString())) {
    message.readBy.push({ userId, readAt: new Date() });
    await this.save();
  }
};

module.exports = mongoose.model('Chat', ChatSchema);
