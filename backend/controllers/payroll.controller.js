/**
 * ============================================
 * PAYROLL.CONTROLLER.JS - Payroll Controller
 * ============================================
 */

const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const TaxBracket = require('../models/TaxBracket');
const Deduction = require('../models/Deduction');
const Payslip = require('../models/Payslip');
const BankTransfer = require('../models/BankTransfer');
const PayrollPeriod = require('../models/PayrollPeriod');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all payrolls
 */
const getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, month, year, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (employeeId) query.employee = employeeId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 });

    const total = await Payroll.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payrolls',
      error: error.message
    });
  }
};

/**
 * Get payroll by ID
 */
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position department')
      .populate('approvedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    logger.error('Get payroll by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll record',
      error: error.message
    });
  }
};

/**
 * Create payroll
 */
const createPayroll = async (req, res) => {
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
      employeeId,
      period,
      year,
      month,
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existingPayroll) {
      return res.status(409).json({
        success: false,
        message: 'Payroll already exists for this period'
      });
    }

    const payroll = new Payroll({
      employee: employeeId,
      period: period || 'Monthly',
      month: parseInt(month),
      year: parseInt(year),
      basicSalary: basicSalary || employee.salary || 0,
      allowances: allowances || {},
      deductions: deductions || {},
      overtime: overtime || 0,
      bonus: bonus || 0,
      notes,
      status: 'Draft'
    });

    // Calculate totals
    payroll.calculateTotal();
    await payroll.save();

    logger.info(`Payroll created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll',
      error: error.message
    });
  }
};

/**
 * Update payroll
 */
const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const {
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      status,
      notes
    } = req.body;

    if (basicSalary) payroll.basicSalary = basicSalary;
    if (allowances) payroll.allowances = { ...payroll.allowances, ...allowances };
    if (deductions) payroll.deductions = { ...payroll.deductions, ...deductions };
    if (overtime) payroll.overtime = overtime;
    if (bonus) payroll.bonus = bonus;
    if (status) payroll.status = status;
    if (notes) payroll.notes = notes;

    payroll.calculateTotal();
    await payroll.save();

    logger.info(`Payroll updated: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll',
      error: error.message
    });
  }
};

/**
 * Delete payroll
 */
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status === 'Processed' || payroll.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete processed or paid payroll'
      });
    }

    await payroll.remove();

    logger.info(`Payroll deleted: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    logger.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: error.message
    });
  }
};

/**
 * Get employee payrolls
 */
const getEmployeePayrolls = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payrolls = await Payroll.find({ employee: employeeId })
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    logger.error('Get employee payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee payrolls',
      error: error.message
    });
  }
};

/**
 * Get department payrolls
 */
const getDepartmentPayrolls = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { month, year } = req.query;

    const employees = await Employee.find({ department: departmentId });
    const employeeIds = employees.map(e => e._id);

    let query = { employee: { $in: employeeIds } };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ employee: 1 });

    const summary = {
      totalEmployees: payrolls.length,
      totalBasicSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
      totalAllowances: payrolls.reduce((sum, p) => sum + p.totalAllowances, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        payrolls,
        summary
      }
    });
  } catch (error) {
    logger.error('Get department payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department payrolls',
      error: error.message
    });
  }
};

/**
 * Get monthly payrolls
 */
const getMonthlyPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate('employee', 'firstName lastName employeeId position department')
      .sort({ employee: 1 });

    const summary = {
      totalEmployees: payrolls.length,
      totalBasicSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
      totalAllowances: payrolls.reduce((sum, p) => sum + p.totalAllowances, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        payrolls,
        summary
      }
    });
  } catch (error) {
    logger.error('Get monthly payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly payrolls',
      error: error.message
    });
  }
};

/**
 * Get yearly payrolls
 */
const getYearlyPayrolls = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }

    const payrolls = await Payroll.find({
      year: parseInt(year)
    })
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ month: 1 });

    const monthlySummary = {};
    for (const payroll of payrolls) {
      if (!monthlySummary[payroll.month]) {
        monthlySummary[payroll.month] = {
          month: payroll.month,
          count: 0,
          totalBasic: 0,
          totalAllowances: 0,
          totalDeductions: 0,
          totalNetPay: 0
        };
      }
      monthlySummary[payroll.month].count++;
      monthlySummary[payroll.month].totalBasic += payroll.basicSalary;
      monthlySummary[payroll.month].totalAllowances += payroll.totalAllowances;
      monthlySummary[payroll.month].totalDeductions += payroll.totalDeductions;
      monthlySummary[payroll.month].totalNetPay += payroll.netPay;
    }

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        monthlySummary: Object.values(monthlySummary),
        totalPayrolls: payrolls.length
      }
    });
  } catch (error) {
    logger.error('Get yearly payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get yearly payrolls',
      error: error.message
    });
  }
};

/**
 * Process payroll
 */
const processPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status === 'Processed' || payroll.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payroll already processed'
      });
    }

    payroll.calculateTotal();
    payroll.status = 'Processed';
    payroll.processedAt = new Date();
    await payroll.save();

    // Generate payslip
    const payslip = new Payslip({
      payroll: payroll._id,
      employee: payroll.employee,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      overtime: payroll.overtime,
      bonus: payroll.bonus,
      totalAllowances: payroll.totalAllowances,
      totalDeductions: payroll.totalDeductions,
      netPay: payroll.netPay,
      generatedAt: new Date()
    });

    await payslip.save();

    logger.info(`Payroll processed: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll processed successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Process payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payroll',
      error: error.message
    });
  }
};

