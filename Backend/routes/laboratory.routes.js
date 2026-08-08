/**
 * ============================================
 * LABORATORY.ROUTES.JS - Laboratory Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getPatientOrders,
  getPendingOrders,
  getCompletedOrders,
  getSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
  getTestResults,
  getTestResultById,
  createTestResult,
  updateTestResult,
  releaseTestResult,
  getInventory,
  getInventoryItem,
  updateInventory,
  getEquipment,
  getEquipmentItem,
  updateEquipment,
  getReports,
  generateReport,
  getLabStats,
} = require('../controllers/laboratory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const orderIdValidation = [
  param('id').isMongoId().withMessage('Invalid order ID'),
];

const createOrderValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('testType').notEmpty().withMessage('Test type is required'),
  body('priority').isIn(['Routine', 'Urgent', 'STAT']).withMessage('Invalid priority'),
];

const updateOrderValidation = [
  body('status').optional().isIn(['Pending', 'Processing', 'Completed', 'Cancelled']),
  body('priority').optional().isIn(['Routine', 'Urgent', 'STAT']),
];

const sampleValidation = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('type').notEmpty().withMessage('Sample type is required'),
  body('collectionDate').isISO8601().withMessage('Invalid collection date'),
];

const resultValidation = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('results').isObject().withMessage('Results must be an object'),
  body('notes').optional().isString(),
];

const inventoryValidation = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('unit').notEmpty().withMessage('Unit is required'),
];

// All routes require authentication
router.use(authenticate);

// Orders
router.get('/orders', authorize('admin', 'lab_technician', 'doctor'), getOrders);
router.get('/orders/pending', authorize('admin', 'lab_technician', 'doctor'), getPendingOrders);
router.get('/orders/completed', authorize('admin', 'lab_technician', 'doctor'), getCompletedOrders);
router.get('/orders/patient/:patientId', authorize('admin', 'lab_technician', 'doctor', 'patient'), getPatientOrders);
router.post('/orders', authorize('admin', 'doctor'), createOrderValidation, createOrder);
router.get('/orders/:id', authorize('admin', 'lab_technician', 'doctor', 'patient'), orderIdValidation, getOrderById);
router.put('/orders/:id', authorize('admin', 'lab_technician'), orderIdValidation, updateOrderValidation, updateOrder);
router.delete('/orders/:id', authorize('admin'), orderIdValidation, deleteOrder);

// Samples
router.get('/samples', authorize('admin', 'lab_technician'), getSamples);
router.post('/samples', authorize('admin', 'lab_technician', 'nurse'), sampleValidation, createSample);
router.get('/samples/:id', authorize('admin', 'lab_technician'), getSampleById);
router.put('/samples/:id', authorize('admin', 'lab_technician'), updateSample);
router.delete('/samples/:id', authorize('admin'), deleteSample);

// Test Results
router.get('/results', authorize('admin', 'lab_technician', 'doctor', 'patient'), getTestResults);
router.get('/results/:id', authorize('admin', 'lab_technician', 'doctor', 'patient'), getTestResultById);
router.post('/results', authorize('admin', 'lab_technician'), resultValidation, createTestResult);
router.put('/results/:id', authorize('admin', 'lab_technician'), updateTestResult);
router.patch('/results/:id/release', authorize('admin', 'lab_technician'), releaseTestResult);

// Inventory
router.get('/inventory', authorize('admin', 'lab_technician'), getInventory);
router.get('/inventory/:id', authorize('admin', 'lab_technician'), getInventoryItem);
router.put('/inventory/:id', authorize('admin', 'lab_technician'), inventoryValidation, updateInventory);

// Equipment
router.get('/equipment', authorize('admin', 'lab_technician'), getEquipment);
router.get('/equipment/:id', authorize('admin', 'lab_technician'), getEquipmentItem);
router.put('/equipment/:id', authorize('admin', 'lab_technician'), updateEquipment);

// Reports
router.get('/reports', authorize('admin', 'lab_technician'), getReports);
router.post('/reports/generate', authorize('admin', 'lab_technician'), generateReport);

// Stats
router.get('/stats', authorize('admin', 'lab_technician'), getLabStats);

// File uploads for lab results
router.post('/upload', authorize('admin', 'lab_technician'), multerConfig.lab.single('file'), handleMulterError, (req, res) => {
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: req.file,
  });
});

module.exports = router;
