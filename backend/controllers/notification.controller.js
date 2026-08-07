/**
 * ============================================
 * NOTIFICATION.CONTROLLER.JS - Notification Controller
 * ============================================
 */

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationChannel = require('../models/NotificationChannel');
const NotificationTemplate = require('../models/NotificationTemplate');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification, sendPushNotification } = require('../config/socket');
const { sendEmail } = require('../config/email');
const { smsService } = require('../config/sms');

/**
 * Get all notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { user: req.user._id };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

/**
 * Get notification by ID
 */
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Get notification by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification',
      error: error.message
    });
  }
};

/**
 * Create notification
 */
const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      userId,
      title,
      message,
      type,
      priority,
      data,
      channel
    } = req.body;

    const notification = new Notification({
      user: userId,
      title,
      message,
      type: type || 'Info',
      priority: priority || 'Normal',
      data: data || {},
      channel: channel || 'InApp',
      isRead: false
    });

    await notification.save();

    // Send via socket if in-app
    if (channel === 'InApp' || !channel) {
      sendNotification(`user:${userId}`, {
        type: 'NEW_NOTIFICATION',
        notificationId: notification._id,
        title,
        message,
        priority
      });
    }

    // Send via email if enabled
    try {
      const preferences = await NotificationPreference.findOne({ user: userId });
      if (preferences?.channels?.email) {
        await sendEmail({
          to: preferences.email || (await User.findById(userId)).email,
          subject: title,
          template: 'notification',
          templateData: {
            title,
            message,
            type
          }
        });
      }
    } catch (emailError) {
      logger.error('Notification email error:', emailError);
    }

    // Send via SMS if enabled
    try {
      const preferences = await NotificationPreference.findOne({ user: userId });
      if (preferences?.channels?.sms) {
        const user = await User.findById(userId);
        await smsService.send(user.phone, `${title}: ${message}`);
      }
    } catch (smsError) {
      logger.error('Notification SMS error:', smsError);
    }

    logger.info(`Notification created for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

/**
 * Update notification
 */
const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { title, message, priority, isRead } = req.body;

    if (title) notification.title = title;
    if (message) notification.message = message;
    if (priority) notification.priority = priority;
    if (isRead !== undefined) notification.isRead = isRead;

    if (isRead && !notification.readAt) {
      notification.readAt = new Date();
    }

    await notification.save();

    logger.info(`Notification updated: ${notification._id}`);

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await notification.remove();

    logger.info(`Notification deleted: ${notification._id}`);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notifications
 */
const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      isRead: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Get unread notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread notifications',
      error: error.message
    });
  }
};

/**
 * Get read notifications
 */
const getReadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      isRead: true
    }).sort({ readAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Get read notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get read notifications',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Mark notification as unread
 */
const markAsUnread = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.isRead = false;
    notification.readAt = null;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as unread'
    });
  } catch (error) {
    logger.error('Mark as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as unread',
      error: error.message
    });
  }
};

/**
 * Clear all notifications
 */
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id, isRead: true });

    res.status(200).json({
      success: true,
      message: 'All read notifications cleared'
    });
  } catch (error) {
    logger.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
};

/**
 * Get notification preferences
 */
const getNotificationPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({
      user: req.user._id
    });

    if (!preferences) {
      // Create default preferences
      preferences = new NotificationPreference({
        user: req.user._id,
        channels: {
          email: true,
          sms: false,
          push: true,
          inApp: true
        },
        categories: {
          appointment: true,
          billing: true,
          medical: true,
          system: true,
          marketing: false
        }
      });
      await preferences.save();
    }

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
};

/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({
      user: req.user._id
    });

    if (!preferences) {
      preferences = new NotificationPreference({
        user: req.user._id
      });
    }

    const { channels, categories, email, phone } = req.body;

    if (channels) preferences.channels = { ...preferences.channels, ...channels };
    if (categories) preferences.categories = { ...preferences.categories, ...categories };
    if (email) preferences.email = email;
    if (phone) preferences.phone = phone;

    await preferences.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * Reset notification preferences
 */
const resetNotificationPreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreference.findOne({
      user: req.user._id
    });

    if (preferences) {
      preferences.channels = {
        email: true,
        sms: false,
        push: true,
        inApp: true
      };
      preferences.categories = {
        appointment: true,
        billing: true,
        medical: true,
        system: true,
        marketing: false
      };
      await preferences.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences reset successfully'
    });
  } catch (error) {
    logger.error('Reset notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      error: error.message
    });
  }
};

/**
 * Get channels
 */
const getChannels = async (req, res) => {
  try {
    const channels = await NotificationChannel.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: channels
    });
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get channels',
      error: error.message
    });
  }
};

/**
 * Get channel by ID
 */
const getChannelById = async (req, res) => {
  try {
    const channel = await NotificationChannel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    res.status(200).json({
      success: true,
      data: channel
    });
  } catch (error) {
    logger.error('Get channel by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get channel',
      error: error.message
    });
  }
};

/**
 * Create channel
 */
const createChannel = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, type, config, isActive } = req.body;

    const channel = new NotificationChannel({
      name,
      type,
      config: config || {},
      isActive: isActive !== undefined ? isActive : true
    });

    await channel.save();

    logger.info(`Notification channel created: ${channel.name}`);

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: channel
    });
  } catch (error) {
    logger.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create channel',
      error: error.message
    });
  }
};

/**
 * Update channel
 */
const updateChannel = async (req, res) => {
  try {
    const channel = await NotificationChannel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    const { name, type, config, isActive } = req.body;

    if (name) channel.name = name;
    if (type) channel.type = type;
    if (config) channel.config = config;
    if (isActive !== undefined) channel.isActive = isActive;

    await channel.save();

    logger.info(`Notification channel updated: ${channel.name}`);

    res.status(200).json({
      success: true,
      message: 'Channel updated successfully',
      data: channel
    });
  } catch (error) {
    logger.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update channel',
      error: error.message
    });
  }
};

/**
 * Delete channel
 */
const deleteChannel = async (req, res) => {
  try {
    const channel = await NotificationChannel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    channel.isActive = false;
    await channel.save();

    logger.info(`Notification channel deactivated: ${channel.name}`);

    res.status(200).json({
      success: true,
      message: 'Channel deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate channel',
      error: error.message
    });
  }
};

/**
 * Get templates
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message
    });
  }
};

/**
 * Get template by ID
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
};

/**
 * Create template
 */
const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, subject, body, type, variables } = req.body;

    const template = new NotificationTemplate({
      name,
      subject,
      body,
      type: type || 'Email',
      variables: variables || [],
      isActive: true
    });

    await template.save();

    logger.info(`Notification template created: ${template.name}`);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * Update template
 */
const updateTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const { name, subject, body, type, variables, isActive } = req.body;

    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (body) template.body = body;
    if (type) template.type = type;
    if (variables) template.variables = variables;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    logger.info(`Notification template updated: ${template.name}`);

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

/**
 * Delete template
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    template.isActive = false;
    await template.save();

    logger.info(`Notification template deactivated: ${template.name}`);

    res.status(200).json({
      success: true,
      message: 'Template deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate template',
      error: error.message
    });
  }
};

/**
 * Send notification (Admin only)
 */
const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority, channel } = req.body;

    const notification = await createNotification({
      userId,
      title,
      message,
      type,
      priority,
      channel
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * Send bulk notifications (Admin only)
 */
const sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type, priority, channel } = req.body;

    const results = [];
    for (const userId of userIds) {
      try {
        const notification = await createNotification({
          userId,
          title,
          message,
          type,
          priority,
          channel
        });
        results.push({ userId, success: true, notificationId: notification._id });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk notifications sent to ${results.filter(r => r.success).length} users`,
      data: results
    });
  } catch (error) {
    logger.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
};