/**
 * Approve payroll
 */
const approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft payroll can be approved'
      });
    }

    payroll.status = 'Approved';
    payroll.approvedBy = req.user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    logger.info(`Payroll approved: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll approved successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Approve payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payroll',
      error: error.message
    });
  }
};

/**
 * Reject payroll
 */
const rejectPayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'Draft' && payroll.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Payroll cannot be rejected'
      });
    }

    const { rejectionReason } = req.body;

    payroll.status = 'Rejected';
    payroll.rejectionReason = rejectionReason;
    await payroll.save();

    logger.info(`Payroll rejected: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll rejected successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Reject payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payroll',
      error: error.message
    });
  }
};

/**
 * Finalize payroll
 */
const finalizePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (payroll.status !== 'Processed') {
      return res.status(400).json({
        success: false,
        message: 'Payroll must be processed before finalizing'
      });
    }

    payroll.status = 'Paid';
    payroll.paidAt = new Date();
    await payroll.save();

    logger.info(`Payroll finalized: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll finalized successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Finalize payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize payroll',
      error: error.message
    });
  }
};

/**
 * Get payslips
 */
const getPayslips = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, month, year } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (employeeId) query.employee = employeeId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payslips = await Payslip.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .populate('payroll', 'status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 });

    const total = await Payslip.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payslips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payslips',
      error: error.message
    });
  }
};

/**
 * Get payslip by ID
 */
const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position department')
      .populate('payroll', 'status');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payslip
    });
  } catch (error) {
    logger.error('Get payslip by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payslip',
      error: error.message
    });
  }
};

/**
 * Generate payslip
 */
const generatePayslip = async (req, res) => {
  try {
    const { payrollId } = req.body;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check if payslip already exists
    const existingPayslip = await Payslip.findOne({ payroll: payrollId });
    if (existingPayslip) {
      return res.status(409).json({
        success: false,
        message: 'Payslip already exists for this payroll'
      });
    }

    const payslip = new Payslip({
      payroll: payroll._id,
      employee: payroll.employee,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      overtime: payroll.overtime,
      bonus: payroll.bonus,
      totalAllowances: payroll.totalAllowances,
      totalDeductions: payroll.totalDeductions,
      netPay: payroll.netPay,
      generatedAt: new Date()
    });

    await payslip.save();

    logger.info(`Payslip generated for payroll: ${payroll._id}`);

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: payslip
    });
  } catch (error) {
    logger.error('Generate payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslip',
      error: error.message
    });
  }
};

/**
 * Send payslip
 */
const sendPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'firstName lastName email');

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    // Send email with payslip
    // Placeholder - would send email

    payslip.sentAt = new Date();
    await payslip.save();

    logger.info(`Payslip sent: ${payslip._id}`);

    res.status(200).json({
      success: true,
      message: 'Payslip sent successfully',
      data: payslip
    });
  } catch (error) {
    logger.error('Send payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payslip',
      error: error.message
    });
  }
};

/**
 * Get employee payslips
 */
const getEmployeePayslips = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payslips = await Payslip.find({ employee: employeeId })
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: payslips
    });
  } catch (error) {
    logger.error('Get employee payslips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee payslips',
      error: error.message
    });
  }
};

/**
 * Get payroll reports
 */
const getPayrollReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Placeholder - would generate payroll reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get payroll reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll reports',
      error: error.message
    });
  }
};

/**
 * Generate payroll report
 */
const generatePayrollReport = async (req, res) => {
  try {
    const { month, year, format } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate('employee', 'firstName lastName employeeId position department')
      .populate('payslip');

    const report = {
      month: parseInt(month),
      year: parseInt(year),
      totalEmployees: payrolls.length,
      totalBasicSalary: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
      totalAllowances: payrolls.reduce((sum, p) => sum + p.totalAllowances, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0),
      payrolls: payrolls
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Generate payroll report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll report',
      error: error.message
    });
  }
};

/**
 * Get payroll summary
 */
const getPayrollSummary = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const summary = {
      totalEmployees: 0,
      monthlyPayroll: [],
      yearlyTotals: {
        totalBasic: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalNetPay: 0
      }
    };

    // Get monthly summaries for current year
    for (let month = 1; month <= 12; month++) {
      const payrolls = await Payroll.find({
        month: month,
        year: currentYear,
        status: { $in: ['Processed', 'Paid'] }
      });

      const monthData = {
        month: month,
        count: payrolls.length,
        totalBasic: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
        totalAllowances: payrolls.reduce((sum, p) => sum + p.totalAllowances, 0),
        totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
        totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0)
      };

      summary.monthlyPayroll.push(monthData);

      summary.yearlyTotals.totalBasic += monthData.totalBasic;
      summary.yearlyTotals.totalAllowances += monthData.totalAllowances;
      summary.yearlyTotals.totalDeductions += monthData.totalDeductions;
      summary.yearlyTotals.totalNetPay += monthData.totalNetPay;
    }

    // Get total active employees
    summary.totalEmployees = await Employee.countDocuments({ status: 'Active' });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get payroll summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll summary',
      error: error.message
    });
  }
};

/**
 * Get tax brackets
 */
const getTaxBrackets = async (req, res) => {
  try {
    const taxBrackets = await TaxBracket.find().sort({ minIncome: 1 });

    res.status(200).json({
      success: true,
      data: taxBrackets
    });
  } catch (error) {
    logger.error('Get tax brackets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tax brackets',
      error: error.message
    });
  }
};

/**
 * Create tax bracket
 */
const createTaxBracket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, minIncome, maxIncome, rate } = req.body;

    const taxBracket = new TaxBracket({
      name,
      minIncome,
      maxIncome,
      rate,
      isActive: true
    });

    await taxBracket.save();

    logger.info(`Tax bracket created: ${taxBracket.name}`);

    res.status(201).json({
      success: true,
      message: 'Tax bracket created successfully',
      data: taxBracket
    });
  } catch (error) {
    logger.error('Create tax bracket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tax bracket',
      error: error.message
    });
  }
};

/**
 * Update tax bracket
 */
const updateTaxBracket = async (req, res) => {
  try {
    const taxBracket = await TaxBracket.findById(req.params.id);
    if (!taxBracket) {
      return res.status(404).json({
        success: false,
        message: 'Tax bracket not found'
      });
    }

    const { name, minIncome, maxIncome, rate, isActive } = req.body;

    if (name) taxBracket.name = name;
    if (minIncome) taxBracket.minIncome = minIncome;
    if (maxIncome) taxBracket.maxIncome = maxIncome;
    if (rate) taxBracket.rate = rate;
    if (isActive !== undefined) taxBracket.isActive = isActive;

    await taxBracket.save();

    logger.info(`Tax bracket updated: ${taxBracket.name}`);

    res.status(200).json({
      success: true,
      message: 'Tax bracket updated successfully',
      data: taxBracket
    });
  } catch (error) {
    logger.error('Update tax bracket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tax bracket',
      error: error.message
    });
  }
};

/**
 * Delete tax bracket
 */
const deleteTaxBracket = async (req, res) => {
  try {
    const taxBracket = await TaxBracket.findById(req.params.id);
    if (!taxBracket) {
      return res.status(404).json({
        success: false,
        message: 'Tax bracket not found'
      });
    }

    taxBracket.isActive = false;
    await taxBracket.save();

    logger.info(`Tax bracket deactivated: ${taxBracket.name}`);

    res.status(200).json({
      success: true,
      message: 'Tax bracket deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete tax bracket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate tax bracket',
      error: error.message
    });
  }
};

/**
 * Calculate tax
 */
const calculateTax = async (req, res) => {
  try {
    const { income } = req.body;

    if (!income) {
      return res.status(400).json({
        success: false,
        message: 'Income is required'
      });
    }

    const taxBrackets = await TaxBracket.find({
      isActive: true,
      minIncome: { $lte: income }
    }).sort({ minIncome: -1 });

    let tax = 0;
    let bracket = null;

    for (const tb of taxBrackets) {
      if (income >= tb.minIncome && (!tb.maxIncome || income <= tb.maxIncome)) {
        bracket = tb;
        tax = income * (tb.rate / 100);
        break;
      }
    }

    if (!bracket && taxBrackets.length > 0) {
      bracket = taxBrackets[0];
      tax = income * (bracket.rate / 100);
    }

    res.status(200).json({
      success: true,
      data: {
        income,
        tax,
        bracket: bracket ? bracket.name : null,
        rate: bracket ? bracket.rate : 0,
        netIncome: income - tax
      }
    });
  } catch (error) {
    logger.error('Calculate tax error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate tax',
      error: error.message
    });
  }
};

/**
 * Get deductions
 */
const getDeductions = async (req, res) => {
  try {
    const deductions = await Deduction.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: deductions
    });
  } catch (error) {
    logger.error('Get deductions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deductions',
      error: error.message
    });
  }
};

/**
 * Create deduction
 */
const createDeduction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, type, amount, isMandatory } = req.body;

    const deduction = new Deduction({
      name,
      type: type || 'Fixed',
      amount,
      isMandatory: isMandatory || false,
      isActive: true
    });

    await deduction.save();

    logger.info(`Deduction created: ${deduction.name}`);

    res.status(201).json({
      success: true,
      message: 'Deduction created successfully',
      data: deduction
    });
  } catch (error) {
    logger.error('Create deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deduction',
      error: error.message
    });
  }
};

/**
 * Update deduction
 */
const updateDeduction = async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);
    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }

    const { name, type, amount, isMandatory, isActive } = req.body;

    if (name) deduction.name = name;
    if (type) deduction.type = type;
    if (amount) deduction.amount = amount;
    if (isMandatory !== undefined) deduction.isMandatory = isMandatory;
    if (isActive !== undefined) deduction.isActive = isActive;

    await deduction.save();

    logger.info(`Deduction updated: ${deduction.name}`);

    res.status(200).json({
      success: true,
      message: 'Deduction updated successfully',
      data: deduction
    });
  } catch (error) {
    logger.error('Update deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deduction',
      error: error.message
    });
  }
};

/**
 * Delete deduction
 */
const deleteDeduction = async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);
    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: 'Deduction not found'
      });
    }

    deduction.isActive = false;
    await deduction.save();

    logger.info(`Deduction deactivated: ${deduction.name}`);

    res.status(200).json({
      success: true,
      message: 'Deduction deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate deduction',
      error: error.message
    });
  }
};

/**
 * Calculate deductions
 */
const calculateDeductions = async (req, res) => {
  try {
    const { salary, employeeId } = req.body;

    if (!salary) {
      return res.status(400).json({
        success: false,
        message: 'Salary is required'
      });
    }

    const deductions = await Deduction.find({ isActive: true });

    const calculatedDeductions = {};
    let totalDeductions = 0;

    for (const deduction of deductions) {
      let amount = deduction.amount;
      if (deduction.type === 'Percentage') {
        amount = (salary * deduction.amount) / 100;
      }
      calculatedDeductions[deduction.name] = amount;
      totalDeductions += amount;
    }

    res.status(200).json({
      success: true,
      data: {
        deductions: calculatedDeductions,
        totalDeductions,
        netSalary: salary - totalDeductions
      }
    });
  } catch (error) {
    logger.error('Calculate deductions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate deductions',
      error: error.message
    });
  }
};

/**
 * Get payroll settings
 */
const getPayrollSettings = async (req, res) => {
  try {
    const settings = {
      defaultCurrency: 'ETB',
      payFrequency: 'Monthly',
      taxEnabled: true,
      deductionsEnabled: true,
      autoGeneratePayslip: true
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll settings',
      error: error.message
    });
  }
};

/**
 * Update payroll settings
 */
const updatePayrollSettings = async (req, res) => {
  try {
    const { defaultCurrency, payFrequency, taxEnabled, deductionsEnabled, autoGeneratePayslip } = req.body;

    // Placeholder - would update settings in database
    res.status(200).json({
      success: true,
      message: 'Payroll settings updated successfully'
    });
  } catch (error) {
    logger.error('Update payroll settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll settings',
      error: error.message
    });
  }
};

/**
 * Get payroll periods
 */
const getPayrollPeriods = async (req, res) => {
  try {
    const periods = await PayrollPeriod.find().sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: periods
    });
  } catch (error) {
    logger.error('Get payroll periods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll periods',
      error: error.message
    });
  }
};

/**
 * Create payroll period
 */
const createPayrollPeriod = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { month, year, startDate, endDate, status } = req.body;

    const period = new PayrollPeriod({
      month: parseInt(month),
      year: parseInt(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'Open'
    });

    await period.save();

    logger.info(`Payroll period created: ${period.month}/${period.year}`);

    res.status(201).json({
      success: true,
      message: 'Payroll period created successfully',
      data: period
    });
  } catch (error) {
    logger.error('Create payroll period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll period',
      error: error.message
    });
  }
};

/**
 * Update payroll period
 */
const updatePayrollPeriod = async (req, res) => {
  try {
    const period = await PayrollPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    const { startDate, endDate, status } = req.body;

    if (startDate) period.startDate = new Date(startDate);
    if (endDate) period.endDate = new Date(endDate);
    if (status) period.status = status;

    await period.save();

    logger.info(`Payroll period updated: ${period.month}/${period.year}`);

    res.status(200).json({
      success: true,
      message: 'Payroll period updated successfully',
      data: period
    });
  } catch (error) {
    logger.error('Update payroll period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll period',
      error: error.message
    });
  }
};

/**
 * Delete payroll period
 */
const deletePayrollPeriod = async (req, res) => {
  try {
    const period = await PayrollPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Payroll period not found'
      });
    }

    await period.remove();

    logger.info(`Payroll period deleted: ${period.month}/${period.year}`);

    res.status(200).json({
      success: true,
      message: 'Payroll period deleted successfully'
    });
  } catch (error) {
    logger.error('Delete payroll period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll period',
      error: error.message
    });
  }
};

/**
 * Get bank transfers
 */
const getBankTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employeeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;

    const transfers = await BankTransfer.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await BankTransfer.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transfers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get bank transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bank transfers',
      error: error.message
    });
  }
};

/**
 * Create bank transfer
 */
const createBankTransfer = async (req, res) => {
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
      employeeId,
      amount,
      accountNumber,
      bankName,
      accountName,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const transfer = new BankTransfer({
      employee: employeeId,
      amount,
      accountNumber,
      bankName,
      accountName: accountName || `${employee.firstName} ${employee.lastName}`,
      notes,
      status: 'Pending'
    });

    await transfer.save();

    logger.info(`Bank transfer created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Bank transfer created successfully',
      data: transfer
    });
  } catch (error) {
    logger.error('Create bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank transfer',
      error: error.message
    });
  }
};

