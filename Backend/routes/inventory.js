const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getLowStockItems,
    updateStock,
    transferStock,
    getInventoryByCategory,
    getInventoryDashboard,
    getExpiringItems,
} = require('../controllers/inventoryController');

// Protected routes
router.use(protect);

// Inventory routes
router.route('/')
    .get(authorize('super_admin', 'admin', 'inventory_manager'), getInventoryItems)
    .post(authorize('super_admin', 'admin', 'inventory_manager'), createInventoryItem);

router.get('/low-stock', authorize('super_admin', 'admin', 'inventory_manager'), getLowStockItems);
router.get('/expiring', authorize('super_admin', 'admin', 'inventory_manager'), getExpiringItems);
router.get('/category/:category', authorize('super_admin', 'admin', 'inventory_manager'), getInventoryByCategory);
router.get('/dashboard', authorize('super_admin', 'admin', 'inventory_manager'), getInventoryDashboard);

router.route('/:id')
    .get(getInventoryItem)
    .put(authorize('super_admin', 'admin', 'inventory_manager'), updateInventoryItem)
    .delete(authorize('super_admin', 'admin'), deleteInventoryItem);

router.put('/:id/stock', authorize('super_admin', 'admin', 'inventory_manager'), updateStock);
router.post('/transfer', authorize('super_admin', 'admin', 'inventory_manager'), transferStock);

module.exports = router;
