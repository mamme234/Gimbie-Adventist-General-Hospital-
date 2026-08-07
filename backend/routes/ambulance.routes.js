/**
 * ============================================
 * AMBULANCE.ROUTES.JS - Ambulance Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Ambulance Fleet
  getAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  getAvailableAmbulances,
  getActiveAmbulances,
  getMaintenanceAmbulances,
  
  // Ambulance Dispatch
  getDispatches,
  getDispatchById,
  createDispatch,
  updateDispatch,
  deleteDispatch,
  getActiveDispatches,
  getCompletedDispatches,
  assignAmbulance,
  updateDispatchStatus,
  completeDispatch,
  
  // Ambulance Tracking
  getAmbulanceLocation,
  updateAmbulanceLocation,
  getAmbulanceHistory,
  
  // Emergency Calls
  getEmergencyCalls,
  getEmergencyCallById,
  createEmergencyCall,
  updateEmergencyCall,
  deleteEmergencyCall,
  getActiveCalls,
  getCompletedCalls,
  
  // Ambulance Staff
  getAmbulanceStaff,
  getAmbulanceStaffById,
  createAmbulanceStaff,
  updateAmbulanceStaff,
  deleteAmbulanceStaff,
  getStaffByAmbulance,
  
  // Ambulance Maintenance
  getMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceByAmbulance,
  
  // Ambulance Reports
  getReports,
  generateReport,
  
  // Stats
  getAmbulanceStats,
  getDailyStats,
  getMonthlyStats,
  
  // Real-time Tracking
  getLiveTracking,
  updateLiveTracking,
} = require('../controllers/ambulance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const ambulanceIdValidation = [
  param('id').isMongoId().withMessage('Invalid ambulance ID'),
];

const createAmbulanceValidation = [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('type').isIn(['Basic', 'Advanced', 'ICU']).withMessage('Invalid ambulance type'),
  body('driver').notEmpty().withMessage('Driver name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
];

const updateAmbulanceValidation = [
  body('status').optional().isIn(['Available', 'On Dispatch', 'Maintenance', 'Out of Service']).withMessage('Invalid status'),
  body('driver').optional().notEmpty().withMessage('Driver name cannot be empty'),
];

const dispatchValidation = [
  body('ambulanceId').isMongoId().withMessage('Invalid ambulance ID'),
  body('emergencyCallId').isMongoId().withMessage('Invalid emergency call ID'),
  body('location').notEmpty().withMessage('Location is required'),
  body('priority').isIn(['Normal', 'Urgent', 'Emergency']).withMessage('Invalid priority'),
  body('eta').optional().isString(),
];

const callValidation = [
  body('callerName').notEmpty().withMessage('Caller name is required'),
  body('callerPhone').notEmpty().withMessage('Caller phone is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('nature').notEmpty().withMessage('Nature of emergency is required'),
  body('priority').isIn(['Normal', 'Urgent', 'Emergency']).withMessage('Invalid priority'),
];

const staffValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['Driver', 'Paramedic', 'EMT', 'Nurse']).withMessage('Invalid role'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
];

const maintenanceValidation = [
  body('ambulanceId').isMongoId().withMessage('Invalid ambulance ID'),
  body('type').notEmpty().withMessage('Maintenance type is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('description').notEmpty().withMessage('Description is required'),
  body('cost').isNumeric().withMessage('Cost must be a number'),
];

const trackingValidation = [
  body('ambulanceId').isMongoId().withMessage('Invalid ambulance ID'),
  body('latitude').isNumeric().withMessage('Latitude must be a number'),
  body('longitude').isNumeric().withMessage('Longitude must be a number'),
  body('speed').optional().isNumeric(),
  body('heading').optional().isNumeric(),
];

// All routes require authentication
router.use(authenticate);
router.use(authorize('admin', 'doctor', 'nurse', 'emergency'));

// Ambulance Fleet
router.get('/', getAmbulances);
router.get('/available', getAvailableAmbulances);
router.get('/active', getActiveAmbulances);
router.get('/maintenance', getMaintenanceAmbulances);
router.post('/', createAmbulanceValidation, createAmbulance);
router.get('/:id', ambulanceIdValidation, getAmbulanceById);
router.put('/:id', ambulanceIdValidation, updateAmbulanceValidation, updateAmbulance);
router.delete('/:id', ambulanceIdValidation, deleteAmbulance);

// Ambulance Dispatch
router.get('/dispatches', getDispatches);
router.get('/dispatches/active', getActiveDispatches);
router.get('/dispatches/completed', getCompletedDispatches);
router.post('/dispatches', dispatchValidation, createDispatch);
router.get('/dispatches/:id', getDispatchById);
router.put('/dispatches/:id', dispatchValidation, updateDispatch);
router.delete('/dispatches/:id', deleteDispatch);
router.post('/dispatches/:id/assign', assignAmbulance);
router.patch('/dispatches/:id/status', updateDispatchStatus);
router.post('/dispatches/:id/complete', completeDispatch);

// Ambulance Tracking
router.get('/tracking/:id', ambulanceIdValidation, getAmbulanceLocation);
router.post('/tracking', trackingValidation, updateAmbulanceLocation);
router.get('/tracking/:id/history', ambulanceIdValidation, getAmbulanceHistory);

// Emergency Calls
router.get('/calls', getEmergencyCalls);
router.get('/calls/active', getActiveCalls);
router.get('/calls/completed', getCompletedCalls);
router.post('/calls', callValidation, createEmergencyCall);
router.get('/calls/:id', getEmergencyCallById);
router.put('/calls/:id', callValidation, updateEmergencyCall);
router.delete('/calls/:id', deleteEmergencyCall);

// Ambulance Staff
router.get('/staff', getAmbulanceStaff);
router.get('/staff/ambulance/:ambulanceId', getStaffByAmbulance);
router.post('/staff', staffValidation, createAmbulanceStaff);
router.get('/staff/:id', getAmbulanceStaffById);
router.put('/staff/:id', staffValidation, updateAmbulanceStaff);
router.delete('/staff/:id', deleteAmbulanceStaff);

// Ambulance Maintenance
router.get('/maintenance', getMaintenanceRecords);
router.get('/maintenance/ambulance/:ambulanceId', getMaintenanceByAmbulance);
router.post('/maintenance', maintenanceValidation, createMaintenanceRecord);
router.get('/maintenance/:id', getMaintenanceRecordById);
router.put('/maintenance/:id', maintenanceValidation, updateMaintenanceRecord);
router.delete('/maintenance/:id', deleteMaintenanceRecord);

// Real-time Tracking
router.get('/live-tracking', getLiveTracking);
router.post('/live-tracking', updateLiveTracking);

// Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

// Stats
router.get('/stats', getAmbulanceStats);
router.get('/stats/daily', getDailyStats);
router.get('/stats/monthly', getMonthlyStats);

module.exports = router;