/**
 * Update bank transfer
 */
const updateBankTransfer = async (req, res) => {
  try {
    const transfer = await BankTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Bank transfer not found'
      });
    }

    const { accountNumber, bankName, accountName, notes } = req.body;

    if (accountNumber) transfer.accountNumber = accountNumber;
    if (bankName) transfer.bankName = bankName;
    if (accountName) transfer.accountName = accountName;
    if (notes) transfer.notes = notes;

    await transfer.save();

    logger.info(`Bank transfer updated: ${transfer._id}`);

    res.status(200).json({
      success: true,
      message: 'Bank transfer updated successfully',
      data: transfer
    });
  } catch (error) {
    logger.error('Update bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank transfer',
      error: error.message
    });
  }
};

/**
 * Delete bank transfer
 */
const deleteBankTransfer = async (req, res) => {
  try {
    const transfer = await BankTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Bank transfer not found'
      });
    }

    await transfer.remove();

    logger.info(`Bank transfer deleted: ${transfer._id}`);

    res.status(200).json({
      success: true,
      message: 'Bank transfer deleted successfully'
    });
  } catch (error) {
    logger.error('Delete bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank transfer',
      error: error.message
    });
  }
};

/**
 * Process bank transfer
 */
const processBankTransfer = async (req, res) => {
  try {
    const transfer = await BankTransfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Bank transfer not found'
      });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer is not pending'
      });
    }

    transfer.status = 'Processing';
    await transfer.save();

    // Simulate bank processing
    transfer.status = 'Completed';
    transfer.processedAt = new Date();
    await transfer.save();

    logger.info(`Bank transfer processed: ${transfer._id}`);

    res.status(200).json({
      success: true,
      message: 'Bank transfer processed successfully',
      data: transfer
    });
  } catch (error) {
    logger.error('Process bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bank transfer',
      error: error.message
    });
  }
};

