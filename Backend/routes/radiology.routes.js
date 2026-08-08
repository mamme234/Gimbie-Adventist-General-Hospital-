/**
 * ============================================
 * RADIOLOGY.ROUTES.JS - Radiology Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Imaging Orders
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getPatientOrders,
  getPendingOrders,
  getCompletedOrders,
  
  // Imaging Studies
  getStudies,
  getStudyById,
  createStudy,
  updateStudy,
  deleteStudy,
  getStudyImages,
  uploadStudyImages,
  deleteStudyImage,
  
  // Reports
  getReports,
  getReportById,
  createReport,
  updateReport,
  releaseReport,
  
  // Equipment
  getEquipment,
  getEquipmentById,
  updateEquipmentStatus,
  scheduleMaintenance,
  getEquipmentMaintenance,
  
  // Appointments
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  
  // Stats
  getRadiologyStats,
  getDailyStats,
  getMonthlyStats,
  
  // Images
  getImages,
  getImageById,
  deleteImage,
  getImageThumbnail,
} = require('../controllers/radiology.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const orderIdValidation = [
  param('id').isMongoId().withMessage('Invalid order ID'),
];

const studyIdValidation = [
  param('id').isMongoId().withMessage('Invalid study ID'),
];

const createOrderValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('studyType').notEmpty().withMessage('Study type is required'),
  body('priority').isIn(['Routine', 'Urgent', 'STAT']).withMessage('Invalid priority'),
  body('bodyRegion').notEmpty().withMessage('Body region is required'),
];

const updateOrderValidation = [
  body('status').optional().isIn(['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled']),
  body('priority').optional().isIn(['Routine', 'Urgent', 'STAT']),
];

const createStudyValidation = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('modality').isIn(['X-Ray', 'CT', 'MRI', 'Ultrasound', 'Echocardiogram', 'Mammogram', 'PET', 'SPECT']).withMessage('Invalid modality'),
  body('bodyRegion').notEmpty().withMessage('Body region is required'),
  body('technique').optional().isString(),
  body('findings').optional().isString(),
  body('impression').optional().isString(),
];

const updateStudyValidation = [
  body('findings').optional().isString(),
  body('impression').optional().isString(),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Reviewed', 'Reported']),
];

const reportValidation = [
  body('studyId').isMongoId().withMessage('Invalid study ID'),
  body('findings').notEmpty().withMessage('Findings are required'),
  body('impression').notEmpty().withMessage('Impression is required'),
  body('recommendations').optional().isString(),
];

const appointmentValidation = [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('studyType').notEmpty().withMessage('Study type is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').notEmpty().withMessage('Time is required'),
];

const equipmentValidation = [
  body('status').isIn(['Available', 'In Use', 'Maintenance', 'Out of Service']).withMessage('Invalid status'),
];

const maintenanceValidation = [
  body('type').notEmpty().withMessage('Maintenance type is required'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('notes').optional().isString(),
];

// All routes require authentication
router.use(authenticate);

// Orders
router.get('/orders', authorize('admin', 'radiologist', 'doctor', 'patient'), getOrders);
router.get('/orders/pending', authorize('admin', 'radiologist', 'doctor'), getPendingOrders);
router.get('/orders/completed', authorize('admin', 'radiologist', 'doctor'), getCompletedOrders);
router.get('/orders/patient/:patientId', authorize('admin', 'radiologist', 'doctor', 'patient'), getPatientOrders);
router.post('/orders', authorize('admin', 'doctor'), createOrderValidation, createOrder);
router.get('/orders/:id', authorize('admin', 'radiologist', 'doctor', 'patient'), orderIdValidation, getOrderById);
router.put('/orders/:id', authorize('admin', 'radiologist'), orderIdValidation, updateOrderValidation, updateOrder);
router.delete('/orders/:id', authorize('admin'), orderIdValidation, deleteOrder);

// Studies
router.get('/studies', authorize('admin', 'radiologist', 'doctor', 'patient'), getStudies);
router.get('/studies/:id', authorize('admin', 'radiologist', 'doctor', 'patient'), studyIdValidation, getStudyById);
router.post('/studies', authorize('admin', 'radiologist'), createStudyValidation, createStudy);
router.put('/studies/:id', authorize('admin', 'radiologist'), studyIdValidation, updateStudyValidation, updateStudy);
router.delete('/studies/:id', authorize('admin'), studyIdValidation, deleteStudy);

// Study Images
router.get('/studies/:id/images', authorize('admin', 'radiologist', 'doctor', 'patient'), studyIdValidation, getStudyImages);
router.post('/studies/:id/images', authorize('admin', 'radiologist'), studyIdValidation, multerConfig.radiology.array('images', 20), handleMulterError, uploadStudyImages);
router.delete('/studies/:id/images/:imageId', authorize('admin', 'radiologist'), deleteStudyImage);

// Reports
router.get('/reports', authorize('admin', 'radiologist', 'doctor', 'patient'), getReports);
router.get('/reports/:id', authorize('admin', 'radiologist', 'doctor', 'patient'), getReportById);
router.post('/reports', authorize('admin', 'radiologist'), reportValidation, createReport);
router.put('/reports/:id', authorize('admin', 'radiologist'), updateReport);
router.patch('/reports/:id/release', authorize('admin', 'radiologist'), releaseReport);

// Equipment
router.get('/equipment', authorize('admin', 'radiologist'), getEquipment);
router.get('/equipment/:id', authorize('admin', 'radiologist'), getEquipmentById);
router.patch('/equipment/:id/status', authorize('admin', 'radiologist'), equipmentValidation, updateEquipmentStatus);
router.post('/equipment/:id/maintenance', authorize('admin', 'radiologist'), maintenanceValidation, scheduleMaintenance);
router.get('/equipment/:id/maintenance', authorize('admin', 'radiologist'), getEquipmentMaintenance);

// Appointments
router.get('/appointments', authorize('admin', 'radiologist', 'doctor', 'patient'), getAppointments);
router.get('/appointments/available-slots', getAvailableSlots);
router.post('/appointments', authorize('admin', 'doctor', 'patient'), appointmentValidation, createAppointment);
router.get('/appointments/:id', authorize('admin', 'radiologist', 'doctor', 'patient'), getAppointmentById);
router.put('/appointments/:id', authorize('admin', 'radiologist'), updateAppointment);
router.patch('/appointments/:id/cancel', authorize('admin', 'radiologist', 'doctor', 'patient'), cancelAppointment);

// Stats
router.get('/stats', authorize('admin', 'radiologist'), getRadiologyStats);
router.get('/stats/daily', authorize('admin', 'radiologist'), getDailyStats);
router.get('/stats/monthly', authorize('admin', 'radiologist'), getMonthlyStats);

// Images (general)
router.get('/images', authorize('admin', 'radiologist', 'doctor'), getImages);
router.get('/images/:id', authorize('admin', 'radiologist', 'doctor'), getImageById);
router.delete('/images/:id', authorize('admin', 'radiologist'), deleteImage);
router.get('/images/:id/thumbnail', authorize('admin', 'radiologist', 'doctor'), getImageThumbnail);

module.exports = router;
