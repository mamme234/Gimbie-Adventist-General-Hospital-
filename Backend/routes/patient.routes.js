/**
 * ============================================
 * PATIENT.ROUTES.JS - Patient Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getPatients,
  getPatientById,
  getMyProfile,
  createPatient,
  updatePatient,
  deletePatient,
  getMedicalRecords,
  getAppointments,
  getBills,
  getPrescriptions,
  getLabResults,
  getRadiologyResults,
  getVitalSigns,
  addMedicalRecord,
  addAllergy,
  addMedication,
  addVaccination,
  getHealthSummary,
} = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const patientIdValidation = [
  param('id').isMongoId().withMessage('Invalid patient ID'),
];

const createPatientValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
];

const updatePatientValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
];

// All routes require authentication
router.use(authenticate);

// Patient self routes
router.get('/me', getMyProfile);
router.put('/me', updatePatient);

// Admin/Doctor routes
router.get('/', authorize('admin', 'doctor', 'nurse'), getPatients);
router.post('/', authorize('admin'), createPatientValidation, createPatient);
router.get('/:id', authorize('admin', 'doctor', 'nurse'), patientIdValidation, getPatientById);
router.put('/:id', authorize('admin', 'doctor'), patientIdValidation, updatePatient);
router.delete('/:id', authorize('admin'), patientIdValidation, deletePatient);

// Patient medical records
router.get('/:id/medical-records', authorize('admin', 'doctor', 'patient'), patientIdValidation, getMedicalRecords);
router.post('/:id/medical-records', authorize('admin', 'doctor'), patientIdValidation, addMedicalRecord);

// Patient appointments
router.get('/:id/appointments', authorize('admin', 'doctor', 'patient'), patientIdValidation, getAppointments);

// Patient bills
router.get('/:id/bills', authorize('admin', 'finance', 'patient'), patientIdValidation, getBills);

// Patient prescriptions
router.get('/:id/prescriptions', authorize('admin', 'doctor', 'patient'), patientIdValidation, getPrescriptions);

// Patient lab results
router.get('/:id/lab-results', authorize('admin', 'doctor', 'patient'), patientIdValidation, getLabResults);

// Patient radiology results
router.get('/:id/radiology-results', authorize('admin', 'doctor', 'patient'), patientIdValidation, getRadiologyResults);

// Patient vital signs
router.get('/:id/vital-signs', authorize('admin', 'doctor', 'nurse', 'patient'), patientIdValidation, getVitalSigns);

// Patient allergies
router.post('/:id/allergies', authorize('admin', 'doctor'), patientIdValidation, addAllergy);

// Patient medications
router.post('/:id/medications', authorize('admin', 'doctor'), patientIdValidation, addMedication);

// Patient vaccinations
router.post('/:id/vaccinations', authorize('admin', 'doctor', 'nurse'), patientIdValidation, addVaccination);

// Health summary
router.get('/:id/health-summary', authorize('admin', 'doctor', 'patient'), patientIdValidation, getHealthSummary);

module.exports = router;