/**
 * Get payroll stats
 */
const getPayrollStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [
      totalPayrolls,
      totalEmployees,
      monthlyTotal,
      yearTotal,
      pendingPayrolls,
      processedPayrolls
    ] = await Promise.all([
      Payroll.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Payroll.aggregate([
        { $match: { month: currentMonth, year: currentYear } },
        { $group: { _id: null, total: { $sum: '$netPay' } } }
      ]),
      Payroll.aggregate([
        { $match: { year: currentYear } },
        { $group: { _id: null, total: { $sum: '$netPay' } } }
      ]),
      Payroll.countDocuments({ status: 'Draft' }),
      Payroll.countDocuments({ status: { $in: ['Processed', 'Paid'] } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayrolls,
        totalEmployees,
        monthlyTotal: monthlyTotal[0]?.total || 0,
        yearTotal: yearTotal[0]?.total || 0,
        pendingPayrolls,
        processedPayrolls,
        currentMonth,
        currentYear
      }
    });
  } catch (error) {
    logger.error('Get payroll stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
      status: { $in: ['Processed', 'Paid'] }
    });

    res.status(200).json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        totalEmployees: payrolls.length,
        totalBasic: payrolls.reduce((sum, p) => sum + p.basicSalary, 0),
        totalAllowances: payrolls.reduce((sum, p) => sum + p.totalAllowances, 0),
        totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
        totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0)
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

