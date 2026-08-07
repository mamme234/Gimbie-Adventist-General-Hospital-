/**
 * ============================================
 * REPORTS.ROUTES.JS - Reports Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Report Generation
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  scheduleReport,
  cancelScheduledReport,
  
  // Report Types
  getReportTypes,
  getReportTypeById,
  createReportType,
  updateReportType,
  deleteReportType,
  
  // Report Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  
  // Report Data
  getReportData,
  exportReport,
  downloadReport,
  
  // Scheduled Reports
  getScheduledReports,
  getScheduledReportById,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  
  // Report Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Report Permissions
  getReportPermissions,
  updateReportPermissions,
  
  // Report History
  getReportHistory,
  getReportVersion,
  restoreReportVersion,
  
  // Stats
  getReportStats,
} = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const reportIdValidation = [
  param('id').isMongoId().withMessage('Invalid report ID'),
];

const createReportValidation = [
  body('name').notEmpty().withMessage('Report name is required'),
  body('type').notEmpty().withMessage('Report type is required'),
  body('category').optional().isString(),
  body('parameters').isObject().withMessage('Parameters must be an object'),
  body('format').isIn(['PDF', 'Excel', 'CSV', 'JSON']).withMessage('Invalid format'),
];

const updateReportValidation = [
  body('name').optional().notEmpty().withMessage('Report name cannot be empty'),
  body('status').optional().isIn(['Draft', 'Pending', 'Generated', 'Failed']).withMessage('Invalid status'),
];

const scheduleValidation = [
  body('reportId').isMongoId().withMessage('Invalid report ID'),
  body('frequency').isIn(['Daily', 'Weekly', 'Monthly', 'Quarterly']).withMessage('Invalid frequency'),
  body('day').optional().isNumeric().withMessage('Day must be a number'),
  body('time').notEmpty().withMessage('Time is required'),
  body('recipients').isArray().withMessage('Recipients must be an array'),
];

const templateValidation = [
  body('name').notEmpty().withMessage('Template name is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').notEmpty().withMessage('Type is required'),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin'));

// Report Generation
router.get('/', getReports);
router.post('/', createReportValidation, createReport);
router.get('/:id', reportIdValidation, getReportById);
router.put('/:id', reportIdValidation, updateReportValidation, updateReport);
router.delete('/:id', reportIdValidation, deleteReport);
router.post('/:id/generate', reportIdValidation, generateReport);
router.post('/:id/schedule', reportIdValidation, scheduleValidation, scheduleReport);
router.delete('/:id/schedule', reportIdValidation, cancelScheduledReport);

// Report Types
router.get('/types', getReportTypes);
router.post('/types', createReportType);
router.get('/types/:id', getReportTypeById);
router.put('/types/:id', updateReportType);
router.delete('/types/:id', deleteReportType);

// Report Templates
router.get('/templates', getTemplates);
router.post('/templates', templateValidation, createTemplate);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', templateValidation, updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// Report Data
router.post('/:id/data', reportIdValidation, getReportData);
router.post('/:id/export', reportIdValidation, exportReport);
router.get('/:id/download', reportIdValidation, downloadReport);

// Scheduled Reports
router.get('/scheduled', getScheduledReports);
router.post('/scheduled', createScheduledReport);
router.get('/scheduled/:id', getScheduledReportById);
router.put('/scheduled/:id', updateScheduledReport);
router.delete('/scheduled/:id', deleteScheduledReport);

// Report Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/categories/:id', getCategoryById);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Report Permissions
router.get('/permissions', getReportPermissions);
router.put('/permissions', updateReportPermissions);

// Report History
router.get('/:id/history', reportIdValidation, getReportHistory);
router.get('/:id/history/:version', reportIdValidation, getReportVersion);
router.post('/:id/history/:version/restore', reportIdValidation, restoreReportVersion);

// Stats
router.get('/stats', getReportStats);

module.exports = router;
