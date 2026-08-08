const Notification = require('../models/Notification');
const { generateNotificationId } = require('../utils/generateId');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const { read, type, page = 1, limit = 20 } = req.query;
        const query = { recipient: req.user.id };

        if (read !== undefined) query.read = read === 'true';
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        if (notification.recipient.toString() !== req.user.id && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this notification',
            });
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private
exports.sendNotification = async (req, res) => {
    try {
        const { recipient, title, message, type, priority, link, expiresAt } = req.body;

        const notification = await Notification.create({
            notificationId: generateNotificationId(),
            recipient,
            title,
            message,
            type,
            priority: priority || 'Medium',
            link,
            expiresAt,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this notification',
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        if (notification.recipient.toString() !== req.user.id && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this notification',
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            read: false,
        });

        res.status(200).json({
            success: true,
            data: { count },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
exports.getNotificationSettings = async (req, res) => {
    try {
        // Get user preferences
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user?.preferences?.notifications || {
                email: true,
                sms: false,
                push: true,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
exports.updateNotificationSettings = async (req, res) => {
    try {
        const { email, sms, push } = req.body;
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.preferences) user.preferences = {};
        if (!user.preferences.notifications) user.preferences.notifications = {};

        user.preferences.notifications = {
            email: email !== undefined ? email : true,
            sms: sms !== undefined ? sms : false,
            push: push !== undefined ? push : true,
        };

        await user.save();

        res.status(200).json({
            success: true,
            data: user.preferences.notifications,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
