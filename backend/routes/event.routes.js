/**
 * ============================================
 * EVENT.ROUTES.JS - Event Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Events
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getOngoingEvents,
  getPastEvents,
  getFeaturedEvents,
  getEventsByCategory,
  getEventsByDate,
  searchEvents,
  
  // Event Categories
  getEventCategories,
  getEventCategoryById,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
  
  // Event Registration
  getRegistrations,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  getEventRegistrations,
  getUserRegistrations,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  
  // Event Speakers
  getSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getEventSpeakers,
  
  // Event Agenda
  getAgenda,
  getAgendaItemById,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  getEventAgenda,
  
  // Event Sponsors
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getEventSponsors,
  
  // Event Reports
  getEventReports,
  generateEventReport,
  
  // Event Stats
  getEventStats,
  getDailyStats,
  getMonthlyStats,
  
  // Event Feedback
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getEventFeedback,
  
  // Event Notifications
  sendEventNotification,
  sendReminder,
} = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const eventIdValidation = [
  param('id').isMongoId().withMessage('Invalid event ID'),
];

const createEventValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('location').notEmpty().withMessage('Location is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('speakers').optional().isArray(),
  body('sponsors').optional().isArray(),
  body('agenda').optional().isArray(),
  body('featuredImage').optional().isString(),
];

const updateEventValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('status').optional().isIn(['Draft', 'Published', 'Cancelled', 'Completed']).withMessage('Invalid status'),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('description').optional().isString(),
];

const registrationValidation = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('attendeeType').isIn(['General', 'VIP', 'Speaker', 'Media', 'Staff']).withMessage('Invalid attendee type'),
];

const speakerValidation = [
  body('name').notEmpty().withMessage('Speaker name is required'),
  body('bio').optional().isString(),
  body('photo').optional().isString(),
  body('organization').optional().isString(),
  body('title').optional().isString(),
];

const agendaItemValidation = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('time').notEmpty().withMessage('Time is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('speakerId').optional().isMongoId().withMessage('Invalid speaker ID'),
];

const sponsorValidation = [
  body('name').notEmpty().withMessage('Sponsor name is required'),
  body('logo').optional().isString(),
  body('website').optional().isURL().withMessage('Invalid URL'),
  body('level').isIn(['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner']).withMessage('Invalid sponsor level'),
];

const feedbackValidation = [
  body('eventId').isMongoId().withMessage('Invalid event ID'),
  body('rating').isNumeric().withMessage('Rating must be a number'),
  body('review').optional().isString(),
  body('recommendations').optional().isString(),
];

// Public routes (no auth required)
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/ongoing', getOngoingEvents);
router.get('/past', getPastEvents);
router.get('/featured', getFeaturedEvents);
router.get('/category/:category', getEventsByCategory);
router.get('/date', getEventsByDate);
router.get('/search', searchEvents);
router.get('/:id', eventIdValidation, getEventById);

// Public registration (no auth required)
router.post('/:id/register', eventIdValidation, registrationValidation, createRegistration);

// Authenticated routes
router.use(authenticate);

// Event Categories (Protected)
router.get('/categories', getEventCategories);
router.post('/categories', authorize('admin'), categoryValidation, createEventCategory);
router.get('/categories/:id', getEventCategoryById);
router.put('/categories/:id', authorize('admin'), categoryValidation, updateEventCategory);
router.delete('/categories/:id', authorize('admin'), deleteEventCategory);

// Events (Protected)
router.post('/', authorize('admin', 'staff'), createEventValidation, createEvent);
router.put('/:id', authorize('admin', 'staff'), eventIdValidation, updateEventValidation, updateEvent);
router.delete('/:id', authorize('admin'), eventIdValidation, deleteEvent);

// Registrations (Protected)
router.get('/registrations', authorize('admin', 'staff'), getRegistrations);
router.get('/registrations/event/:eventId', authorize('admin', 'staff'), getEventRegistrations);
router.get('/registrations/user', getUserRegistrations);
router.get('/registrations/:id', authorize('admin', 'staff'), getRegistrationById);
router.put('/registrations/:id', authorize('admin', 'staff'), updateRegistration);
router.delete('/registrations/:id', authorize('admin'), deleteRegistration);
router.post('/registrations/:id/approve', authorize('admin', 'staff'), approveRegistration);
router.post('/registrations/:id/reject', authorize('admin', 'staff'), rejectRegistration);
router.post('/registrations/:id/cancel', authorize('admin', 'staff'), cancelRegistration);

// Speakers (Protected)
router.get('/speakers', getSpeakers);
router.post('/speakers', authorize('admin', 'staff'), speakerValidation, createSpeaker);
router.get('/speakers/:id', getSpeakerById);
router.put('/speakers/:id', authorize('admin', 'staff'), speakerValidation, updateSpeaker);
router.delete('/speakers/:id', authorize('admin'), deleteSpeaker);
router.get('/speakers/event/:eventId', getEventSpeakers);

// Agenda (Protected)
router.get('/agenda', getAgenda);
router.post('/agenda', authorize('admin', 'staff'), agendaItemValidation, createAgendaItem);
router.get('/agenda/:id', getAgendaItemById);
router.put('/agenda/:id', authorize('admin', 'staff'), agendaItemValidation, updateAgendaItem);
router.delete('/agenda/:id', authorize('admin'), deleteAgendaItem);
router.get('/agenda/event/:eventId', getEventAgenda);

// Sponsors (Protected)
router.get('/sponsors', getSponsors);
router.post('/sponsors', authorize('admin'), sponsorValidation, createSponsor);
router.get('/sponsors/:id', getSponsorById);
router.put('/sponsors/:id', authorize('admin'), sponsorValidation, updateSponsor);
router.delete('/sponsors/:id', authorize('admin'), deleteSponsor);
router.get('/sponsors/event/:eventId', getEventSponsors);

// Feedback (Protected)
router.get('/feedback', getFeedback);
router.post('/feedback', feedbackValidation, createFeedback);
router.get('/feedback/:id', getFeedbackById);
router.put('/feedback/:id', feedbackValidation, updateFeedback);
router.delete('/feedback/:id', deleteFeedback);
router.get('/feedback/event/:eventId', getEventFeedback);

// Event Reports (Protected)
router.get('/reports', authorize('admin'), getEventReports);
router.post('/reports/generate', authorize('admin'), generateEventReport);

// Event Stats (Protected)
router.get('/stats', authorize('admin'), getEventStats);
router.get('/stats/daily', authorize('admin'), getDailyStats);
router.get('/stats/monthly', authorize('admin'), getMonthlyStats);

// Event Notifications (Protected)
router.post('/:id/notify', authorize('admin', 'staff'), eventIdValidation, sendEventNotification);
router.post('/:id/reminder', authorize('admin', 'staff'), eventIdValidation, sendReminder);

// File uploads for events
router.post('/upload', authorize('admin', 'staff'), multerConfig.general.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    url: `/uploads/general/${req.file.filename}`,
    file: req.file,
  });
});

module.exports = router;
