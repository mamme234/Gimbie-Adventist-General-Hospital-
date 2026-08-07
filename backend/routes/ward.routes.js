/**
 * ============================================
 * WARD.ROUTES.JS - Ward Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getWards,
  getWardById,
  createWard,
  updateWard,
  deleteWard,
  getWardPatients,
  getWardStaff,
  getWardBeds,
  getWardStats,
  getAvailableWards,
  assignPatientToWard,
  transferPatient,
  dischargePatientFromWard,
  getWardOccupancy,
  getWardCapacity,
} = require('../controllers/ward.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const wardIdValidation = [
  param('id').isMongoId().withMessage('Invalid ward ID'),
];

const createWardValidation = [
  body('name').notEmpty().withMessage('Ward name is required'),
  body('departmentId').isMongoId().withMessage('Invalid department ID'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('type').isIn(['General', 'ICU', 'Maternity', 'Pediatrics', 'Isolation', 'Emergency']).withMessage('Invalid ward type'),
];

const updateWardValidation = [
  body('name').optional().notEmpty().withMessage('Ward name cannot be empty'),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
  body('isActive').optional().isBoolean(),
];

const assignPatientValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('bedId').isMongoId().withMessage('Invalid bed ID'),
  body('admissionDate').isISO8601().withMessage('Invalid admission date'),
];

const transferPatientValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('toWardId').isMongoId().withMessage('Invalid ward ID'),
  body('toBedId').isMongoId().withMessage('Invalid bed ID'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

// All routes require authentication
router.use(authenticate);

// Ward operations
router.get('/', authorize('admin', 'doctor', 'nurse'), getWards);
router.get('/available', authorize('admin', 'doctor', 'nurse'), getAvailableWards);
router.get('/occupancy', authorize('admin', 'doctor', 'nurse'), getWardOccupancy);
router.get('/capacity', authorize('admin', 'doctor', 'nurse'), getWardCapacity);
router.post('/', authorize('admin'), createWardValidation, createWard);
router.get('/:id', authorize('admin', 'doctor', 'nurse'), wardIdValidation, getWardById);
router.put('/:id', authorize('admin'), wardIdValidation, updateWardValidation, updateWard);
router.delete('/:id', authorize('admin'), wardIdValidation, deleteWard);

// Ward patients
router.get('/:id/patients', authorize('admin', 'doctor', 'nurse'), wardIdValidation, getWardPatients);
router.post('/:id/assign', authorize('admin', 'doctor', 'nurse'), wardIdValidation, assignPatientValidation, assignPatientToWard);
router.post('/:id/transfer', authorize('admin', 'doctor', 'nurse'), wardIdValidation, transferPatientValidation, transferPatient);
router.post('/:id/discharge', authorize('admin', 'doctor', 'nurse'), wardIdValidation, dischargePatientFromWard);

// Ward staff
router.get('/:id/staff', authorize('admin', 'doctor', 'nurse'), wardIdValidation, getWardStaff);

// Ward beds
router.get('/:id/beds', authorize('admin', 'doctor', 'nurse'), wardIdValidation, getWardBeds);

// Ward stats
router.get('/:id/stats', authorize('admin', 'doctor', 'nurse'), wardIdValidation, getWardStats);

module.exports = router;
