/**
 * ============================================
 * TELEMEDICINE.ROUTES.JS - Telemedicine Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Telemedicine Sessions
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getPatientSessions,
  getDoctorSessions,
  getActiveSessions,
  getCompletedSessions,
  getUpcomingSessions,
  
  // Session Management
  startSession,
  endSession,
  joinSession,
  leaveSession,
  getSessionStatus,
  
  // Video Calls
  getVideoCalls,
  getVideoCallById,
  createVideoCall,
  updateVideoCall,
  deleteVideoCall,
  startVideoCall,
  endVideoCall,
  getVideoCallToken,
  
  // Prescriptions (Telemedicine)
  getTelePrescriptions,
  getTelePrescriptionById,
  createTelePrescription,
  updateTelePrescription,
  deleteTelePrescription,
  
  // Telemedicine Notes
  getTeleNotes,
  getTeleNoteById,
  createTeleNote,
  updateTeleNote,
  deleteTeleNote,
  
  // Telemedicine Reports
  getReports,
  generateReport,
  
  // Stats
  getTelemedicineStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/telemedicine.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const sessionIdValidation = [
  param('id').isMongoId().withMessage('Invalid session ID'),
];

const createSessionValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
  body('type').isIn(['Video', 'Phone', 'Chat']).withMessage('Invalid session type'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

const updateSessionValidation = [
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No-Show']),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
];

const videoCallValidation = [
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('provider').isIn(['Zoom', 'Google Meet', 'Jitsi', 'Custom']).withMessage('Invalid provider'),
  body('link').optional().isURL().withMessage('Invalid URL'),
];

const prescriptionValidation = [
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('medications').isArray().withMessage('Medications must be an array'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
];

const noteValidation = [
  body('sessionId').isMongoId().withMessage('Invalid session ID'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['Clinical', 'Administrative']).withMessage('Invalid note type'),
];

// All routes require authentication
router.use(authenticate);

// Telemedicine Sessions
router.get('/sessions', getSessions);
router.get('/sessions/active', getActiveSessions);
router.get('/sessions/completed', getCompletedSessions);
router.get('/sessions/upcoming', getUpcomingSessions);
router.get('/sessions/patient/:patientId', getPatientSessions);
router.get('/sessions/doctor/:doctorId', getDoctorSessions);
router.post('/sessions', createSessionValidation, createSession);
router.get('/sessions/:id', sessionIdValidation, getSessionById);
router.put('/sessions/:id', sessionIdValidation, updateSessionValidation, updateSession);
router.delete('/sessions/:id', sessionIdValidation, deleteSession);

// Session Management
router.post('/sessions/:id/start', sessionIdValidation, startSession);
router.post('/sessions/:id/end', sessionIdValidation, endSession);
router.post('/sessions/:id/join', sessionIdValidation, joinSession);
router.post('/sessions/:id/leave', sessionIdValidation, leaveSession);
router.get('/sessions/:id/status', sessionIdValidation, getSessionStatus);

// Video Calls
router.get('/video-calls', getVideoCalls);
router.post('/video-calls', videoCallValidation, createVideoCall);
router.get('/video-calls/:id', getVideoCallById);
router.put('/video-calls/:id', videoCallValidation, updateVideoCall);
router.delete('/video-calls/:id', deleteVideoCall);
router.post('/video-calls/:id/start', startVideoCall);
router.post('/video-calls/:id/end', endVideoCall);
router.get('/video-calls/:id/token', getVideoCallToken);

// Telemedicine Prescriptions
router.get('/prescriptions', getTelePrescriptions);
router.post('/prescriptions', prescriptionValidation, createTelePrescription);
router.get('/prescriptions/:id', getTelePrescriptionById);
router.put('/prescriptions/:id', prescriptionValidation, updateTelePrescription);
router.delete('/prescriptions/:id', deleteTelePrescription);

// Telemedicine Notes
router.get('/notes', getTeleNotes);
router.post('/notes', noteValidation, createTeleNote);
router.get('/notes/:id', getTeleNoteById);
router.put('/notes/:id', noteValidation, updateTeleNote);
router.delete('/notes/:id', deleteTeleNote);

// Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

// Stats
router.get('/stats', getTelemedicineStats);
router.get('/stats/daily', getDailyStats);
router.get('/stats/monthly', getMonthlyStats);

module.exports = router;
