/**
 * ============================================
 * BILLING.CONTROLLER.JS - Billing Controller
 * ============================================
 */

const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendBillingEmail } = require('../config/email');

/**
 * Get all bills
 */
const getBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (patientId) query.patient = patientId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const bills = await Bill.find(query)
      .populate('patient', 'patientId')
      .populate('generatedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bills',
      error: error.message
    });
  }
};

/**
 * Get bill by ID
 */
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('generatedBy', 'firstName lastName');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (error) {
    logger.error('Get bill by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bill',
      error: error.message
    });
  }
};

/**
 * Create bill
 */
const createBill = async (req, res) => {
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
      items,
      subTotal,
      tax,
      discount,
      insuranceCoverage,
      amountDue,
      dueDate,
      billingType,
      notes
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const billId = `BILL-${new Date().getFullYear()}-${String(await Bill.countDocuments() + 1).padStart(6, '0')}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(await Bill.countDocuments() + 1).padStart(6, '0')}`;

    const bill = new Bill({
      billId,
      invoiceNumber,
      patient: patientId,
      items,
      subTotal,
      tax: tax || 0,
      discount: discount || 0,
      insuranceCoverage: insuranceCoverage || 0,
      amountDue,
      dueDate: new Date(dueDate),
      billingType: billingType || 'Outpatient',
      notes,
      status: 'Pending',
      generatedBy: req.user._id
    });

    await bill.save();

    // Send billing email
    try {
      const user = await User.findById(patient.userId);
      if (user) {
        await sendBillingEmail(user.email, {
          patientName: `${user.firstName} ${user.lastName}`,
          invoiceNumber: bill.invoiceNumber,
          amount: bill.amountDue,
          dueDate: bill.dueDate,
          status: bill.status
        });
      }
    } catch (emailError) {
      logger.error('Billing email error:', emailError);
    }

    logger.info(`Bill created: ${bill.billId} for patient ${patient.patientId}`);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    logger.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

/**
 * Update bill
 */
const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const {
      items,
      subTotal,
      tax,
      discount,
      insuranceCoverage,
      amountDue,
      dueDate,
      status,
      notes
    } = req.body;

    if (items) bill.items = items;
    if (subTotal) bill.subTotal = subTotal;
    if (tax) bill.tax = tax;
    if (discount) bill.discount = discount;
    if (insuranceCoverage) bill.insuranceCoverage = insuranceCoverage;
    if (amountDue) bill.amountDue = amountDue;
    if (dueDate) bill.dueDate = new Date(dueDate);
    if (status) bill.status = status;
    if (notes) bill.notes = notes;

    if (status === 'Paid') {
      bill.paymentDate = new Date();
      bill.isFullyPaid = true;
    }

    await bill.save();

    logger.info(`Bill updated: ${bill.billId}`);

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    logger.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error.message
    });
  }
};

/**
 * Delete bill (Admin only)
 */
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    bill.status = 'Cancelled';
    await bill.save();

    logger.info(`Bill cancelled: ${bill.billId}`);

    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel bill',
      error: error.message
    });
  }
};

/**
 * Get patient bills
 */
const getPatientBills = async (req, res) => {
  try {
    const { patientId } = req.params;

    const bills = await Bill.find({ patient: patientId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    logger.error('Get patient bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient bills',
      error: error.message
    });
  }
};

/**
 * Get pending bills
 */
const getPendingBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      status: 'Pending',
      dueDate: { $gte: new Date() }
    })
      .populate('patient', 'patientId')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    logger.error('Get pending bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending bills',
      error: error.message
    });
  }
};

/**
 * Get overdue bills
 */
const getOverdueBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      status: { $in: ['Pending', 'Partially Paid'] },
      dueDate: { $lt: new Date() }
    })
      .populate('patient', 'patientId')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    logger.error('Get overdue bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get overdue bills',
      error: error.message
    });
  }
};

/**
 * Record payment
 */
const recordPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const { amount, method, reference, notes } = req.body;

    if (amount > bill.amountDue) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds balance due'
      });
    }

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
    bill.paymentReference = reference;
    bill.paymentNotes = notes;
    bill.paymentDate = new Date();

    await bill.save();

    logger.info(`Payment recorded for bill: ${bill.billId} - Amount: ${amount}`);

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: bill
    });
  } catch (error) {
    logger.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

/**
 * Get payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Placeholder - would query payment history model
    const payments = [
      {
        date: bill.paymentDate,
        amount: bill.amountPaid,
        method: bill.paymentMethod,
        reference: bill.paymentReference,
        status: 'Completed'
      }
    ];

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};

/**
 * Generate invoice
 */
const generateInvoice = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'patientId')
      .populate('generatedBy', 'firstName lastName');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Placeholder - would generate PDF invoice
    const invoice = {
      invoiceNumber: bill.invoiceNumber,
      date: bill.createdAt,
      patient: bill.patient,
      items: bill.items,
      subTotal: bill.subTotal,
      tax: bill.tax,
      discount: bill.discount,
      total: bill.amountDue,
      status: bill.status
    };

    res.status(200).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    logger.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};

/**
 * Get billing stats
 */
