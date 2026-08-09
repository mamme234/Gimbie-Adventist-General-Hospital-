// routes/patients.js
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

// ===== GET CURRENT PATIENT PROFILE =====
router.get('/me', getMyPatientProfile);

// ===== GET ALL PATIENTS (Admin only) =====
router.get('/', authorize('super_admin', 'admin', 'doctor', 'nurse', 'receptionist'), getPatients);

// ===== SEARCH PATIENTS =====
router.get('/search', authorize('super_admin', 'admin', 'doctor', 'nurse'), searchPatients);

// ===== CREATE PATIENT =====
router.post('/', authorize('super_admin', 'admin', 'receptionist'), createPatient);

// ===== PATIENT BY ID =====
router.get('/:id', getPatient);
router.put('/:id', authorize('super_admin', 'admin', 'doctor', 'nurse'), updatePatient);
router.delete('/:id', authorize('super_admin', 'admin'), deletePatient);

// ===== PATIENT SUB-ROUTES =====
router.get('/:id/history', getPatientHistory);
router.post('/:id/history', authorize('super_admin', 'admin', 'doctor'), addMedicalHistory);
router.get('/:id/appointments', getPatientAppointments);
router.get('/:id/bills', getPatientBills);
router.get('/:id/lab-results', getPatientLabResults);
router.get('/:id/radiology', getPatientRadiology);

module.exports = router;
