/**
 * ============================================
 * BED.ROUTES.JS - Bed Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getBeds,
  getBedById,
  createBed,
  updateBed,
  deleteBed,
  getAvailableBeds,
  getOccupiedBeds,
  getBedsByWard,
  getBedsByDepartment,
  assignPatient,
  dischargePatient,
  markBedMaintenance,
  markBedAvailable,
  getBedStats,
  getBedOccupancy,
} = require('../controllers/bed.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const bedIdValidation = [
  param('id').isMongoId().withMessage('Invalid bed ID'),
];

const createBedValidation = [
  body('wardId').isMongoId().withMessage('Invalid ward ID'),
  body('bedNumber').notEmpty().withMessage('Bed number is required'),
  body('type').isIn(['General', 'ICU', 'Maternity', 'Pediatrics', 'Isolation', 'Private', 'Semi-Private']).withMessage('Invalid bed type'),
];

const updateBedValidation = [
  body('status').optional().isIn(['Available', 'Occupied', 'Maintenance', 'Reserved']).withMessage('Invalid status'),
  body('type').optional().isIn(['General', 'ICU', 'Maternity', 'Pediatrics', 'Isolation', 'Private', 'Semi-Private']),
];

const assignPatientValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('admissionDate').isISO8601().withMessage('Invalid admission date'),
];

const maintenanceValidation = [
  body('reason').notEmpty().withMessage('Reason is required'),
  body('estimatedReturn').optional().isISO8601().withMessage('Invalid estimated return date'),
];

// All routes require authentication
router.use(authenticate);

// Bed operations
router.get('/', authorize('admin', 'doctor', 'nurse'), getBeds);
router.get('/available', authorize('admin', 'doctor', 'nurse'), getAvailableBeds);
router.get('/occupied', authorize('admin', 'doctor', 'nurse'), getOccupiedBeds);
router.get('/stats', authorize('admin', 'doctor', 'nurse'), getBedStats);
router.get('/occupancy', authorize('admin', 'doctor', 'nurse'), getBedOccupancy);
router.post('/', authorize('admin'), createBedValidation, createBed);
router.get('/:id', authorize('admin', 'doctor', 'nurse'), bedIdValidation, getBedById);
router.put('/:id', authorize('admin'), bedIdValidation, updateBedValidation, updateBed);
router.delete('/:id', authorize('admin'), bedIdValidation, deleteBed);

// Bed by ward/department
router.get('/ward/:wardId', authorize('admin', 'doctor', 'nurse'), getBedsByWard);
router.get('/department/:departmentId', authorize('admin', 'doctor', 'nurse'), getBedsByDepartment);

// Patient assignment
router.post('/:id/assign', authorize('admin', 'doctor', 'nurse'), bedIdValidation, assignPatientValidation, assignPatient);
router.post('/:id/discharge', authorize('admin', 'doctor', 'nurse'), bedIdValidation, dischargePatient);
router.post('/:id/maintenance', authorize('admin'), bedIdValidation, maintenanceValidation, markBedMaintenance);
router.patch('/:id/available', authorize('admin'), bedIdValidation, markBedAvailable);

module.exports = router;
