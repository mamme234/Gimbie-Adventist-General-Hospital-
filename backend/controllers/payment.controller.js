/**
 * ============================================
 * PAYMENT.CONTROLLER.JS - Payment Controller
 * ============================================
 */

const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { paymentService } = require('../config/payment');

/**
 * Get all payments
 */
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, method, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (method) query.method = method;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(query)
      .populate('patient', 'patientId')
      .populate('bill', 'billId invoiceNumber')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message
    });
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('bill', 'billId invoiceNumber');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message
    });
  }
};

/**
 * Create payment
 */
const createPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      patientId,
      billId,
      amount,
      method,
      reference,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (amount > bill.amountDue) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds balance due'
      });
    }

    const paymentId = `PAY-${new Date().getFullYear()}-${String(await Payment.countDocuments() + 1).padStart(6, '0')}`;

    const payment = new Payment({
      paymentId,
      patient: patientId,
      bill: billId,
      amount,
      method,
      reference,
      notes,
      status: 'Completed',
      processedAt: new Date()
    });

    await payment.save();

    // Update bill
    bill.amountPaid += amount;
    bill.balance = bill.amountDue - bill.amountPaid;

    if (bill.balance <= 0) {
      bill.status = 'Paid';
      bill.isFullyPaid = true;
      bill.paymentDate = new Date();
    } else if (bill.amountPaid > 0) {
      bill.status = 'Partially Paid';
    }

    bill.paymentMethod = method;
    await bill.save();

    logger.info(`Payment created: ${payment.paymentId} for bill ${bill.billId}`);

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

/**
 * Update payment
 */
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const { status, reference, notes } = req.body;

    if (status) payment.status = status;
    if (reference) payment.reference = reference;
    if (notes) payment.notes = notes;

    await payment.save();

    logger.info(`Payment updated: ${payment.paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
};

/**
 * Delete payment
 */
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = 'Voided';
    await payment.save();

    // Reverse bill payment
    const bill = await Bill.findById(payment.bill);
    if (bill) {
      bill.amountPaid -= payment.amount;
      bill.balance = bill.amountDue - bill.amountPaid;
      if (bill.balance > 0) {
        bill.status = 'Pending';
        bill.isFullyPaid = false;
      }
      await bill.save();
    }

    logger.info(`Payment voided: ${payment.paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Payment voided successfully'
    });
  } catch (error) {
    logger.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void payment',
      error: error.message
    });
  }
};

/**
 * Get patient payments
 */
const getPatientPayments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const payments = await Payment.find({ patient: patientId })
      .populate('bill', 'billId invoiceNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get patient payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient payments',
      error: error.message
    });
  }
};

/**
 * Get pending payments
 */
const getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      status: 'Pending'
    })
      .populate('patient', 'patientId')
      .populate('bill', 'billId invoiceNumber')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending payments',
      error: error.message
    });
  }
};

/**
 * Get completed payments
 */
const getCompletedPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      status: 'Completed'
    })
      .populate('patient', 'patientId')
      .populate('bill', 'billId invoiceNumber')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get completed payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed payments',
      error: error.message
    });
  }
};

/**
 * Get failed payments
 */
const getFailedPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      status: { $in: ['Failed', 'Declined'] }
    })
      .populate('patient', 'patientId')
      .populate('bill', 'billId invoiceNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get failed payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get failed payments',
      error: error.message
    });
  }
};

/**
 * Process payment
 */
const processPayment = async (req, res) => {
  try {
    const { paymentId, gateway } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Process with payment gateway
    const result = await paymentService.processPayment({
      paymentId: payment.paymentId,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      gateway: gateway || 'default'
    });

    if (result.success) {
      payment.status = 'Completed';
      payment.processedAt = new Date();
      payment.gatewayResponse = result;
      await payment.save();

      // Update bill
      const bill = await Bill.findById(payment.bill);
      if (bill) {
        bill.amountPaid += payment.amount;
        bill.balance = bill.amountDue - bill.amountPaid;
        if (bill.balance <= 0) {
          bill.status = 'Paid';
          bill.isFullyPaid = true;
          bill.paymentDate = new Date();
        } else {
          bill.status = 'Partially Paid';
        }
        bill.paymentMethod = payment.method;
        await bill.save();
      }
    } else {
      payment.status = 'Failed';
      payment.gatewayResponse = result;
      await payment.save();
    }

    logger.info(`Payment processed: ${payment.paymentId} - Status: ${payment.status}`);

    res.status(200).json({
      success: true,
      message: `Payment ${payment.status === 'Completed' ? 'processed' : 'failed'} successfully`,
      data: payment
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Verify payment
 */
const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify with payment gateway
    const result = await paymentService.verifyPayment({
      paymentId: payment.paymentId,
      reference: payment.reference
    });

    if (result.verified) {
      payment.status = 'Completed';
      payment.verifiedAt = new Date();
      await payment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        verified: result.verified,
        payment
      }
    });
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Refund payment
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    const refundAmount = amount || payment.amount;

    // Process refund with payment gateway
    const result = await paymentService.refundPayment({
      paymentId: payment.paymentId,
      amount: refundAmount,
      reason
    });

    if (result.success) {
      payment.status = 'Refunded';
      payment.refundedAt = new Date();
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      payment.gatewayResponse = result;
      await payment.save();

      // Update bill
      const bill = await Bill.findById(payment.bill);
      if (bill) {
        bill.amountPaid -= refundAmount;
        bill.balance = bill.amountDue - bill.amountPaid;
        if (bill.balance > 0) {
          bill.status = 'Pending';
          bill.isFullyPaid = false;
        }
        await bill.save();
      }
    }

    logger.info(`Payment refunded: ${payment.paymentId} - Amount: ${refundAmount}`);

    res.status(200).json({
      success: true,
      message: result.success ? 'Payment refunded successfully' : 'Refund failed',
      data: payment
    });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: error.message
    });
  }
};

