/**
 * ============================================
 * INSURANCE.ROUTES.JS - Insurance Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Insurance Providers
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getActiveProviders,
  
  // Insurance Policies
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPatientPolicies,
  getActivePolicies,
  getExpiringPolicies,
  
  // Insurance Claims
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim,
  getPatientClaims,
  getPendingClaims,
  getApprovedClaims,
  getRejectedClaims,
  submitClaim,
  approveClaim,
  rejectClaim,
  
  // Insurance Coverage
  getCoverage,
  getCoverageById,
  createCoverage,
  updateCoverage,
  deleteCoverage,
  getPatientCoverage,
  verifyCoverage,
  
  // Insurance Reports
  getReports,
  generateReport,
  
  // Stats
  getInsuranceStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/insurance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const providerIdValidation = [
  param('id').isMongoId().withMessage('Invalid provider ID'),
];

const policyIdValidation = [
  param('id').isMongoId().withMessage('Invalid policy ID'),
];

const claimIdValidation = [
  param('id').isMongoId().withMessage('Invalid claim ID'),
];

const createProviderValidation = [
  body('name').notEmpty().withMessage('Provider name is required'),
  body('code').notEmpty().withMessage('Provider code is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
];

const createPolicyValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('providerId').isMongoId().withMessage('Invalid provider ID'),
  body('policyNumber').notEmpty().withMessage('Policy number is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('coverageAmount').isNumeric().withMessage('Coverage amount must be a number'),
];

const createClaimValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('policyId').isMongoId().withMessage('Invalid policy ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('serviceDate').isISO8601().withMessage('Invalid service date'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
];

const coverageValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('policyId').isMongoId().withMessage('Invalid policy ID'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('coveragePercentage').isNumeric().withMessage('Coverage percentage must be a number'),
];

// All routes require authentication
router.use(authenticate);

// Insurance Providers
router.get('/providers', authorize('admin', 'finance', 'patient'), getProviders);
router.get('/providers/active', authorize('admin', 'finance'), getActiveProviders);
router.post('/providers', authorize('admin'), createProviderValidation, createProvider);
router.get('/providers/:id', authorize('admin', 'finance', 'patient'), providerIdValidation, getProviderById);
router.put('/providers/:id', authorize('admin'), providerIdValidation, createProviderValidation, updateProvider);
router.delete('/providers/:id', authorize('admin'), providerIdValidation, deleteProvider);

// Insurance Policies
router.get('/policies', authorize('admin', 'finance', 'patient'), getPolicies);
router.get('/policies/active', authorize('admin', 'finance', 'patient'), getActivePolicies);
router.get('/policies/expiring', authorize('admin', 'finance'), getExpiringPolicies);
router.get('/policies/patient/:patientId', authorize('admin', 'finance', 'patient'), getPatientPolicies);
router.post('/policies', authorize('admin', 'finance'), createPolicyValidation, createPolicy);
router.get('/policies/:id', authorize('admin', 'finance', 'patient'), policyIdValidation, getPolicyById);
router.put('/policies/:id', authorize('admin', 'finance'), policyIdValidation, createPolicyValidation, updatePolicy);
router.delete('/policies/:id', authorize('admin'), policyIdValidation, deletePolicy);

// Insurance Claims
router.get('/claims', authorize('admin', 'finance', 'patient'), getClaims);
router.get('/claims/pending', authorize('admin', 'finance'), getPendingClaims);
router.get('/claims/approved', authorize('admin', 'finance', 'patient'), getApprovedClaims);
router.get('/claims/rejected', authorize('admin', 'finance', 'patient'), getRejectedClaims);
router.get('/claims/patient/:patientId', authorize('admin', 'finance', 'patient'), getPatientClaims);
router.post('/claims', authorize('admin', 'finance', 'patient'), createClaimValidation, createClaim);
router.get('/claims/:id', authorize('admin', 'finance', 'patient'), claimIdValidation, getClaimById);
router.put('/claims/:id', authorize('admin', 'finance'), claimIdValidation, createClaimValidation, updateClaim);
router.delete('/claims/:id', authorize('admin'), claimIdValidation, deleteClaim);
router.post('/claims/:id/submit', authorize('admin', 'finance'), claimIdValidation, submitClaim);
router.post('/claims/:id/approve', authorize('admin', 'finance'), claimIdValidation, approveClaim);
router.post('/claims/:id/reject', authorize('admin', 'finance'), claimIdValidation, rejectClaim);

// Insurance Coverage
router.get('/coverage', authorize('admin', 'finance', 'patient'), getCoverage);
router.get('/coverage/patient/:patientId', authorize('admin', 'finance', 'patient'), getPatientCoverage);
router.post('/coverage/verify', authorize('admin', 'finance'), verifyCoverage);
router.post('/coverage', authorize('admin', 'finance'), coverageValidation, createCoverage);
router.get('/coverage/:id', authorize('admin', 'finance', 'patient'), getCoverageById);
router.put('/coverage/:id', authorize('admin', 'finance'), coverageValidation, updateCoverage);
router.delete('/coverage/:id', authorize('admin'), deleteCoverage);

// Reports
router.get('/reports', authorize('admin', 'finance'), getReports);
router.post('/reports/generate', authorize('admin', 'finance'), generateReport);

// Stats
router.get('/stats', authorize('admin', 'finance'), getInsuranceStats);
router.get('/stats/daily', authorize('admin', 'finance'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'finance'), getMonthlyStats);

module.exports = router;