/**
 * Schedule notification (Admin only)
 */
const scheduleNotification = async (req, res) => {
  try {
    const { userId, title, message, scheduledDate, type, priority, channel } = req.body;

    // Placeholder - would create scheduled notification
    res.status(200).json({
      success: true,
      message: 'Notification scheduled successfully',
      data: {
        userId,
        title,
        message,
        scheduledDate: new Date(scheduledDate)
      }
    });
  } catch (error) {
    logger.error('Schedule notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule notification',
      error: error.message
    });
  }
};

/**
 * Cancel scheduled notification (Admin only)
 */
const cancelScheduled = async (req, res) => {
  try {
    // Placeholder - would cancel scheduled notification
    res.status(200).json({
      success: true,
      message: 'Scheduled notification cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel scheduled notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled notification',
      error: error.message
    });
  }
};

/**
 * Register push token
 */
const registerPushToken = async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;

    // Placeholder - would store push token
    res.status(200).json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    logger.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register push token',
      error: error.message
    });
  }
};

/**
 * Unregister push token
 */
const unregisterPushToken = async (req, res) => {
  try {
    const { token } = req.body;

    // Placeholder - would remove push token
    res.status(200).json({
      success: true,
      message: 'Push token unregistered successfully'
    });
  } catch (error) {
    logger.error('Unregister push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister push token',
      error: error.message
    });
  }
};

/**
 * Send push notification (Admin only)
 */
const sendPushNotification = async (req, res) => {
  try {
    const { userId, title, message, data } = req.body;

    // Placeholder - would send push notification
    res.status(200).json({
      success: true,
      message: 'Push notification sent successfully'
    });
  } catch (error) {
    logger.error('Send push notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send push notification',
      error: error.message
    });
  }
};

/**
 * Get notification stats
 */
const getNotificationStats = async (req, res) => {
  try {
    const [
      total,
      unread,
      read,
      appointment,
      billing,
      medical,
      system
    ] = await Promise.all([
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
      Notification.countDocuments({ user: req.user._id, isRead: true }),
      Notification.countDocuments({ user: req.user._id, type: 'Appointment' }),
      Notification.countDocuments({ user: req.user._id, type: 'Billing' }),
      Notification.countDocuments({ user: req.user._id, type: 'Medical' }),
      Notification.countDocuments({ user: req.user._id, type: 'System' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        unread,
        read,
        appointment,
        billing,
        medical,
        system
      }
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [sentToday, readToday] = await Promise.all([
      Notification.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        user: req.user._id
      }),
      Notification.countDocuments({
        readAt: { $gte: today, $lt: tomorrow },
        user: req.user._id
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        sentToday,
        readToday
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [sentMonth, readMonth] = await Promise.all([
      Notification.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        user: req.user._id
      }),
      Notification.countDocuments({
        readAt: { $gte: startOfMonth, $lt: endOfMonth },
        user: req.user._id
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        sentMonth,
        readMonth
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate notification reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
};

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getUserNotifications,
  getUnreadNotifications,
  getReadNotifications,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  clearAll,
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendNotification,
  sendBulkNotifications,
  scheduleNotification,
  cancelScheduled,
  registerPushToken,
  unregisterPushToken,
  sendPushNotification,
  getNotificationStats,
  getDailyStats,
  getMonthlyStats,
  getReports,
  generateReport
};
