// models/Payroll.js
const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  baseSalary: { type: Number, required: true },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 1.5 },
    amount: { type: Number, default: 0 }
  },
  bonuses: [{
    type: String,
    amount: Number,
    reason: String
  }],
  deductions: [{
    type: String,
    amount: Number,
    reason: String
  }],
  taxes: {
    federal: Number,
    state: Number,
    local: Number,
    socialSecurity: Number,
    medicare: Number
  },
  netPay: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'check', 'cash'],
    default: 'bank_transfer'
  },
  paymentDate: Date,
  transactionId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PayrollSchema.methods.calculateNetPay = function() {
  let totalBonuses = this.bonuses.reduce((sum, b) => sum + b.amount, 0);
  let totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);
  
  this.netPay = this.baseSalary + 
    (this.overtime.hours * this.overtime.rate * (this.baseSalary / 160)) + 
    totalBonuses - 
    totalDeductions;
  
  return this.netPay;
};

module.exports = mongoose.model('Payroll', PayrollSchema);
