const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getNotifications,
    getNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    sendNotification,
    getNotificationSettings,
    updateNotificationSettings,
} = require('../controllers/notificationController');

// Protected routes
router.use(protect);

// Notification routes
router.route('/')
    .get(getNotifications)
    .post(sendNotification);

router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

router.route('/:id')
    .get(getNotification)
    .put(markAsRead)
    .delete(deleteNotification);

module.exports = router;
