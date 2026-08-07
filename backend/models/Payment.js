// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'insurance', 'cash', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String, unique: true, sparse: true },
  paymentDate: { type: Date, default: Date.now },
  receiptUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

PaymentSchema.methods.processPayment = async function() {
  // Integrate with Stripe/PayPal
  this.status = 'processing';
  await this.save();
  
  // Payment gateway logic here
  const result = await processWithGateway(this);
  
  this.status = result.success ? 'completed' : 'failed';
  this.transactionId = result.transactionId;
  await this.save();
  
  return result;
};

module.exports = mongoose.model('Payment', PaymentSchema);
