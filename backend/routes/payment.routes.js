/**
 * ============================================
 * PAYMENT.ROUTES.JS - Payment Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Payments
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPatientPayments,
  getPendingPayments,
  getCompletedPayments,
  getFailedPayments,
  
  // Payment Methods
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  
  // Payment Processing
  processPayment,
  verifyPayment,
  refundPayment,
  reversePayment,
  
  // Payment Gateway
  initializePayment,
  handleWebhook,
  getPaymentStatus,
  
  // Reports
  getPaymentReports,
  generatePaymentReport,
  
  // Stats
  getPaymentStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const paymentIdValidation = [
  param('id').isMongoId().withMessage('Invalid payment ID'),
];

const createPaymentValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('billId').isMongoId().withMessage('Invalid bill ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('method').isIn(['Cash', 'Card', 'Mobile Money', 'Bank Transfer', 'Insurance', 'Other']).withMessage('Invalid payment method'),
  body('reference').optional().isString(),
];

const updatePaymentValidation = [
  body('status').optional().isIn(['Pending', 'Completed', 'Failed', 'Refunded']).withMessage('Invalid status'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
];

const paymentMethodValidation = [
  body('type').isIn(['Card', 'Mobile Money', 'Bank Transfer', 'Cash']).withMessage('Invalid payment type'),
  body('name').notEmpty().withMessage('Name is required'),
  body('details').isObject().withMessage('Details must be an object'),
];

const processPaymentValidation = [
  body('paymentId').isMongoId().withMessage('Invalid payment ID'),
  body('gateway').optional().isString(),
];

const refundPaymentValidation = [
  body('paymentId').isMongoId().withMessage('Invalid payment ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const initializePaymentValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isString(),
  body('description').optional().isString(),
];

// Webhook route (no auth required)
router.post('/webhook', handleWebhook);

// All other routes require authentication
router.use(authenticate);

// Payment operations
router.get('/', authorize('admin', 'finance'), getPayments);
router.get('/pending', authorize('admin', 'finance', 'patient'), getPendingPayments);
router.get('/completed', authorize('admin', 'finance', 'patient'), getCompletedPayments);
router.get('/failed', authorize('admin', 'finance'), getFailedPayments);
router.get('/patient/:patientId', authorize('admin', 'finance', 'patient'), getPatientPayments);
router.post('/', authorize('admin', 'finance', 'patient'), createPaymentValidation, createPayment);
router.get('/:id', authorize('admin', 'finance', 'patient'), paymentIdValidation, getPaymentById);
router.put('/:id', authorize('admin', 'finance'), paymentIdValidation, updatePaymentValidation, updatePayment);
router.delete('/:id', authorize('admin'), paymentIdValidation, deletePayment);

// Payment Methods
router.get('/methods', authorize('admin', 'finance', 'patient'), getPaymentMethods);
router.post('/methods', authorize('admin', 'finance', 'patient'), paymentMethodValidation, createPaymentMethod);
router.get('/methods/:id', authorize('admin', 'finance', 'patient'), getPaymentMethodById);
router.put('/methods/:id', authorize('admin', 'finance', 'patient'), paymentMethodValidation, updatePaymentMethod);
router.delete('/methods/:id', authorize('admin'), deletePaymentMethod);

// Payment Processing
router.post('/process', authorize('admin', 'finance'), processPaymentValidation, processPayment);
router.post('/verify', authorize('admin', 'finance'), verifyPayment);
router.post('/refund', authorize('admin', 'finance'), refundPaymentValidation, refundPayment);
router.post('/reverse', authorize('admin', 'finance'), refundPaymentValidation, reversePayment);

// Payment Gateway
router.post('/initialize', authorize('admin', 'finance', 'patient'), initializePaymentValidation, initializePayment);
router.get('/status/:transactionId', authorize('admin', 'finance', 'patient'), getPaymentStatus);

// Reports
router.get('/reports', authorize('admin', 'finance'), getPaymentReports);
router.post('/reports/generate', authorize('admin', 'finance'), generatePaymentReport);

// Stats
router.get('/stats', authorize('admin', 'finance'), getPaymentStats);
router.get('/stats/daily', authorize('admin', 'finance'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'finance'), getMonthlyStats);

module.exports = router;
