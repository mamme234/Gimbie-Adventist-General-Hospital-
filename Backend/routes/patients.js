const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    getPatientHistory,
    addMedicalHistory,
    getPatientAppointments,
    getPatientBills,
    getPatientLabResults,
    getPatientRadiology,
} = require('../controllers/patientController');

// Protected routes
router.route('/')
    .get(protect, authorize('super_admin', 'admin', 'doctor', 'nurse', 'receptionist'), getPatients)
    .post(protect, authorize('super_admin', 'admin', 'receptionist'), createPatient);

router.get('/search', protect, authorize('super_admin', 'admin', 'doctor', 'nurse'), searchPatients);

router.route('/:id')
    .get(protect, authorize('super_admin', 'admin', 'doctor', 'nurse'), getPatient)
    .put(protect, authorize('super_admin', 'admin', 'doctor', 'nurse'), updatePatient)
    .delete(protect, authorize('super_admin', 'admin'), deletePatient);

router.get('/:id/history', protect, authorize('super_admin', 'admin', 'doctor'), getPatientHistory);
router.post('/:id/history', protect, authorize('super_admin', 'admin', 'doctor'), addMedicalHistory);
router.get('/:id/appointments', protect, getPatientAppointments);
router.get('/:id/bills', protect, getPatientBills);
router.get('/:id/lab-results', protect, getPatientLabResults);
router.get('/:id/radiology', protect, getPatientRadiology);

module.exports = router;
