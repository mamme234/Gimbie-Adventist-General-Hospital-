/**
 * ============================================
 * NOTIFICATION.ROUTES.JS - Notification Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Notifications
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  getUnreadNotifications,
  getReadNotifications,
  
  // Notification Management
  markAsRead,
  markAllAsRead,
  markAsUnread,
  clearAll,
  
  // Notification Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  
  // Notification Channels
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  
  // Notification Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  
  // Notification Delivery
  sendNotification,
  sendBulkNotifications,
  scheduleNotification,
  cancelScheduled,
  
  // Push Notifications
  registerPushToken,
  unregisterPushToken,
  sendPushNotification,
  
  // Notification Reports
  getReports,
  generateReport,
  
  // Stats
  getNotificationStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const notificationIdValidation = [
  param('id').isMongoId().withMessage('Invalid notification ID'),
];

const createNotificationValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['Info', 'Warning', 'Success', 'Error', 'Appointment', 'Billing', 'Medical']).withMessage('Invalid notification type'),
  body('priority').isIn(['Low', 'Normal', 'High', 'Critical']).withMessage('Invalid priority'),
];

const updateNotificationValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('message').optional().notEmpty().withMessage('Message cannot be empty'),
  body('isRead').optional().isBoolean(),
];

const preferenceValidation = [
  body('email').isBoolean().withMessage('Email must be a boolean'),
  body('sms').isBoolean().withMessage('SMS must be a boolean'),
  body('push').isBoolean().withMessage('Push must be a boolean'),
  body('inApp').isBoolean().withMessage('In-app must be a boolean'),
];

const channelValidation = [
  body('name').notEmpty().withMessage('Channel name is required'),
  body('type').isIn(['Email', 'SMS', 'Push', 'InApp']).withMessage('Invalid channel type'),
  body('config').isObject().withMessage('Config must be an object'),
];

const templateValidation = [
  body('name').notEmpty().withMessage('Template name is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('body').notEmpty().withMessage('Body is required'),
  body('type').isIn(['Email', 'SMS', 'Push', 'InApp']).withMessage('Invalid template type'),
];

const scheduleValidation = [
  body('notificationId').isMongoId().withMessage('Invalid notification ID'),
  body('scheduledDate').isISO8601().withMessage('Invalid scheduled date'),
  body('recurring').optional().isObject(),
];

const pushTokenValidation = [
  body('token').notEmpty().withMessage('Push token is required'),
  body('platform').isIn(['iOS', 'Android', 'Web']).withMessage('Invalid platform'),
  body('deviceId').optional().isString(),
];

// All routes require authentication
router.use(authenticate);

// Notifications
router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/read', getReadNotifications);
router.get('/user/:userId', getUserNotifications);
router.post('/', createNotificationValidation, createNotification);
router.get('/:id', notificationIdValidation, getNotificationById);
router.put('/:id', notificationIdValidation, updateNotificationValidation, updateNotification);
router.delete('/:id', notificationIdValidation, deleteNotification);

// Notification Management
router.patch('/:id/read', notificationIdValidation, markAsRead);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/unread', notificationIdValidation, markAsUnread);
router.delete('/clear', clearAll);

// Notification Preferences
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', preferenceValidation, updateNotificationPreferences);
router.post('/preferences/reset', resetNotificationPreferences);

// Notification Channels
router.get('/channels', authorize('admin'), getChannels);
router.post('/channels', authorize('admin'), channelValidation, createChannel);
router.get('/channels/:id', authorize('admin'), getChannelById);
router.put('/channels/:id', authorize('admin'), channelValidation, updateChannel);
router.delete('/channels/:id', authorize('admin'), deleteChannel);

// Notification Templates
router.get('/templates', authorize('admin'), getTemplates);
router.post('/templates', authorize('admin'), templateValidation, createTemplate);
router.get('/templates/:id', authorize('admin'), getTemplateById);
router.put('/templates/:id', authorize('admin'), templateValidation, updateTemplate);
router.delete('/templates/:id', authorize('admin'), deleteTemplate);

// Notification Delivery
router.post('/send', authorize('admin'), sendNotification);
router.post('/send/bulk', authorize('admin'), sendBulkNotifications);
router.post('/schedule', authorize('admin'), scheduleValidation, scheduleNotification);
router.delete('/schedule/:id', authorize('admin'), cancelScheduled);

// Push Notifications
router.post('/push/register', registerPushToken);
router.post('/push/unregister', unregisterPushToken);
router.post('/push/send', authorize('admin'), sendPushNotification);

// Reports
router.get('/reports', authorize('admin'), getReports);
router.post('/reports/generate', authorize('admin'), generateReport);

// Stats
router.get('/stats', getNotificationStats);
router.get('/stats/daily', getDailyStats);
router.get('/stats/monthly', getMonthlyStats);

module.exports = router;
