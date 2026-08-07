/**
 * ============================================
 * PAYROLL.ROUTES.JS - Payroll Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Payroll Processing
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getEmployeePayrolls,
  getDepartmentPayrolls,
  getMonthlyPayrolls,
  getYearlyPayrolls,
  
  // Payroll Processing
  processPayroll,
  approvePayroll,
  rejectPayroll,
  finalizePayroll,
  
  // Payslips
  getPayslips,
  getPayslipById,
  generatePayslip,
  sendPayslip,
  getEmployeePayslips,
  
  // Payroll Reports
  getPayrollReports,
  generatePayrollReport,
  getPayrollSummary,
  
  // Tax & Deductions
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
  
  // Payroll Settings
  getPayrollSettings,
  updatePayrollSettings,
  getPayrollPeriods,
  createPayrollPeriod,
  updatePayrollPeriod,
  deletePayrollPeriod,
  
  // Bank Transfers
  getBankTransfers,
  createBankTransfer,
  updateBankTransfer,
  deleteBankTransfer,
  processBankTransfer,
  
  // Stats
  getPayrollStats,
  getMonthlyStats,
  getYearlyStats,
} = require('../controllers/payroll.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const payrollIdValidation = [
  param('id').isMongoId().withMessage('Invalid payroll ID'),
];

const createPayrollValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('period').notEmpty().withMessage('Payroll period is required'),
  body('year').isNumeric().withMessage('Year must be a number'),
  body('month').isNumeric().withMessage('Month must be a number'),
  body('basicSalary').isNumeric().withMessage('Basic salary must be a number'),
  body('allowances').optional().isObject(),
  body('deductions').optional().isObject(),
];

const updatePayrollValidation = [
  body('status').optional().isIn(['Draft', 'Pending', 'Approved', 'Processed', 'Paid', 'Cancelled']),
  body('basicSalary').optional().isNumeric().withMessage('Basic salary must be a number'),
];

const taxBracketValidation = [
  body('name').notEmpty().withMessage('Tax bracket name is required'),
  body('minIncome').isNumeric().withMessage('Minimum income must be a number'),
  body('maxIncome').isNumeric().withMessage('Maximum income must be a number'),
  body('rate').isNumeric().withMessage('Rate must be a number'),
];

const deductionValidation = [
  body('name').notEmpty().withMessage('Deduction name is required'),
  body('type').isIn(['Percentage', 'Fixed']).withMessage('Invalid deduction type'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('isMandatory').isBoolean().withMessage('isMandatory must be a boolean'),
];

const bankTransferValidation = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('bankName').notEmpty().withMessage('Bank name is required'),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'finance', 'hr'));

// Payroll Management
router.get('/', getPayrolls);
router.get('/employee/:employeeId', getEmployeePayrolls);
router.get('/department/:departmentId', getDepartmentPayrolls);
router.get('/monthly', getMonthlyPayrolls);
router.get('/yearly', getYearlyPayrolls);
router.post('/', createPayrollValidation, createPayroll);
router.get('/:id', payrollIdValidation, getPayrollById);
router.put('/:id', payrollIdValidation, updatePayrollValidation, updatePayroll);
router.delete('/:id', payrollIdValidation, deletePayroll);

// Payroll Processing
router.post('/:id/process', payrollIdValidation, processPayroll);
router.post('/:id/approve', payrollIdValidation, approvePayroll);
router.post('/:id/reject', payrollIdValidation, rejectPayroll);
router.post('/:id/finalize', payrollIdValidation, finalizePayroll);

// Payslips
router.get('/payslips', getPayslips);
router.get('/payslips/employee/:employeeId', getEmployeePayslips);
router.get('/payslips/:id', getPayslipById);
router.post('/payslips/generate', generatePayslip);
router.post('/payslips/:id/send', sendPayslip);

// Payroll Reports
router.get('/reports', getPayrollReports);
router.post('/reports/generate', generatePayrollReport);
router.get('/summary', getPayrollSummary);

// Tax Brackets
router.get('/tax-brackets', getTaxBrackets);
router.post('/tax-brackets', taxBracketValidation, createTaxBracket);
router.put('/tax-brackets/:id', taxBracketValidation, updateTaxBracket);
router.delete('/tax-brackets/:id', deleteTaxBracket);
router.post('/tax/calculate', calculateTax);

// Deductions
router.get('/deductions', getDeductions);
router.post('/deductions', deductionValidation, createDeduction);
router.put('/deductions/:id', deductionValidation, updateDeduction);
router.delete('/deductions/:id', deleteDeduction);
router.post('/deductions/calculate', calculateDeductions);

// Payroll Settings
router.get('/settings', getPayrollSettings);
router.put('/settings', updatePayrollSettings);
router.get('/periods', getPayrollPeriods);
router.post('/periods', createPayrollPeriod);
router.put('/periods/:id', updatePayrollPeriod);
router.delete('/periods/:id', deletePayrollPeriod);

// Bank Transfers
router.get('/bank-transfers', getBankTransfers);
router.post('/bank-transfers', bankTransferValidation, createBankTransfer);
router.put('/bank-transfers/:id', bankTransferValidation, updateBankTransfer);
router.delete('/bank-transfers/:id', deleteBankTransfer);
router.post('/bank-transfers/:id/process', processBankTransfer);

// Stats
router.get('/stats', getPayrollStats);
router.get('/stats/monthly', getMonthlyStats);
router.get('/stats/yearly', getYearlyStats);

module.exports = router;
