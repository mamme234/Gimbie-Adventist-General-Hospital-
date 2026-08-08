const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getMedications,
    getMedication,
    createMedication,
    updateMedication,
    deleteMedication,
    getLowStock,
    getExpiringMedications,
    dispenseMedication,
    getPrescriptionQueue,
    updatePrescriptionStatus,
    getMedicationHistory,
    getPharmacyDashboard,
    restockMedication,
    adjustStock,
} = require('../controllers/pharmacyController');

router.route('/')
    .get(protect, getMedications)
    .post(protect, authorize('super_admin', 'admin', 'pharmacist'), createMedication);

router.get('/low-stock', protect, authorize('super_admin', 'admin', 'pharmacist'), getLowStock);
router.get('/expiring', protect, authorize('super_admin', 'admin', 'pharmacist'), getExpiringMedications);
router.get('/queue', protect, authorize('super_admin', 'admin', 'pharmacist', 'doctor'), getPrescriptionQueue);
router.get('/dashboard', protect, authorize('super_admin', 'admin', 'pharmacist'), getPharmacyDashboard);

router.route('/:id')
    .get(protect, getMedication)
    .put(protect, authorize('super_admin', 'admin', 'pharmacist'), updateMedication)
    .delete(protect, authorize('super_admin', 'admin'), deleteMedication);

router.put('/:id/dispense', protect, authorize('super_admin', 'admin', 'pharmacist'), dispenseMedication);
router.put('/:id/restock', protect, authorize('super_admin', 'admin', 'pharmacist'), restockMedication);
router.put('/:id/adjust-stock', protect, authorize('super_admin', 'admin', 'pharmacist'), adjustStock);
router.get('/:id/history', protect, getMedicationHistory);

module.exports = router;
