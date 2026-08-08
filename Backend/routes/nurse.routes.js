/**
 * ============================================
 * NURSE.ROUTES.JS - Nurse Routes
 * ============================================
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  getNurses,
  getNurseById,
  getMyProfile,
  createNurse,
  updateNurse,
  deleteNurse,
  getPatients,
  getAssignedPatients,
  getWards,
  getAdmissions,
  createAdmission,
  updateAdmission,
  getDischarges,
  createDischarge,
  updateDischarge,
  getMedications,
  administerMedication,
  getVitalSigns,
  recordVitalSigns,
  getNursingNotes,
  createNursingNote,
  getShiftSchedule,
  getReports,
} = require('../controllers/nurse.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const nurseIdValidation = [
  param('id').isMongoId().withMessage('Invalid nurse ID'),
];

const createNurseValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('ward').notEmpty().withMessage('Ward is required'),
  body('position').notEmpty().withMessage('Position is required'),
];

const admissionValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('ward').notEmpty().withMessage('Ward is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
];

const dischargeValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('dischargeDate').isISO8601().withMessage('Invalid discharge date'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const vitalSignsValidation = [
  body('bloodPressure').notEmpty().withMessage('Blood pressure is required'),
  body('heartRate').notEmpty().withMessage('Heart rate is required'),
  body('temperature').notEmpty().withMessage('Temperature is required'),
];

const medicationValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('medicationId').isMongoId().withMessage('Invalid medication ID'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
];

const nursingNoteValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('note').notEmpty().withMessage('Note is required'),
];

// All routes require authentication
router.use(authenticate);

// Nurse self routes
router.get('/me', getMyProfile);
router.put('/me', updateNurse);
router.get('/patients', getPatients);
router.get('/assigned-patients', getAssignedPatients);
router.get('/wards', getWards);
router.get('/shift-schedule', getShiftSchedule);
router.get('/reports', getReports);

// Admissions
router.get('/admissions', getAdmissions);
router.post('/admissions', authorize('admin', 'nurse'), admissionValidation, createAdmission);
router.put('/admissions/:id', authorize('admin', 'nurse'), updateAdmission);

// Discharges
router.get('/discharges', getDischarges);
router.post('/discharges', authorize('admin', 'nurse'), dischargeValidation, createDischarge);
router.put('/discharges/:id', authorize('admin', 'nurse'), updateDischarge);

// Medications
router.get('/medications', getMedications);
router.post('/medications/ administer', authorize('admin', 'nurse'), medicationValidation, administerMedication);

// Vital signs
router.get('/vital-signs', getVitalSigns);
router.post('/vital-signs', authorize('admin', 'nurse'), vitalSignsValidation, recordVitalSigns);

// Nursing notes
router.get('/nursing-notes', getNursingNotes);
router.post('/nursing-notes', authorize('admin', 'nurse'), nursingNoteValidation, createNursingNote);

// Admin routes
router.get('/', authorize('admin'), getNurses);
router.post('/', authorize('admin'), createNurseValidation, createNurse);
router.get('/:id', authorize('admin'), nurseIdValidation, getNurseById);
router.put('/:id', authorize('admin'), nurseIdValidation, updateNurse);
router.delete('/:id', authorize('admin'), nurseIdValidation, deleteNurse);

module.exports = router;
