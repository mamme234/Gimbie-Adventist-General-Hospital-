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
    getMyPatientProfile,
} = require('../controllers/patientController');

// Protected routes
router.use(protect);

// Get current patient profile
router.get('/me', getMyPatientProfile);

// Get all patients (admin only)
router.get('/', authorize('super_admin', 'admin', 'doctor', 'nurse', 'receptionist'), getPatients);

// Search patients
router.get('/search', authorize('super_admin', 'admin', 'doctor', 'nurse'), searchPatients);

// Create patient
router.post('/', authorize('super_admin', 'admin', 'receptionist'), createPatient);

// Get patient by ID
router.get('/:id', getPatient);

// Update patient
router.put('/:id', authorize('super_admin', 'admin', 'doctor', 'nurse'), updatePatient);

// Delete patient
router.delete('/:id', authorize('super_admin', 'admin'), deletePatient);

// Patient sub-routes
router.get('/:id/history', getPatientHistory);
router.post('/:id/history', authorize('super_admin', 'admin', 'doctor'), addMedicalHistory);
router.get('/:id/appointments', getPatientAppointments);
router.get('/:id/bills', getPatientBills);
router.get('/:id/lab-results', getPatientLabResults);
router.get('/:id/radiology', getPatientRadiology);

module.exports = router;
