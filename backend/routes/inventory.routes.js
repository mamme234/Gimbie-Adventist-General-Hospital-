/**
 * ============================================
 * INVENTORY.ROUTES.JS - Inventory Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Inventory Items
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  searchItems,
  getItemsByCategory,
  getLowStockItems,
  getOutOfStockItems,
  
  // Stock Management
  getStockLevels,
  updateStockLevel,
  adjustStock,
  transferStock,
  getStockMovements,
  getStockHistory,
  
  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Locations
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  
  // Stock Alerts
  getAlerts,
  createAlert,
  updateAlert,
  resolveAlert,
  getLowStockAlerts,
  getExpiryAlerts,
  
  // Inventory Reports
  getReports,
  generateReport,
  getInventorySummary,
  getInventoryValuation,
  
  // Stats
  getInventoryStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const itemIdValidation = [
  param('id').isMongoId().withMessage('Invalid item ID'),
];

const createItemValidation = [
  body('name').notEmpty().withMessage('Item name is required'),
  body('categoryId').isMongoId().withMessage('Invalid category ID'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('reorderLevel').isNumeric().withMessage('Reorder level must be a number'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
];

const updateItemValidation = [
  body('name').optional().notEmpty().withMessage('Item name cannot be empty'),
  body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
  body('status').optional().isIn(['Active', 'Inactive', 'Discontinued']),
];

const stockAdjustmentValidation = [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('type').isIn(['Add', 'Remove', 'Adjust']).withMessage('Invalid adjustment type'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const transferValidation = [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('fromLocationId').isMongoId().withMessage('Invalid from location'),
  body('toLocationId').isMongoId().withMessage('Invalid to location'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
];

const locationValidation = [
  body('name').notEmpty().withMessage('Location name is required'),
  body('type').isIn(['Warehouse', 'Department', 'Ward', 'Pharmacy', 'Lab']).withMessage('Invalid location type'),
];

const alertValidation = [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('type').isIn(['Low Stock', 'Expiry', 'Re-order']).withMessage('Invalid alert type'),
  body('threshold').isNumeric().withMessage('Threshold must be a number'),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'pharmacist', 'lab_technician', 'inventory_manager'));

// Inventory Items
router.get('/items', getItems);
router.get('/items/search', searchItems);
router.get('/items/category/:categoryId', getItemsByCategory);
router.get('/items/low-stock', getLowStockItems);
router.get('/items/out-of-stock', getOutOfStockItems);
router.post('/items', createItemValidation, createItem);
router.get('/items/:id', itemIdValidation, getItemById);
router.put('/items/:id', itemIdValidation, updateItemValidation, updateItem);
router.delete('/items/:id', itemIdValidation, deleteItem);

// Stock Management
router.get('/stock-levels', getStockLevels);
router.put('/stock-levels/:id', itemIdValidation, updateStockLevel);
router.post('/stock/adjust', stockAdjustmentValidation, adjustStock);
router.post('/stock/transfer', transferValidation, transferStock);
router.get('/stock/movements', getStockMovements);
router.get('/stock/history/:itemId', itemIdValidation, getStockHistory);

// Categories
router.get('/categories', getCategories);
router.post('/categories', categoryValidation, createCategory);
router.get('/categories/:id', getCategoryById);
router.put('/categories/:id', categoryValidation, updateCategory);
router.delete('/categories/:id', deleteCategory);

// Locations
router.get('/locations', getLocations);
router.post('/locations', locationValidation, createLocation);
router.get('/locations/:id', getLocationById);
router.put('/locations/:id', locationValidation, updateLocation);
router.delete('/locations/:id', deleteLocation);

// Stock Alerts
router.get('/alerts', getAlerts);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/alerts/expiry', getExpiryAlerts);
router.post('/alerts', alertValidation, createAlert);
router.put('/alerts/:id', alertValidation, updateAlert);
router.patch('/alerts/:id/resolve', resolveAlert);

// Inventory Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);
router.get('/summary', getInventorySummary);
router.get('/valuation', getInventoryValuation);

// Stats
router.get('/stats', getInventoryStats);
router.get('/stats/daily', getDailyStats);
router.get('/stats/monthly', getMonthlyStats);

module.exports = router;
