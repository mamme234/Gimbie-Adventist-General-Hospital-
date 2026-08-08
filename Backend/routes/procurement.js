const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    approvePurchaseOrder,
    receiveGoods,
    getProcurementDashboard,
    getPurchaseRequests,
    createPurchaseRequest,
    updatePurchaseRequest,
    approvePurchaseRequest,
} = require('../controllers/procurementController');

// Protected routes
router.use(protect);
router.use(authorize('super_admin', 'admin', 'procurement_manager'));

// Suppliers
router.route('/suppliers')
    .get(getSuppliers)
    .post(createSupplier);

router.route('/suppliers/:id')
    .get(getSupplier)
    .put(updateSupplier)
    .delete(deleteSupplier);

// Purchase requests
router.route('/requests')
    .get(getPurchaseRequests)
    .post(createPurchaseRequest);

router.route('/requests/:id')
    .put(updatePurchaseRequest)
    .delete(deletePurchaseRequest);

router.put('/requests/:id/approve', approvePurchaseRequest);

// Purchase orders
router.route('/orders')
    .get(getPurchaseOrders)
    .post(createPurchaseOrder);

router.route('/orders/:id')
    .get(getPurchaseOrder)
    .put(updatePurchaseOrder)
    .delete(deletePurchaseOrder);

router.put('/orders/:id/approve', approvePurchaseOrder);
router.put('/orders/:id/receive', receiveGoods);

// Dashboard
router.get('/dashboard', getProcurementDashboard);

module.exports = router;
