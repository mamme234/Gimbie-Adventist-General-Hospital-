/**
 * ============================================
 * SUPPLIER.ROUTES.JS - Supplier Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Suppliers
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  getActiveSuppliers,
  getInactiveSuppliers,
  
  // Supplier Contracts
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getSupplierContracts,
  getActiveContracts,
  getExpiringContracts,
  
  // Supplier Products
  getSupplierProducts,
  getSupplierProductById,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
  getProductsBySupplier,
  
  // Supplier Orders
  getSupplierOrders,
  getSupplierOrderById,
  createSupplierOrder,
  updateSupplierOrder,
  deleteSupplierOrder,
  getOrdersBySupplier,
  
  // Supplier Payments
  getSupplierPayments,
  getSupplierPaymentById,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  getPaymentsBySupplier,
  
  // Supplier Ratings
  getSupplierRatings,
  createSupplierRating,
  updateSupplierRating,
  deleteSupplierRating,
  
  // Supplier Reports
  getReports,
  generateReport,
  
  // Stats
  getSupplierStats,
} = require('../controllers/supplier.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const supplierIdValidation = [
  param('id').isMongoId().withMessage('Invalid supplier ID'),
];

const createSupplierValidation = [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('contact').notEmpty().withMessage('Contact person is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('address').notEmpty().withMessage('Address is required'),
  body('taxId').optional().isString(),
];

const updateSupplierValidation = [
  body('name').optional().notEmpty().withMessage('Supplier name cannot be empty'),
  body('status').optional().isIn(['Active', 'Inactive', 'Suspended']).withMessage('Invalid status'),
];

const contractValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('terms').notEmpty().withMessage('Terms are required'),
];

const productValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('minOrderQuantity').isNumeric().withMessage('Minimum order quantity must be a number'),
];

const orderValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('expectedDelivery').isISO8601().withMessage('Invalid expected delivery date'),
];

const paymentValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('method').isIn(['Cash', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method'),
];

const ratingValidation = [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('rating').isNumeric().withMessage('Rating must be a number'),
  body('feedback').optional().isString(),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'pharmacist', 'finance', 'inventory_manager'));

// Suppliers
router.get('/', getSuppliers);
router.get('/active', getActiveSuppliers);
router.get('/inactive', getInactiveSuppliers);
router.get('/search', searchSuppliers);
router.post('/', createSupplierValidation, createSupplier);
router.get('/:id', supplierIdValidation, getSupplierById);
router.put('/:id', supplierIdValidation, updateSupplierValidation, updateSupplier);
router.delete('/:id', supplierIdValidation, deleteSupplier);

// Contracts
router.get('/contracts', getContracts);
router.get('/contracts/active', getActiveContracts);
router.get('/contracts/expiring', getExpiringContracts);
router.get('/contracts/supplier/:supplierId', getSupplierContracts);
router.post('/contracts', contractValidation, createContract);
router.get('/contracts/:id', getContractById);
router.put('/contracts/:id', contractValidation, updateContract);
router.delete('/contracts/:id', deleteContract);

// Products
router.get('/products', getSupplierProducts);
router.get('/products/supplier/:supplierId', getProductsBySupplier);
router.post('/products', productValidation, createSupplierProduct);
router.get('/products/:id', getSupplierProductById);
router.put('/products/:id', productValidation, updateSupplierProduct);
router.delete('/products/:id', deleteSupplierProduct);

// Orders
router.get('/orders', getSupplierOrders);
router.get('/orders/supplier/:supplierId', getOrdersBySupplier);
router.post('/orders', orderValidation, createSupplierOrder);
router.get('/orders/:id', getSupplierOrderById);
router.put('/orders/:id', orderValidation, updateSupplierOrder);
router.delete('/orders/:id', deleteSupplierOrder);

// Payments
router.get('/payments', getSupplierPayments);
router.get('/payments/supplier/:supplierId', getPaymentsBySupplier);
router.post('/payments', paymentValidation, createSupplierPayment);
router.get('/payments/:id', getSupplierPaymentById);
router.put('/payments/:id', paymentValidation, updateSupplierPayment);
router.delete('/payments/:id', deleteSupplierPayment);

// Ratings
router.get('/ratings', getSupplierRatings);
router.post('/ratings', ratingValidation, createSupplierRating);
router.put('/ratings/:id', ratingValidation, updateSupplierRating);
router.delete('/ratings/:id', deleteSupplierRating);

// Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

// Stats
router.get('/stats', getSupplierStats);

module.exports = router;
