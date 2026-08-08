/**
 * ============================================
 * PHARMACY.ROUTES.JS - Pharmacy Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Medicines
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicinesByCategory,
  getLowStockMedicines,
  
  // Prescriptions
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getPatientPrescriptions,
  getPendingPrescriptions,
  getCompletedPrescriptions,
  processPrescription,
  dispensePrescription,
  cancelPrescription,
  
  // Inventory
  getInventory,
  getInventoryItem,
  updateInventory,
  adjustStock,
  getExpiryAlerts,
  getStockMovements,
  
  // Suppliers
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  
  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  
  // Reports
  getReports,
  generateReport,
  
  // Stats
  getPharmacyStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/pharmacy.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const medicineIdValidation = [
  param('id').isMongoId().withMessage('Invalid medicine ID'),
];

const prescriptionIdValidation = [
  param('id').isMongoId().withMessage('Invalid prescription ID'),
];

const createMedicineValidation = [
  body('name').notEmpty().withMessage('Medicine name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('strength').notEmpty().withMessage('Strength is required'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
];

const updateMedicineValidation = [
  body('name').optional().notEmpty().withMessage('Medicine name cannot be empty'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('unitPrice').optional().isNumeric().withMessage('Unit price must be a number'),
];

const createPrescriptionValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('medications').isArray().withMessage('Medications must be an array'),
  body('diagnosis').optional().isString(),
];

const updatePrescriptionValidation = [
  body('status').optional().isIn(['Active', 'Completed', 'Discontinued', 'Pending', 'Expired']),
  body('medications').optional().isArray(),
];

const inventoryValidation = [
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const supplierValidation = [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
];

const purchaseOrderValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('expectedDelivery').isISO8601().withMessage('Invalid delivery date'),
];

// All routes require authentication
router.use(authenticate);

// Public (authenticated) routes for patients
router.get('/medicines/search', searchMedicines);
router.get('/medicines/category/:category', getMedicinesByCategory);
router.get('/medicines/low-stock', authorize('admin', 'pharmacist'), getLowStockMedicines);

// Medicines
router.get('/medicines', authorize('admin', 'pharmacist', 'doctor'), getMedicines);
router.post('/medicines', authorize('admin', 'pharmacist'), createMedicineValidation, createMedicine);
router.get('/medicines/:id', authorize('admin', 'pharmacist', 'doctor', 'patient'), medicineIdValidation, getMedicineById);
router.put('/medicines/:id', authorize('admin', 'pharmacist'), medicineIdValidation, updateMedicineValidation, updateMedicine);
router.delete('/medicines/:id', authorize('admin'), medicineIdValidation, deleteMedicine);

// Prescriptions
router.get('/prescriptions', authorize('admin', 'pharmacist', 'doctor'), getPrescriptions);
router.get('/prescriptions/pending', authorize('admin', 'pharmacist'), getPendingPrescriptions);
router.get('/prescriptions/completed', authorize('admin', 'pharmacist'), getCompletedPrescriptions);
router.get('/prescriptions/patient/:patientId', authorize('admin', 'pharmacist', 'doctor', 'patient'), getPatientPrescriptions);
router.post('/prescriptions', authorize('admin', 'doctor'), createPrescriptionValidation, createPrescription);
router.get('/prescriptions/:id', authorize('admin', 'pharmacist', 'doctor', 'patient'), prescriptionIdValidation, getPrescriptionById);
router.put('/prescriptions/:id', authorize('admin', 'pharmacist'), prescriptionIdValidation, updatePrescriptionValidation, updatePrescription);
router.delete('/prescriptions/:id', authorize('admin'), prescriptionIdValidation, deletePrescription);
router.patch('/prescriptions/:id/process', authorize('admin', 'pharmacist'), prescriptionIdValidation, processPrescription);
router.patch('/prescriptions/:id/dispense', authorize('admin', 'pharmacist'), prescriptionIdValidation, dispensePrescription);
router.patch('/prescriptions/:id/cancel', authorize('admin', 'pharmacist'), prescriptionIdValidation, cancelPrescription);

// Inventory
router.get('/inventory', authorize('admin', 'pharmacist'), getInventory);
router.get('/inventory/:id', authorize('admin', 'pharmacist'), getInventoryItem);
router.put('/inventory/:id', authorize('admin', 'pharmacist'), inventoryValidation, updateInventory);
router.post('/inventory/:id/adjust', authorize('admin', 'pharmacist'), inventoryValidation, adjustStock);
router.get('/inventory/expiry-alerts', authorize('admin', 'pharmacist'), getExpiryAlerts);
router.get('/inventory/movements', authorize('admin', 'pharmacist'), getStockMovements);

// Suppliers
router.get('/suppliers', authorize('admin', 'pharmacist'), getSuppliers);
router.post('/suppliers', authorize('admin', 'pharmacist'), supplierValidation, createSupplier);
router.get('/suppliers/:id', authorize('admin', 'pharmacist'), getSupplierById);
router.put('/suppliers/:id', authorize('admin', 'pharmacist'), supplierValidation, updateSupplier);
router.delete('/suppliers/:id', authorize('admin'), deleteSupplier);

// Purchase Orders
router.get('/purchase-orders', authorize('admin', 'pharmacist'), getPurchaseOrders);
router.post('/purchase-orders', authorize('admin', 'pharmacist'), purchaseOrderValidation, createPurchaseOrder);
router.get('/purchase-orders/:id', authorize('admin', 'pharmacist'), getPurchaseOrderById);
router.put('/purchase-orders/:id', authorize('admin', 'pharmacist'), updatePurchaseOrder);
router.delete('/purchase-orders/:id', authorize('admin'), deletePurchaseOrder);
router.patch('/purchase-orders/:id/approve', authorize('admin', 'pharmacist'), approvePurchaseOrder);
router.patch('/purchase-orders/:id/receive', authorize('admin', 'pharmacist'), receivePurchaseOrder);
router.patch('/purchase-orders/:id/cancel', authorize('admin', 'pharmacist'), cancelPurchaseOrder);

// Reports
router.get('/reports', authorize('admin', 'pharmacist'), getReports);
router.post('/reports/generate', authorize('admin', 'pharmacist'), generateReport);

// Stats
router.get('/stats', authorize('admin', 'pharmacist'), getPharmacyStats);
router.get('/stats/daily', authorize('admin', 'pharmacist'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'pharmacist'), getMonthlyStats);

module.exports = router;
