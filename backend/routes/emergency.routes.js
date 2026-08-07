/**
 * ============================================
 * EMERGENCY.ROUTES.JS - Emergency Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Emergency Cases
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  getActiveCases,
  getTriageCases,
  
  // Triage
  createTriage,
  updateTriage,
  getTriageByCase,
  
  // Ambulance
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  dispatchAmbulance,
  updateAmbulanceLocation,
  getAvailableAmbulances,
  getActiveAmbulances,
  
  // Emergency Team
  getEmergencyTeam,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamAvailability,
  
  // Emergency Stats
  getEmergencyStats,
  getDailyStats,
  getMonthlyStats,
  getResponseTimeStats,
  
  // Emergency Reports
  getReports,
  generateReport,
  
  // Emergency Alerts
  getAlerts,
  createAlert,
  updateAlert,
  resolveAlert,
} = require('../controllers/emergency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const caseIdValidation = [
  param('id').isMongoId().withMessage('Invalid case ID'),
];

const createCaseValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('chiefComplaint').notEmpty().withMessage('Chief complaint is required'),
  body('severity').isIn(['Critical', 'Severe', 'Moderate', 'Mild']).withMessage('Invalid severity'),
  body('arrivalMode').isIn(['Ambulance', 'Walk-in', 'Private Vehicle', 'Other']).withMessage('Invalid arrival mode'),
];

const updateCaseValidation = [
  body('status').optional().isIn(['Triage', 'Waiting', 'In Treatment', 'Admitted', 'Discharged', 'Transferred']),
  body('severity').optional().isIn(['Critical', 'Severe', 'Moderate', 'Mild']),
];

const triageValidation = [
  body('caseId').isMongoId().withMessage('Invalid case ID'),
  body('level').isIn(['1', '2', '3', '4', '5']).withMessage('Invalid triage level'),
  body('bloodPressure').notEmpty().withMessage('Blood pressure is required'),
  body('heartRate').notEmpty().withMessage('Heart rate is required'),
  body('temperature').notEmpty().withMessage('Temperature is required'),
  body('oxygenSaturation').notEmpty().withMessage('Oxygen saturation is required'),
];

const ambulanceValidation = [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('driver').notEmpty().withMessage('Driver name is required'),
  body('status').isIn(['Available', 'On Dispatch', 'Maintenance', 'Out of Service']).withMessage('Invalid status'),
];

const dispatchValidation = [
  body('caseId').isMongoId().withMessage('Invalid case ID'),
  body('location').notEmpty().withMessage('Location is required'),
  body('priority').isIn(['Normal', 'Urgent', 'Emergency']).withMessage('Invalid priority'),
];

const teamMemberValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['Doctor', 'Nurse', 'Paramedic', 'EMT', 'Driver']).withMessage('Invalid role'),
  body('phone').notEmpty().withMessage('Phone is required'),
];

const alertValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
];

// All routes require authentication
router.use(authenticate);

// Emergency Cases
router.get('/cases', authorize('admin', 'doctor', 'nurse'), getCases);
router.get('/cases/active', authorize('admin', 'doctor', 'nurse'), getActiveCases);
router.get('/cases/triage', authorize('admin', 'doctor', 'nurse'), getTriageCases);
router.post('/cases', authorize('admin', 'doctor', 'nurse'), createCaseValidation, createCase);
router.get('/cases/:id', authorize('admin', 'doctor', 'nurse'), caseIdValidation, getCaseById);
router.put('/cases/:id', authorize('admin', 'doctor', 'nurse'), caseIdValidation, updateCaseValidation, updateCase);
router.delete('/cases/:id', authorize('admin'), caseIdValidation, deleteCase);

// Triage
router.post('/triage', authorize('admin', 'doctor', 'nurse'), triageValidation, createTriage);
router.put('/triage/:id', authorize('admin', 'doctor', 'nurse'), updateTriage);
router.get('/triage/case/:caseId', authorize('admin', 'doctor', 'nurse'), getTriageByCase);

// Ambulance
router.get('/ambulances', authorize('admin', 'doctor', 'nurse'), getAmbulances);
router.get('/ambulances/available', authorize('admin', 'doctor', 'nurse'), getAvailableAmbulances);
router.get('/ambulances/active', authorize('admin', 'doctor', 'nurse'), getActiveAmbulances);
router.post('/ambulances', authorize('admin'), ambulanceValidation, createAmbulance);
router.get('/ambulances/:id', authorize('admin', 'doctor', 'nurse'), getAmbulanceById);
router.put('/ambulances/:id', authorize('admin'), ambulanceValidation, updateAmbulance);
router.delete('/ambulances/:id', authorize('admin'), deleteAmbulance);
router.post('/ambulances/:id/dispatch', authorize('admin', 'doctor', 'nurse'), dispatchValidation, dispatchAmbulance);
router.patch('/ambulances/:id/location', authorize('admin', 'doctor', 'nurse'), updateAmbulanceLocation);

// Emergency Team
router.get('/team', authorize('admin', 'doctor', 'nurse'), getEmergencyTeam);
router.get('/team/availability', authorize('admin', 'doctor', 'nurse'), getTeamAvailability);
router.post('/team', authorize('admin'), teamMemberValidation, createTeamMember);
router.get('/team/:id', authorize('admin', 'doctor', 'nurse'), getTeamMemberById);
router.put('/team/:id', authorize('admin'), teamMemberValidation, updateTeamMember);
router.delete('/team/:id', authorize('admin'), deleteTeamMember);

// Stats
router.get('/stats', authorize('admin', 'doctor'), getEmergencyStats);
router.get('/stats/daily', authorize('admin', 'doctor'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'doctor'), getMonthlyStats);
router.get('/stats/response-time', authorize('admin', 'doctor'), getResponseTimeStats);

// Reports
router.get('/reports', authorize('admin', 'doctor'), getReports);
router.post('/reports/generate', authorize('admin', 'doctor'), generateReport);

// Alerts
router.get('/alerts', authorize('admin', 'doctor', 'nurse'), getAlerts);
router.post('/alerts', authorize('admin', 'doctor'), alertValidation, createAlert);
router.put('/alerts/:id', authorize('admin', 'doctor'), updateAlert);
router.patch('/alerts/:id/resolve', authorize('admin', 'doctor'), resolveAlert);

module.exports = router;
