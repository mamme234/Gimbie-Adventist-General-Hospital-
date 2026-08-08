/**
 * ============================================
 * ANALYTICS.ROUTES.JS - Analytics Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Dashboard Analytics
  getDashboardAnalytics,
  getSystemOverview,
  getKeyMetrics,
  
  // Patient Analytics
  getPatientAnalytics,
  getPatientDemographics,
  getPatientTrends,
  getPatientSatisfaction,
  getPatientRetention,
  
  // Financial Analytics
  getFinancialAnalytics,
  getRevenueAnalytics,
  getExpenseAnalytics,
  getProfitabilityAnalytics,
  getPaymentAnalytics,
  
  // Operational Analytics
  getOperationalAnalytics,
  getAppointmentAnalytics,
  getWaitTimeAnalytics,
  getOccupancyAnalytics,
  getResourceUtilization,
  
  // Clinical Analytics
  getClinicalAnalytics,
  getDiagnosisAnalytics,
  getTreatmentAnalytics,
  getOutcomeAnalytics,
  getMedicationAnalytics,
  
  // Staff Analytics
  getStaffAnalytics,
  getStaffPerformance,
  getStaffProductivity,
  getStaffTurnover,
  
  // Department Analytics
  getDepartmentAnalytics,
  getDepartmentPerformance,
  getDepartmentComparison,
  
  // Custom Analytics
  createCustomQuery,
  getCustomQuery,
  updateCustomQuery,
  deleteCustomQuery,
  executeCustomQuery,
  
  // Export Analytics
  exportAnalytics,
  getAnalyticsReport,
  
  // Real-time Analytics
  getRealTimeAnalytics,
  getLiveMetrics,
  
  // Predictive Analytics
  getPredictions,
  getForecasts,
} = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const queryIdValidation = [
  param('id').isMongoId().withMessage('Invalid query ID'),
];

const customQueryValidation = [
  body('name').notEmpty().withMessage('Query name is required'),
  body('description').optional().isString(),
  body('query').isObject().withMessage('Query must be an object'),
  body('type').isIn(['Patient', 'Financial', 'Operational', 'Clinical', 'Staff']).withMessage('Invalid query type'),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard Analytics
router.get('/dashboard', getDashboardAnalytics);
router.get('/overview', getSystemOverview);
router.get('/metrics', getKeyMetrics);

// Patient Analytics
router.get('/patients', getPatientAnalytics);
router.get('/patients/demographics', getPatientDemographics);
router.get('/patients/trends', getPatientTrends);
router.get('/patients/satisfaction', getPatientSatisfaction);
router.get('/patients/retention', getPatientRetention);

// Financial Analytics
router.get('/financial', getFinancialAnalytics);
router.get('/financial/revenue', getRevenueAnalytics);
router.get('/financial/expenses', getExpenseAnalytics);
router.get('/financial/profitability', getProfitabilityAnalytics);
router.get('/financial/payments', getPaymentAnalytics);

// Operational Analytics
router.get('/operational', getOperationalAnalytics);
router.get('/operational/appointments', getAppointmentAnalytics);
router.get('/operational/wait-times', getWaitTimeAnalytics);
router.get('/operational/occupancy', getOccupancyAnalytics);
router.get('/operational/resources', getResourceUtilization);

// Clinical Analytics
router.get('/clinical', getClinicalAnalytics);
router.get('/clinical/diagnosis', getDiagnosisAnalytics);
router.get('/clinical/treatments', getTreatmentAnalytics);
router.get('/clinical/outcomes', getOutcomeAnalytics);
router.get('/clinical/medications', getMedicationAnalytics);

// Staff Analytics
router.get('/staff', getStaffAnalytics);
router.get('/staff/performance', getStaffPerformance);
router.get('/staff/productivity', getStaffProductivity);
router.get('/staff/turnover', getStaffTurnover);

// Department Analytics
router.get('/departments', getDepartmentAnalytics);
router.get('/departments/performance', getDepartmentPerformance);
router.get('/departments/comparison', getDepartmentComparison);

// Custom Analytics
router.get('/custom', getCustomQuery);
router.post('/custom', customQueryValidation, createCustomQuery);
router.get('/custom/:id', queryIdValidation, getCustomQuery);
router.put('/custom/:id', queryIdValidation, customQueryValidation, updateCustomQuery);
router.delete('/custom/:id', queryIdValidation, deleteCustomQuery);
router.post('/custom/:id/execute', queryIdValidation, executeCustomQuery);

// Export Analytics
router.post('/export', exportAnalytics);
router.post('/report', getAnalyticsReport);

// Real-time Analytics
router.get('/live', getRealTimeAnalytics);
router.get('/live/metrics', getLiveMetrics);

// Predictive Analytics
router.get('/predictions', getPredictions);
router.get('/forecasts', getForecasts);

module.exports = router;