/**
 * Get yearly stats
 */
const getYearlyStats = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }

    const payrolls = await Payroll.find({
      year: parseInt(year),
      status: { $in: ['Processed', 'Paid'] }
    });

    const monthlyStats = {};
    for (let month = 1; month <= 12; month++) {
      const monthPayrolls = payrolls.filter(p => p.month === month);
      monthlyStats[month] = {
        month,
        count: monthPayrolls.length,
        totalNetPay: monthPayrolls.reduce((sum, p) => sum + p.netPay, 0)
      };
    }

    res.status(200).json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyStats: Object.values(monthlyStats),
        totalEmployees: payrolls.length,
        totalNetPay: payrolls.reduce((sum, p) => sum + p.netPay, 0)
      }
    });
  } catch (error) {
    logger.error('Get yearly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get yearly stats',
      error: error.message
    });
  }
};

module.exports = {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getEmployeePayrolls,
  getDepartmentPayrolls,
  getMonthlyPayrolls,
  getYearlyPayrolls,
  processPayroll,
  approvePayroll,
  rejectPayroll,
  finalizePayroll,
  getPayslips,
  getPayslipById,
  generatePayslip,
  sendPayslip,
  getEmployeePayslips,
  getPayrollReports,
  generatePayrollReport,
  getPayrollSummary,
  getTaxBrackets,
  createTaxBracket,
  updateTaxBracket,
  deleteTaxBracket,
  calculateTax,
  getDeductions,
  createDeduction,
  updateDeduction,
  deleteDeduction,
  calculateDeductions,
  getPayrollSettings,
  updatePayrollSettings,
  getPayrollPeriods,
  createPayrollPeriod,
  updatePayrollPeriod,
  deletePayrollPeriod,
  getBankTransfers,
  createBankTransfer,
  updateBankTransfer,
  deleteBankTransfer,
  processBankTransfer,
  getPayrollStats,
  getMonthlyStats,
  getYearlyStats
};