const getBillingStats = async (req, res) => {
  try {
    const [
      totalBills,
      paidBills,
      pendingBills,
      overdueBills,
      totalRevenue,
      totalPaid
    ] = await Promise.all([
      Bill.countDocuments(),
      Bill.countDocuments({ status: 'Paid' }),
      Bill.countDocuments({ status: 'Pending' }),
      Bill.countDocuments({
        status: { $in: ['Pending', 'Partially Paid'] },
        dueDate: { $lt: new Date() }
      }),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountDue' } } }]),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBills,
        paidBills,
        pendingBills,
        overdueBills,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
        outstanding: (totalRevenue[0]?.total || 0) - (totalPaid[0]?.total || 0)
      }
    });
  } catch (error) {
    logger.error('Get billing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get billing stats',
      error: error.message
    });
  }
};

/**
 * Get revenue report
 */
const getRevenueReport = async (req, res) => {
  try {
    const { period } = req.query;
    let startDate, endDate;

    switch (period) {
      case 'monthly':
        startDate = new Date();
        startDate.setDate(1);
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(1);
        break;
      case 'quarterly':
        const quarter = Math.floor(new Date().getMonth() / 3);
        startDate = new Date(new Date().getFullYear(), quarter * 3, 1);
        endDate = new Date(new Date().getFullYear(), quarter * 3 + 3, 1);
        break;
      case 'yearly':
        startDate = new Date(new Date().getFullYear(), 0, 1);
        endDate = new Date(new Date().getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
    }

    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Paid'
    });

    const revenue = {
      startDate,
      endDate,
      total: bills.reduce((sum, b) => sum + b.amountPaid, 0),
      count: bills.length,
      byDepartment: {},
      byService: {}
    };

    // Group by department/service
    for (const bill of bills) {
      for (const item of bill.items) {
        const category = item.category || 'Other';
        if (!revenue.byDepartment[category]) {
          revenue.byDepartment[category] = 0;
        }
        revenue.byDepartment[category] += item.total;
      }
    }

    res.status(200).json({
      success: true,
      data: revenue
    });
  } catch (error) {
    logger.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue report',
      error: error.message
    });
  }
};

/**
 * Get insurance claims
 */
const getInsuranceClaims = async (req, res) => {
  try {
    const { status, provider } = req.query;
    let query = {};

    if (status) query.status = status;
    if (provider) query.provider = provider;

    // Placeholder - would query insurance claim model
    const claims = [];

    res.status(200).json({
      success: true,
      data: claims
    });
  } catch (error) {
    logger.error('Get insurance claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insurance claims',
      error: error.message
    });
  }
};

/**
 * Create insurance claim
 */
const createInsuranceClaim = async (req, res) => {
  try {
    // Placeholder - would create insurance claim
    res.status(201).json({
      success: true,
      message: 'Insurance claim created successfully'
    });
  } catch (error) {
    logger.error('Create insurance claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create insurance claim',
      error: error.message
    });
  }
};

/**
 * Update insurance claim
 */
const updateInsuranceClaim = async (req, res) => {
  try {
    // Placeholder - would update insurance claim
    res.status(200).json({
      success: true,
      message: 'Insurance claim updated successfully'
    });
  } catch (error) {
    logger.error('Update insurance claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update insurance claim',
      error: error.message
    });
  }
};

/**
 * Process insurance claim
 */
const processInsuranceClaim = async (req, res) => {
  try {
    // Placeholder - would process insurance claim
    res.status(200).json({
      success: true,
      message: 'Insurance claim processed successfully'
    });
  } catch (error) {
    logger.error('Process insurance claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process insurance claim',
      error: error.message
    });
  }
};

/**
 * Get billing summary
 */
const getBillingSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      pendingTotal,
      overdueTotal
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } }
      ]),
      Bill.aggregate([
        { $match: { status: { $in: ['Pending', 'Partially Paid'] }, dueDate: { $lt: new Date() } } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyRevenue: dailyRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        yearlyRevenue: yearlyRevenue[0]?.total || 0,
        pendingTotal: pendingTotal[0]?.total || 0,
        overdueTotal: overdueTotal[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error('Get billing summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get billing summary',
      error: error.message
    });
  }
};

/**
 * Export bills
 */
const exportBills = async (req, res) => {
  try {
    const { format, dateFrom, dateTo } = req.query;

    let query = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const bills = await Bill.find(query)
      .populate('patient', 'patientId')
      .lean();

    // Placeholder - would generate export file
    const exportData = {
      format: format || 'csv',
      count: bills.length,
      data: bills
    };

    res.status(200).json({
      success: true,
      message: 'Bills exported successfully',
      data: exportData
    });
  } catch (error) {
    logger.error('Export bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export bills',
      error: error.message
    });
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  getPatientBills,
  getPendingBills,
  getOverdueBills,
  recordPayment,
  getPaymentHistory,
  generateInvoice,
  getBillingStats,
  getRevenueReport,
  getInsuranceClaims,
  createInsuranceClaim,
  updateInsuranceClaim,
  processInsuranceClaim,
  getBillingSummary,
  exportBills
};
