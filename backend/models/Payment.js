// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ETB' },
  bank: { 
    type: String, 
    enum: ['cbe', 'telebirr', 'awash', 'coop'],
    required: true 
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  paymentMethod: { type: String, enum: ['card', 'mobile', 'internet-banking'] },
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentData: { type: mongoose.Schema.Types.Mixed },
  refundData: { type: mongoose.Schema.Types.Mixed },
  paymentDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ customerId: 1 });
PaymentSchema.index({ bank: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
