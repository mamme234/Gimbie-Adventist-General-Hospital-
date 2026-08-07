/**
 * ============================================
 * BILLING.ROUTES.JS - Billing Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
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
  exportBills,
} = require('../controllers/billing.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const billIdValidation = [
  param('id').isMongoId().withMessage('Invalid bill ID'),
];

const createBillValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('dueDate').isISO8601().withMessage('Invalid due date'),
];

const updateBillValidation = [
  body('status').optional().isIn(['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']),
  body('items').optional().isArray(),
];

const paymentValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('method').isIn(['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Insurance', 'Other']).withMessage('Invalid payment method'),
  body('reference').optional().isString(),
];

const claimValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('provider').notEmpty().withMessage('Insurance provider is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
];

// All routes require authentication
router.use(authenticate);

// Patient bill access
router.get('/patient/:patientId', getPatientBills);

// Admin/Finance routes
router.get('/', authorize('admin', 'finance'), getBills);
router.get('/pending', authorize('admin', 'finance'), getPendingBills);
router.get('/overdue', authorize('admin', 'finance'), getOverdueBills);
router.get('/stats', authorize('admin', 'finance'), getBillingStats);
router.get('/revenue', authorize('admin', 'finance'), getRevenueReport);
router.get('/summary', authorize('admin', 'finance'), getBillingSummary);
router.get('/export', authorize('admin', 'finance'), exportBills);

router.post('/', authorize('admin', 'finance'), createBillValidation, createBill);
router.get('/:id', authorize('admin', 'finance', 'patient'), billIdValidation, getBillById);
router.put('/:id', authorize('admin', 'finance'), billIdValidation, updateBillValidation, updateBill);
router.delete('/:id', authorize('admin'), billIdValidation, deleteBill);

// Payments
router.post('/:id/payment', authorize('admin', 'finance'), billIdValidation, paymentValidation, recordPayment);
router.get('/:id/payments', authorize('admin', 'finance', 'patient'), billIdValidation, getPaymentHistory);

// Invoices
router.post('/:id/invoice', authorize('admin', 'finance'), billIdValidation, generateInvoice);

// Insurance claims
router.get('/insurance-claims', authorize('admin', 'finance'), getInsuranceClaims);
router.post('/insurance-claims', authorize('admin', 'finance'), claimValidation, createInsuranceClaim);
router.put('/insurance-claims/:id', authorize('admin', 'finance'), updateInsuranceClaim);
router.post('/insurance-claims/:id/process', authorize('admin', 'finance'), processInsuranceClaim);

module.exports = router;
