// routes/patients.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    getMyPatientProfile,
    getPatientAppointments,
    getPatientBills,
    getPatientHistory,
    getPatientLabResults,
} = require('../controllers/patientController');

// Protected routes
router.use(protect);

// Get current patient profile
router.get('/me', getMyPatientProfile);

// Get all patients (admin only)
router.get('/', authorize('super_admin', 'admin'), getPatients);

// Create patient
router.post('/', authorize('super_admin', 'admin', 'receptionist'), createPatient);

// Get patient by ID
router.get('/:id', getPatient);

// Update patient
router.put('/:id', authorize('super_admin', 'admin', 'doctor', 'nurse'), updatePatient);

// Patient sub-routes
router.get('/:id/appointments', getPatientAppointments);
router.get('/:id/bills', getPatientBills);
router.get('/:id/history', getPatientHistory);
router.get('/:id/lab-results', getPatientLabResults);

module.exports = router;
