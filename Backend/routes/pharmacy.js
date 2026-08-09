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

// Protected routes
router.use(protect);

// Public (authenticated) routes
router.get('/', getMedications);
router.get('/low-stock', authorize('super_admin', 'admin', 'pharmacist'), getLowStock);
router.get('/expiring', authorize('super_admin', 'admin', 'pharmacist'), getExpiringMedications);
router.get('/queue', authorize('super_admin', 'admin', 'pharmacist', 'doctor'), getPrescriptionQueue);
router.get('/dashboard', authorize('super_admin', 'admin', 'pharmacist'), getPharmacyDashboard);

router.post('/', authorize('super_admin', 'admin', 'pharmacist'), createMedication);

router.route('/:id')
    .get(getMedication)
    .put(authorize('super_admin', 'admin', 'pharmacist'), updateMedication)
    .delete(authorize('super_admin', 'admin'), deleteMedication);

router.put('/:id/dispense', authorize('super_admin', 'admin', 'pharmacist'), dispenseMedication);
router.put('/:id/restock', authorize('super_admin', 'admin', 'pharmacist'), restockMedication);
router.put('/:id/adjust-stock', authorize('super_admin', 'admin', 'pharmacist'), adjustStock);
router.get('/:id/history', getMedicationHistory);

module.exports = router;