/**
 * Reverse payment
 */
const reversePayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'Completed' && payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be reversed'
      });
    }

    payment.status = 'Reversed';
    payment.reversedAt = new Date();
    payment.reverseReason = reason;
    await payment.save();

    // Reverse bill payment
    const bill = await Bill.findById(payment.bill);
    if (bill) {
      bill.amountPaid -= payment.amount;
      bill.balance = bill.amountDue - bill.amountPaid;
      if (bill.balance > 0) {
        bill.status = 'Pending';
        bill.isFullyPaid = false;
      }
      await bill.save();
    }

    logger.info(`Payment reversed: ${payment.paymentId}`);

    res.status(200).json({
      success: true,
      message: 'Payment reversed successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Reverse payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse payment',
      error: error.message
    });
  }
};

/**
 * Initialize payment (gateway)
 */
const initializePayment = async (req, res) => {
  try {
    const { patientId, amount, currency, description } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const result = await paymentService.createPaymentIntent({
      amount,
      currency: currency || 'ETB',
      description: description || 'Hospital payment',
      metadata: {
        patientId: patient._id,
        patientName: patient.patientId
      }
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};

/**
 * Get payment status (gateway)
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const status = await paymentService.getPaymentStatus(transactionId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

/**
 * Payment webhook handler
 */
const handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    logger.info('Payment webhook received:', event);

    // Process webhook event based on type
    switch (event.type) {
      case 'payment.succeeded':
        // Update payment status
        break;
      case 'payment.failed':
        // Handle failed payment
        break;
      case 'payment.refunded':
        // Handle refund
        break;
      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    logger.error('Payment webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
};

/**
 * Get payment methods
 */
const getPaymentMethods = async (req, res) => {
  try {
    const methods = [
      { id: 'card', name: 'Card Payment', icon: 'fa-credit-card' },
      { id: 'mobile', name: 'Mobile Money', icon: 'fa-mobile-alt' },
      { id: 'bank', name: 'Bank Transfer', icon: 'fa-university' },
      { id: 'cash', name: 'Cash', icon: 'fa-money-bill' },
      { id: 'insurance', name: 'Insurance', icon: 'fa-shield-alt' }
    ];

    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

/**
 * Get payment method by ID
 */
const getPaymentMethodById = async (req, res) => {
  try {
    // Placeholder - would get payment method from database
    res.status(200).json({
      success: true,
      data: { id: req.params.id, name: 'Payment Method' }
    });
  } catch (error) {
    logger.error('Get payment method by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment method',
      error: error.message
    });
  }
};

/**
 * Create payment method
 */
const createPaymentMethod = async (req, res) => {
  try {
    // Placeholder - would create payment method in database
    res.status(201).json({
      success: true,
      message: 'Payment method created successfully'
    });
  } catch (error) {
    logger.error('Create payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment method',
      error: error.message
    });
  }
};

/**
 * Update payment method
 */
const updatePaymentMethod = async (req, res) => {
  try {
    // Placeholder - would update payment method in database
    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    logger.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
};

/**
 * Delete payment method
 */
const deletePaymentMethod = async (req, res) => {
  try {
    // Placeholder - would delete payment method from database
    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    logger.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message
    });
  }
};

/**
 * Get payment reports
 */
const getPaymentReports = async (req, res) => {
  try {
    // Placeholder - would generate payment reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get payment reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment reports',
      error: error.message
    });
  }
};

/**
 * Generate payment report
 */
const generatePaymentReport = async (req, res) => {
  try {
    // Placeholder - would generate payment report
    res.status(200).json({
      success: true,
      message: 'Payment report generated successfully'
    });
  } catch (error) {
    logger.error('Generate payment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment report',
      error: error.message
    });
  }
};

/**
 * Get payment stats
 */
const getPaymentStats = async (req, res) => {
  try {
    const [
      totalPayments,
      totalAmount,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.countDocuments({ status: 'Completed' }),
      Payment.countDocuments({ status: 'Pending' }),
      Payment.countDocuments({ status: { $in: ['Failed', 'Declined'] } }),
      Payment.countDocuments({ status: 'Refunded' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        completedPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
        completionRate: totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      paymentsToday,
      amountToday,
      completedToday
    ] = await Promise.all([
      Payment.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        paymentsToday,
        amountToday: amountToday[0]?.total || 0,
        completedToday
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      paymentsMonth,
      amountMonth,
      completedMonth
    ] = await Promise.all([
      Payment.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Completed'
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        paymentsMonth,
        amountMonth: amountMonth[0]?.total || 0,
        completedMonth
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPatientPayments,
  getPendingPayments,
  getCompletedPayments,
  getFailedPayments,
  processPayment,
  verifyPayment,
  refundPayment,
  reversePayment,
  initializePayment,
  getPaymentStatus,
  handleWebhook,
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentReports,
  generatePaymentReport,
  getPaymentStats,
  getDailyStats,
  getMonthlyStats
};
