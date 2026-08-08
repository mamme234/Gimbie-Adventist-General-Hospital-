/**
 * ============================================
 * APPOINTMENT.ROUTES.JS - Appointment Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  getDoctorAppointments,
  getPatientAppointments,
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentStats,
  sendAppointmentReminder,
  checkInAppointment,
  startAppointment,
  getAppointmentHistory,
} = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const appointmentIdValidation = [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
];

const createAppointmentValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
  body('type').isIn(['In-Person', 'Telemedicine', 'Phone Consultation']).withMessage('Invalid appointment type'),
];

const updateAppointmentValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('time').optional().notEmpty().withMessage('Time is required'),
  body('status').optional().isIn(['Pending', 'Confirmed', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No-Show']),
];

const rescheduleValidation = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
];

const slotsValidation = [
  query('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  query('date').isISO8601().withMessage('Invalid date format'),
];

// All routes require authentication
router.use(authenticate);

// Appointment operations
router.get('/', getAppointments);
router.get('/available-slots', slotsValidation, getAvailableSlots);
router.post('/', createAppointmentValidation, createAppointment);
router.get('/:id', appointmentIdValidation, getAppointmentById);
router.put('/:id', appointmentIdValidation, updateAppointmentValidation, updateAppointment);
router.patch('/:id/cancel', appointmentIdValidation, cancelAppointment);
router.patch('/:id/complete', appointmentIdValidation, completeAppointment);
router.patch('/:id/reschedule', appointmentIdValidation, rescheduleValidation, rescheduleAppointment);
router.patch('/:id/check-in', appointmentIdValidation, checkInAppointment);
router.patch('/:id/start', appointmentIdValidation, startAppointment);

// Doctor appointments
router.get('/doctor/:doctorId', getDoctorAppointments);

// Patient appointments
router.get('/patient/:patientId', getPatientAppointments);

// Today's appointments
router.get('/today', getTodayAppointments);

// Upcoming appointments
router.get('/upcoming', getUpcomingAppointments);

// Appointment stats
router.get('/stats', getAppointmentStats);

// Appointment history
router.get('/history/:patientId', getAppointmentHistory);

// Send reminder
router.post('/:id/reminder', appointmentIdValidation, sendAppointmentReminder);

module.exports = router;
