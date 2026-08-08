/**
 * ============================================
 * DEPARTMENT.ROUTES.JS - Department Routes
 * ============================================
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentDoctors,
  getDepartmentNurses,
  getDepartmentStats,
  getDepartmentWards,
  getDepartmentBeds,
  getDepartmentEquipment,
  updateDepartmentEquipment,
  getDepartmentServices,
  updateDepartmentServices,
  getDepartmentAvailability,
  updateDepartmentAvailability,
} = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const departmentIdValidation = [
  param('id').isMongoId().withMessage('Invalid department ID'),
];

const createDepartmentValidation = [
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required'),
  body('description').optional().isString(),
];

const updateDepartmentValidation = [
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
  body('description').optional().isString(),
  body('isActive').optional().isBoolean(),
];

const equipmentValidation = [
  body('equipment').isArray().withMessage('Equipment must be an array'),
];

const servicesValidation = [
  body('services').isArray().withMessage('Services must be an array'),
];

const availabilityValidation = [
  body('operatingHours').isObject().withMessage('Operating hours must be an object'),
];

// Public routes (no auth required for viewing)
router.get('/', getDepartments);
router.get('/:id', departmentIdValidation, getDepartmentById);
router.get('/:id/doctors', departmentIdValidation, getDepartmentDoctors);
router.get('/:id/nurses', departmentIdValidation, getDepartmentNurses);
router.get('/:id/stats', departmentIdValidation, getDepartmentStats);
router.get('/:id/wards', departmentIdValidation, getDepartmentWards);
router.get('/:id/beds', departmentIdValidation, getDepartmentBeds);
router.get('/:id/equipment', departmentIdValidation, getDepartmentEquipment);
router.get('/:id/services', departmentIdValidation, getDepartmentServices);
router.get('/:id/availability', departmentIdValidation, getDepartmentAvailability);

// Admin only routes
router.use(authenticate);
router.use(authorize('admin'));

router.post('/', createDepartmentValidation, createDepartment);
router.put('/:id', departmentIdValidation, updateDepartmentValidation, updateDepartment);
router.delete('/:id', departmentIdValidation, deleteDepartment);
router.put('/:id/equipment', departmentIdValidation, equipmentValidation, updateDepartmentEquipment);
router.put('/:id/services', departmentIdValidation, servicesValidation, updateDepartmentServices);
router.put('/:id/availability', departmentIdValidation, availabilityValidation, updateDepartmentAvailability);

module.exports = router;
