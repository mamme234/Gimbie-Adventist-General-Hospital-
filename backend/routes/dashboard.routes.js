/**
 * ============================================
 * DASHBOARD.ROUTES.JS - Dashboard Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // General Dashboard
  getDashboardData,
  getDashboardStats,
  getDashboardCharts,
  getDashboardWidgets,
  getDashboardNotifications,
  getDashboardActivities,
  
  // Role-based Dashboards
  getPatientDashboard,
  getDoctorDashboard,
  getNurseDashboard,
  getAdminDashboard,
  getFinanceDashboard,
  getHRDashboard,
  getPharmacyDashboard,
  getLabDashboard,
  getRadiologyDashboard,
  
  // Custom Dashboard
  getCustomDashboard,
  createCustomDashboard,
  updateCustomDashboard,
  deleteCustomDashboard,
  getDashboardWidget,
  addDashboardWidget,
  updateDashboardWidget,
  deleteDashboardWidget,
  
  // Dashboard Data Sources
  getDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  getDataSourceData,
  
  // Dashboard Reports
  getDashboardReports,
  generateDashboardReport,
  exportDashboard,
  
  // Dashboard Settings
  getDashboardSettings,
  updateDashboardSettings,
  resetDashboard,
} = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const dashboardIdValidation = [
  param('id').isMongoId().withMessage('Invalid dashboard ID'),
];

const createDashboardValidation = [
  body('name').notEmpty().withMessage('Dashboard name is required'),
  body('layout').isArray().withMessage('Layout must be an array'),
  body('widgets').isArray().withMessage('Widgets must be an array'),
  body('isDefault').optional().isBoolean(),
];

const updateDashboardValidation = [
  body('name').optional().notEmpty().withMessage('Dashboard name cannot be empty'),
  body('layout').optional().isArray().withMessage('Layout must be an array'),
  body('widgets').optional().isArray().withMessage('Widgets must be an array'),
  body('isDefault').optional().isBoolean(),
];

const widgetValidation = [
  body('type').notEmpty().withMessage('Widget type is required'),
  body('title').notEmpty().withMessage('Widget title is required'),
  body('config').isObject().withMessage('Config must be an object'),
  body('size').isObject().withMessage('Size must be an object'),
  body('position').isObject().withMessage('Position must be an object'),
];

const dataSourceValidation = [
  body('name').notEmpty().withMessage('Data source name is required'),
  body('type').notEmpty().withMessage('Data source type is required'),
  body('config').isObject().withMessage('Config must be an object'),
];

// All routes require authentication
router.use(authenticate);

// General Dashboard
router.get('/', getDashboardData);
router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/widgets', getDashboardWidgets);
router.get('/notifications', getDashboardNotifications);
router.get('/activities', getDashboardActivities);

// Role-based Dashboards
router.get('/patient', authorize('patient'), getPatientDashboard);
router.get('/doctor', authorize('doctor'), getDoctorDashboard);
router.get('/nurse', authorize('nurse'), getNurseDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/finance', authorize('finance'), getFinanceDashboard);
router.get('/hr', authorize('hr'), getHRDashboard);
router.get('/pharmacy', authorize('pharmacist'), getPharmacyDashboard);
router.get('/lab', authorize('lab_technician'), getLabDashboard);
router.get('/radiology', authorize('radiologist'), getRadiologyDashboard);

// Custom Dashboards
router.get('/custom', getCustomDashboard);
router.post('/custom', authorize('admin'), createDashboardValidation, createCustomDashboard);
router.get('/custom/:id', dashboardIdValidation, getCustomDashboard);
router.put('/custom/:id', authorize('admin'), dashboardIdValidation, updateDashboardValidation, updateCustomDashboard);
router.delete('/custom/:id', authorize('admin'), dashboardIdValidation, deleteCustomDashboard);

// Dashboard Widgets
router.get('/widgets/:id', getDashboardWidget);
router.post('/widgets', authorize('admin'), widgetValidation, addDashboardWidget);
router.put('/widgets/:id', authorize('admin'), widgetValidation, updateDashboardWidget);
router.delete('/widgets/:id', authorize('admin'), deleteDashboardWidget);

// Data Sources
router.get('/data-sources', authorize('admin'), getDataSource);
router.post('/data-sources', authorize('admin'), dataSourceValidation, createDataSource);
router.get('/data-sources/:id', authorize('admin'), getDataSource);
router.put('/data-sources/:id', authorize('admin'), dataSourceValidation, updateDataSource);
router.delete('/data-sources/:id', authorize('admin'), deleteDataSource);
router.post('/data-sources/:id/data', authorize('admin'), getDataSourceData);

// Dashboard Reports
router.get('/reports', authorize('admin'), getDashboardReports);
router.post('/reports/generate', authorize('admin'), generateDashboardReport);
router.post('/export', authorize('admin'), exportDashboard);

// Dashboard Settings
router.get('/settings', getDashboardSettings);
router.put('/settings', updateDashboardSettings);
router.post('/reset', authorize('admin'), resetDashboard);

module.exports = router;
