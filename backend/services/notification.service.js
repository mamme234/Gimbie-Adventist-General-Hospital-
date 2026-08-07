// services/notification.service.js
const { Notification } = require('../models/Notification');
const { Employee } = require('../models/Employee');
const { logger } = require('../middleware/logger');
const emailService = require('./email.service');
const smsService = require('./sms.service');
const { AuditLog } = require('../models/AuditLog');
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    this.initializeFirebase();
  }

  // Initialize Firebase for push notifications
  initializeFirebase() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        logger.info('Firebase initialized successfully');
      }
    } catch (error) {
      logger.error('Firebase initialization error:', error);
    }
  }

  // Send notification
  async sendNotification({
    userId,
    type,
    title,
    body,
    data = {},
    priority = 'low',
    channels = ['in-app'],
    icon,
    image,
    action,
    url
  }) {
    try {
      // Create notification
      const notification = new Notification({
        userId,
        type,
        title,
        body,
        data: {
          action,
          url,
          ...data
        },
        priority,
        channels,
        icon,
        image,
        createdAt: new Date()
      });

      await notification.save();

      // Send through channels
      const results = await this.deliverNotification(notification);

      return {
        success: true,
        notification,
        deliveryResults: results
      };
    } catch (error) {
      logger.error('Send notification error:', error);
      throw error;
    }
  }

  // Deliver notification through channels
  async deliverNotification(notification) {
    const results = [];
    const user = await Employee.findById(notification.userId);

    if (!user) {
      throw new Error('User not found');
    }

    for (const channel of notification.channels) {
      try {
        let result;
        switch (channel) {
          case 'in-app':
            result = await this.deliverInApp(notification);
            break;
          case 'push':
            result = await this.deliverPush(notification, user);
            break;
          case 'email':
            result = await this.deliverEmail(notification, user);
            break;
          case 'sms':
            result = await this.deliverSMS(notification, user);
            break;
        }
        results.push({ channel, success: true, result });
      } catch (error) {
        logger.error(`Delivery error for ${channel}:`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }

  // Deliver in-app notification
  async deliverInApp(notification) {
    // Save to database (already saved)
    return { delivered: true };
  }

  // Deliver push notification
  async deliverPush(notification, user) {
    if (!user.deviceTokens || user.deviceTokens.length === 0) {
      return { delivered: false, reason: 'No device tokens' };
    }

    try {
      const payload = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          sound: notification.priority === 'critical' ? 'emergency.wav' : 'default',
          badge: '1',
          click_action: notification.data.action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        data: {
          ...notification.data,
          notificationId: notification._id.toString(),
          type: notification.type,
          priority: notification.priority,
          timestamp: notification.createdAt.toISOString()
        },
        android: {
          priority: notification.priority === 'critical' ? 'high' : 'normal',
          ttl: 86400,
          notification: {
            channelId: notification.type,
            priority: notification.priority === 'critical' ? 'max' : 'default',
            sound: notification.priority === 'critical' ? 'emergency' : 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.priority === 'critical' ? 'emergency.wav' : 'default',
              badge: 1,
              contentAvailable: true
            }
          },
          headers: {
            'apns-priority': notification.priority === 'critical' ? '10' : '5'
          }
        }
      };

      // Send to all device tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens: user.deviceTokens,
        ...payload
      });

      // Update notification status
      notification.isDelivered = response.successCount > 0;
      notification.deliveredAt = new Date();
      await notification.save();

      return {
        delivered: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  // Deliver email notification
  async deliverEmail(notification, user) {
    if (!user.email) {
      return { delivered: false, reason: 'No email address' };
    }

    await emailService.sendNotificationEmail(user.email, {
      title: notification.title,
      body: notification.body,
      action: notification.data.action,
      url: notification.data.url
    });

    return { delivered: true };
  }

  // Deliver SMS notification
  async deliverSMS(notification, user) {
    if (!user.phone) {
      return { delivered: false, reason: 'No phone number' };
    }

    // Truncate message if too long (160 chars for standard SMS)
    let message = notification.body;
    if (message.length > 150) {
      message = message.substring(0, 147) + '...';
    }

    await smsService.sendSMS({
      to: user.phone,
      body: message
    });

    return { delivered: true };
  }

  // Send emergency alert
  async sendEmergencyAlert(emergencyId, message, recipients) {
    try {
      const alerts = [];

      // Send to all recipients
      for (const recipient of recipients) {
        const alert = await this.sendNotification({
          userId: recipient.userId,
          type: 'emergency_assignment',
          title: '🚨 EMERGENCY ALERT',
          body: message,
          priority: 'critical',
          channels: ['in-app', 'push', 'sms'],
          data: {
            emergencyId,
            timestamp: new Date().toISOString(),
            requiresAction: true
          },
          icon: 'emergency_icon'
        });
        alerts.push(alert);
      }

      // Log emergency alert
      await AuditLog.logAction({
        action: 'emergency_alert',
        resource: 'emergency',
        resourceId: emergencyId,
        details: {
          recipients: recipients.length,
          message
        },
        status: 'success',
        severity: 'critical'
      });

      return alerts;
    } catch (error) {
      logger.error('Send emergency alert error:', error);
      throw error;
    }
  }

  // Send shift reminder
  async sendShiftReminder(employeeId, shiftDetails) {
    return this.sendNotification({
      userId: employeeId,
      type: 'reminder',
      title: 'Shift Reminder',
      body: `Your shift starts at ${shiftDetails.startTime} today`,
      priority: 'medium',
      channels: ['in-app', 'push', 'email'],
      data: {
        shiftId: shiftDetails.id,
        action: 'view_shift'
      }
    });
  }

  // Send weekly report
  async sendWeeklyReport(employeeId, report) {
    return this.sendNotification({
      userId: employeeId,
      type: 'system',
      title: 'Weekly Report',
      body: `Your weekly performance report is ready: ${report.summary}`,
      priority: 'low',
      channels: ['in-app', 'email'],
      data: {
        reportId: report.id,
        action: 'view_report',
        url: report.url
      }
    });
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  // Mark all as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return {
      success: true,
      updated: result.modifiedCount
    };
  }

  // Get notifications
  async getNotifications(userId, filters = {}) {
    const query = { userId };

    if (filters.type) query.type = filters.type;
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.startDate) query.createdAt = { $gte: filters.startDate };
    if (filters.endDate) {
      query.createdAt = {
        ...query.createdAt,
        $lte: filters.endDate
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      unread: await Notification.countDocuments({ userId, isRead: false })
    };
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!result) {
      throw new Error('Notification not found');
    }

    return { success: true };
  }

  // Delete all notifications
  async deleteAllNotifications(userId) {
    await Notification.deleteMany({ userId });
    return { success: true };
  }

  // Register device token
  async registerDeviceToken(userId, token, deviceInfo) {
    const user = await Employee.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove duplicate token
    user.deviceTokens = user.deviceTokens.filter(t => t !== token);
    user.deviceTokens.push(token);
    
    // Update device info
    if (!user.devices) user.devices = [];
    user.devices.push({
      token,
      ...deviceInfo,
      registeredAt: new Date()
    });

    await user.save();

    return { success: true };
  }

  // Unregister device token
  async unregisterDeviceToken(userId, token) {
    const user = await Employee.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.deviceTokens = user.deviceTokens.filter(t => t !== token);
    await user.save();

    return { success: true };
  }

  // Send bulk notifications
  async sendBulkNotifications(users, notificationData) {
    const results = [];
    const batchSize = 50;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const promises = batch.map(user =>
        this.sendNotification({
          userId: user._id,
          ...notificationData
        }).then(result => ({
          userId: user._id,
          success: true,
          ...result
        })).catch(error => ({
          userId: user._id,
          success: false,
          error: error.message
        }))
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      if (i + batchSize < users.length) {
        await this.sleep(1000);
      }
    }

    return {
      total: users.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationService();
