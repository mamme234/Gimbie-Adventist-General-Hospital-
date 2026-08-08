/**
 * ============================================
 * ADMIN.ROUTES.JS - Admin Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Dashboard
  getDashboardStats,
  getSystemOverview,
  getRecentActivities,

  // User Management
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,

  // Role Management
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  updatePermissions,

  // System Management
  getSystemLogs,
  getSystemSettings,
  updateSystemSettings,
  getSystemInfo,
  clearCache,

  // Backup
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,

  // Audit
  getAuditLogs,
  getAuditLogById,

  // Reports
  getAdminReports,
  generateReport,

  // Maintenance
  runMaintenance,
  getMaintenanceStatus,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const userIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

const createUserValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['admin', 'doctor', 'nurse', 'patient', 'staff', 'finance', 'hr']).withMessage('Invalid role'),
];

const updateUserValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'patient', 'staff', 'finance', 'hr']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const roleValidation = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
];

const settingsValidation = [
  body('key').notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required'),
];

const backupValidation = [
  body('type').isIn(['full', 'incremental', 'database']).withMessage('Invalid backup type'),
];

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/overview', getSystemOverview);
router.get('/dashboard/activities', getRecentActivities);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', userIdValidation, getUserById);
router.post('/users', createUserValidation, createUser);
router.put('/users/:id', userIdValidation, updateUserValidation, updateUser);
router.delete('/users/:id', userIdValidation, deleteUser);
router.patch('/users/:id/toggle', userIdValidation, toggleUserStatus);
router.post('/users/:id/reset-password', userIdValidation, resetUserPassword);

// Role Management
router.get('/roles', getRoles);
router.get('/roles/:id', getRoleById);
router.post('/roles', roleValidation, createRole);
router.put('/roles/:id', roleValidation, updateRole);
router.delete('/roles/:id', deleteRole);
router.get('/permissions', getPermissions);
router.put('/permissions', updatePermissions);

// System Management
router.get('/logs', getSystemLogs);
router.get('/settings', getSystemSettings);
router.put('/settings', settingsValidation, updateSystemSettings);
router.get('/info', getSystemInfo);
router.post('/cache/clear', clearCache);

// Backup
router.post('/backup', backupValidation, createBackup);
router.get('/backups', getBackups);
router.post('/backups/:id/restore', restoreBackup);
router.delete('/backups/:id', deleteBackup);

// Audit
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/:id', getAuditLogById);

// Reports
router.get('/reports', getAdminReports);
router.post('/reports/generate', generateReport);

// Maintenance
router.post('/maintenance', runMaintenance);
router.get('/maintenance/status', getMaintenanceStatus);

module.exports = router;
