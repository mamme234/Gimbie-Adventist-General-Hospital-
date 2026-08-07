/**
 * ============================================
 * DOCTOR.ROUTES.JS - Doctor Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getDoctors,
  getDoctorById,
  getMyProfile,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPatients,
  getAppointments,
  getSchedule,
  updateAvailability,
  getTodayAppointments,
  getUpcomingAppointments,
  getPatientHistory,
  addDiagnosis,
  getDiagnoses,
  getPrescriptions,
  getLabOrders,
  getRadiologyOrders,
  getSurgerySchedule,
  getReferrals,
  createReferral,
  updateReferral,
} = require('../controllers/doctor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const doctorIdValidation = [
  param('id').isMongoId().withMessage('Invalid doctor ID'),
];

const createDoctorValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
];

const updateDoctorValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('specialty').optional().notEmpty().withMessage('Specialty cannot be empty'),
];

const availabilityValidation = [
  body('availability').isObject().withMessage('Availability must be an object'),
];

const diagnosisValidation = [
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
];

const referralValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('toDoctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

// All routes require authentication
router.use(authenticate);

// Doctor self routes
router.get('/me', getMyProfile);
router.put('/me', updateDoctor);
router.put('/availability', availabilityValidation, updateAvailability);
router.get('/schedule', getSchedule);
router.get('/patients', getPatients);
router.get('/appointments', getAppointments);
router.get('/appointments/today', getTodayAppointments);
router.get('/appointments/upcoming', getUpcomingAppointments);

// Admin routes
router.get('/', authorize('admin'), getDoctors);
router.post('/', authorize('admin'), createDoctorValidation, createDoctor);
router.get('/:id', authorize('admin'), doctorIdValidation, getDoctorById);
router.put('/:id', authorize('admin'), doctorIdValidation, updateDoctor);
router.delete('/:id', authorize('admin'), doctorIdValidation, deleteDoctor);

// Patient history
router.get('/patients/:patientId/history', authorize('admin', 'doctor'), getPatientHistory);

// Diagnoses
router.get('/diagnoses', authorize('admin', 'doctor'), getDiagnoses);
router.post('/diagnoses', authorize('admin', 'doctor'), diagnosisValidation, addDiagnosis);

// Prescriptions
router.get('/prescriptions', authorize('admin', 'doctor'), getPrescriptions);

// Lab orders
router.get('/lab-orders', authorize('admin', 'doctor'), getLabOrders);

// Radiology orders
router.get('/radiology-orders', authorize('admin', 'doctor'), getRadiologyOrders);

// Surgery schedule
router.get('/surgery-schedule', authorize('admin', 'doctor'), getSurgerySchedule);

// Referrals
router.get('/referrals', authorize('admin', 'doctor'), getReferrals);
router.post('/referrals', authorize('admin', 'doctor'), referralValidation, createReferral);
router.put('/referrals/:id', authorize('admin', 'doctor'), updateReferral);

module.exports = router;
