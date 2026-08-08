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

router.route('/')
    .get(protect, authorize('super_admin', 'admin', 'accountant'), getInvoices)
    .post(protect, authorize('super_admin', 'admin', 'accountant'), createInvoice);

router.get('/patient/:patientId', protect, getPatientInvoices);
router.get('/outstanding', protect, authorize('super_admin', 'admin', 'accountant'), getOutstandingBalances);
router.get('/revenue', protect, authorize('super_admin', 'admin', 'accountant'), getRevenueReports);
router.get('/dashboard', protect, authorize('super_admin', 'admin', 'accountant'), getBillingDashboard);

router.route('/:id')
    .get(protect, getInvoice)
    .put(protect, authorize('super_admin', 'admin', 'accountant'), updateInvoice)
    .delete(protect, authorize('super_admin', 'admin'), deleteInvoice);

router.put('/:id/pay', protect, authorize('super_admin', 'admin', 'accountant'), processPayment);
router.put('/:id/refund', protect, authorize('super_admin', 'admin', 'accountant'), refundPayment);
router.get('/:id/pdf', protect, generateInvoicePDF);
router.post('/:id/email', protect, authorize('super_admin', 'admin', 'accountant'), sendInvoiceEmail);

module.exports = router;
