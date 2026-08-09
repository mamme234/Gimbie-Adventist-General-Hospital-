const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    processPayment,
    getPatientInvoices,
    getOutstandingBalances,
    getRevenueReports,
    generateInvoicePDF,
    sendInvoiceEmail,
    refundPayment,
    getBillingDashboard,
} = require('../controllers/billingController');

// Protected routes
router.use(protect);

// Billing routes
router.route('/')
    .get(authorize('super_admin', 'admin', 'accountant'), getInvoices)
    .post(authorize('super_admin', 'admin', 'accountant'), createInvoice);

router.get('/patient/:patientId', getPatientInvoices);
router.get('/outstanding', authorize('super_admin', 'admin', 'accountant'), getOutstandingBalances);
router.get('/revenue', authorize('super_admin', 'admin', 'accountant'), getRevenueReports);
router.get('/dashboard', authorize('super_admin', 'admin', 'accountant'), getBillingDashboard);

router.route('/:id')
    .get(getInvoice)
    .put(authorize('super_admin', 'admin', 'accountant'), updateInvoice)
    .delete(authorize('super_admin', 'admin'), deleteInvoice);

router.put('/:id/pay', authorize('super_admin', 'admin', 'accountant'), processPayment);
router.put('/:id/refund', authorize('super_admin', 'admin', 'accountant'), refundPayment);
router.get('/:id/pdf', generateInvoicePDF);
router.post('/:id/email', authorize('super_admin', 'admin', 'accountant'), sendInvoiceEmail);

module.exports = router;
