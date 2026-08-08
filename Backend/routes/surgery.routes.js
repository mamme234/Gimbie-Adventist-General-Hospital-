/**
 * ============================================
 * SURGERY.ROUTES.JS - Surgery Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Surgery Schedules
  getSurgeries,
  getSurgeryById,
  createSurgery,
  updateSurgery,
  deleteSurgery,
  getTodaySurgeries,
  getUpcomingSurgeries,
  getCompletedSurgeries,
  getSurgeriesBySurgeon,
  getSurgeriesByPatient,
  
  // Surgery Types
  getSurgeryTypes,
  getSurgeryTypeById,
  createSurgeryType,
  updateSurgeryType,
  deleteSurgeryType,
  
  // Operating Theatres
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getTheatreAvailability,
  bookTheatre,
  releaseTheatre,
  
  // Surgery Teams
  getSurgeryTeams,
  getSurgeryTeamById,
  createSurgeryTeam,
  updateSurgeryTeam,
  deleteSurgeryTeam,
  assignTeamToSurgery,
  
  // Surgery Notes
  getSurgeryNotes,
  getSurgeryNoteById,
  createSurgeryNote,
  updateSurgeryNote,
  deleteSurgeryNote,
  
  // Pre-op & Post-op
  getPreOpAssessment,
  createPreOpAssessment,
  updatePreOpAssessment,
  getPostOpCare,
  createPostOpCare,
  updatePostOpCare,
  
  // Surgery Reports
  getReports,
  generateReport,
  getSurgerySummary,
  
  // Stats
  getSurgeryStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/surgery.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const surgeryIdValidation = [
  param('id').isMongoId().withMessage('Invalid surgery ID'),
];

const createSurgeryValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('surgeryType').notEmpty().withMessage('Surgery type is required'),
  body('surgeonId').isMongoId().withMessage('Invalid surgeon ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
  body('theatreId').isMongoId().withMessage('Invalid theatre ID'),
  body('priority').isIn(['Elective', 'Urgent', 'Emergency']).withMessage('Invalid priority'),
];

const updateSurgeryValidation = [
  body('status').optional().isIn(['Scheduled', 'Pre-Op', 'In Progress', 'Recovery', 'Completed', 'Cancelled', 'Postponed']),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('time').optional().notEmpty().withMessage('Time is required'),
];

const surgeryTypeValidation = [
  body('name').notEmpty().withMessage('Surgery type name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('estimatedDuration').isNumeric().withMessage('Estimated duration must be a number'),
];

const theatreValidation = [
  body('name').notEmpty().withMessage('Theatre name is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
];

const teamValidation = [
  body('name').notEmpty().withMessage('Team name is required'),
  body('members').isArray().withMessage('Members must be an array'),
];

const notesValidation = [
  body('surgeryId').isMongoId().withMessage('Invalid surgery ID'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['Pre-Op', 'Intra-Op', 'Post-Op']).withMessage('Invalid note type'),
];

const assessmentValidation = [
  body('surgeryId').isMongoId().withMessage('Invalid surgery ID'),
  body('findings').notEmpty().withMessage('Findings are required'),
  body('recommendations').optional().isString(),
];

// All routes require authentication
router.use(authenticate);

// Surgery Schedules
router.get('/', authorize('admin', 'doctor', 'nurse'), getSurgeries);
router.get('/today', authorize('admin', 'doctor', 'nurse'), getTodaySurgeries);
router.get('/upcoming', authorize('admin', 'doctor', 'nurse'), getUpcomingSurgeries);
router.get('/completed', authorize('admin', 'doctor', 'nurse'), getCompletedSurgeries);
router.get('/surgeon/:surgeonId', authorize('admin', 'doctor', 'nurse'), getSurgeriesBySurgeon);
router.get('/patient/:patientId', authorize('admin', 'doctor', 'nurse', 'patient'), getSurgeriesByPatient);
router.post('/', authorize('admin', 'doctor'), createSurgeryValidation, createSurgery);
router.get('/:id', authorize('admin', 'doctor', 'nurse', 'patient'), surgeryIdValidation, getSurgeryById);
router.put('/:id', authorize('admin', 'doctor'), surgeryIdValidation, updateSurgeryValidation, updateSurgery);
router.delete('/:id', authorize('admin'), surgeryIdValidation, deleteSurgery);

// Surgery Types
router.get('/types', authorize('admin', 'doctor', 'nurse'), getSurgeryTypes);
router.post('/types', authorize('admin'), surgeryTypeValidation, createSurgeryType);
router.get('/types/:id', authorize('admin', 'doctor', 'nurse'), getSurgeryTypeById);
router.put('/types/:id', authorize('admin'), surgeryTypeValidation, updateSurgeryType);
router.delete('/types/:id', authorize('admin'), deleteSurgeryType);

// Operating Theatres
router.get('/theatres', authorize('admin', 'doctor', 'nurse'), getTheatres);
router.get('/theatres/availability', authorize('admin', 'doctor', 'nurse'), getTheatreAvailability);
router.post('/theatres', authorize('admin'), theatreValidation, createTheatre);
router.get('/theatres/:id', authorize('admin', 'doctor', 'nurse'), getTheatreById);
router.put('/theatres/:id', authorize('admin'), theatreValidation, updateTheatre);
router.delete('/theatres/:id', authorize('admin'), deleteTheatre);
router.post('/theatres/:id/book', authorize('admin', 'doctor'), bookTheatre);
router.patch('/theatres/:id/release', authorize('admin', 'doctor'), releaseTheatre);

// Surgery Teams
router.get('/teams', authorize('admin', 'doctor', 'nurse'), getSurgeryTeams);
router.post('/teams', authorize('admin'), teamValidation, createSurgeryTeam);
router.get('/teams/:id', authorize('admin', 'doctor', 'nurse'), getSurgeryTeamById);
router.put('/teams/:id', authorize('admin'), teamValidation, updateSurgeryTeam);
router.delete('/teams/:id', authorize('admin'), deleteSurgeryTeam);
router.post('/teams/:id/assign', authorize('admin', 'doctor'), assignTeamToSurgery);

// Surgery Notes
router.get('/notes', authorize('admin', 'doctor', 'nurse'), getSurgeryNotes);
router.post('/notes', authorize('admin', 'doctor', 'nurse'), notesValidation, createSurgeryNote);
router.get('/notes/:id', authorize('admin', 'doctor', 'nurse'), getSurgeryNoteById);
router.put('/notes/:id', authorize('admin', 'doctor', 'nurse'), notesValidation, updateSurgeryNote);
router.delete('/notes/:id', authorize('admin'), deleteSurgeryNote);

// Pre-op & Post-op
router.get('/pre-op/:surgeryId', authorize('admin', 'doctor', 'nurse'), getPreOpAssessment);
router.post('/pre-op', authorize('admin', 'doctor', 'nurse'), assessmentValidation, createPreOpAssessment);
router.put('/pre-op/:id', authorize('admin', 'doctor', 'nurse'), assessmentValidation, updatePreOpAssessment);
router.get('/post-op/:surgeryId', authorize('admin', 'doctor', 'nurse'), getPostOpCare);
router.post('/post-op', authorize('admin', 'doctor', 'nurse'), createPostOpCare);
router.put('/post-op/:id', authorize('admin', 'doctor', 'nurse'), updatePostOpCare);

// Reports
router.get('/reports', authorize('admin', 'doctor'), getReports);
router.post('/reports/generate', authorize('admin', 'doctor'), generateReport);
router.get('/:id/summary', authorize('admin', 'doctor', 'nurse', 'patient'), surgeryIdValidation, getSurgerySummary);

// Stats
router.get('/stats', authorize('admin', 'doctor'), getSurgeryStats);
router.get('/stats/daily', authorize('admin', 'doctor'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'doctor'), getMonthlyStats);

module.exports = router;
