// sockets/notification.socket.js
const { logger } = require('../utils/logger');
const { Notification } = require('../models/Notification');
const notificationService = require('../services/notification.service');

class NotificationSocketHandler {
  constructor() {
    this.socketServer = null;
    this.socket = null;
    this.userId = null;
  }

  // Initialize notification socket handler
  init(socketServer, socket) {
    this.socketServer = socketServer;
    this.socket = socket;
    this.userId = socket.userId;

    // Register event handlers
    this.registerEvents();

    // Send initial unread count
    this.sendUnreadCount();
  }

  // Register notification events
  registerEvents() {
    const socket = this.socket;

    // Get notifications
    socket.on('notification:get', this.handleGetNotifications.bind(this));

    // Mark as read
    socket.on('notification:read', this.handleMarkAsRead.bind(this));

    // Mark all as read
    socket.on('notification:read-all', this.handleMarkAllAsRead.bind(this));

    // Delete notification
    socket.on('notification:delete', this.handleDeleteNotification.bind(this));

    // Delete all
    socket.on('notification:delete-all', this.handleDeleteAll.bind(this));

    // Register device token
    socket.on('notification:register-token', this.handleRegisterToken.bind(this));

    // Unregister device token
    socket.on('notification:unregister-token', this.handleUnregisterToken.bind(this));

    // Get settings
    socket.on('notification:settings', this.handleGetSettings.bind(this));

    // Update settings
    socket.on('notification:update-settings', this.handleUpdateSettings.bind(this));
  }

  // Handle get notifications
  async handleGetNotifications(data) {
    try {
      const { type, isRead, page, limit } = data || {};

      const result = await notificationService.getNotifications(
        this.userId,
        {
          type,
          isRead,
          page: page || 1,
          limit: limit || 20
        }
      );

      this.socket.emit('notification:list', result);
    } catch (error) {
      logger.error('Get notifications error:', error);
      this.socket.emit('notification:error', {
        code: 'GET_ERROR',
        message: error.message || 'Failed to get notifications'
      });
    }
  }

  // Handle mark as read
  async handleMarkAsRead(data) {
    try {
      const { notificationId } = data;

      if (!notificationId) {
        return this.socket.emit('notification:error', {
          code: 'MISSING_ID',
          message: 'Notification ID is required'
        });
      }

      await notificationService.markAsRead(notificationId, this.userId);

      // Emit update
      this.socket.emit('notification:read', {
        notificationId,
        timestamp: new Date()
      });

      // Update unread count
      await this.sendUnreadCount();

      logger.debug(`Notification ${notificationId} marked as read`);
    } catch (error) {
      logger.error('Mark as read error:', error);
      this.socket.emit('notification:error', {
        code: 'READ_ERROR',
        message: error.message || 'Failed to mark as read'
      });
    }
  }

  // Handle mark all as read
  async handleMarkAllAsRead() {
    try {
      await notificationService.markAllAsRead(this.userId);

      this.socket.emit('notification:read-all', {
        timestamp: new Date()
      });

      // Update unread count
      await this.sendUnreadCount();

      logger.debug(`All notifications marked as read for user ${this.userId}`);
    } catch (error) {
      logger.error('Mark all as read error:', error);
      this.socket.emit('notification:error', {
        code: 'READ_ALL_ERROR',
        message: error.message || 'Failed to mark all as read'
      });
    }
  }

  // Handle delete notification
  async handleDeleteNotification(data) {
    try {
      const { notificationId } = data;

      if (!notificationId) {
        return this.socket.emit('notification:error', {
          code: 'MISSING_ID',
          message: 'Notification ID is required'
        });
      }

      await notificationService.deleteNotification(notificationId, this.userId);

      this.socket.emit('notification:deleted', {
        notificationId,
        timestamp: new Date()
      });

      // Update unread count
      await this.sendUnreadCount();

      logger.debug(`Notification ${notificationId} deleted`);
    } catch (error) {
      logger.error('Delete notification error:', error);
      this.socket.emit('notification:error', {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete notification'
      });
    }
  }

  // Handle delete all
  async handleDeleteAll() {
    try {
      await notificationService.deleteAllNotifications(this.userId);

      this.socket.emit('notification:deleted-all', {
        timestamp: new Date()
      });

      // Update unread count
      await this.sendUnreadCount();

      logger.debug(`All notifications deleted for user ${this.userId}`);
    } catch (error) {
      logger.error('Delete all error:', error);
      this.socket.emit('notification:error', {
        code: 'DELETE_ALL_ERROR',
        message: error.message || 'Failed to delete all notifications'
      });
    }
  }

  // Handle register device token
  async handleRegisterToken(data) {
    try {
      const { token, platform, deviceInfo } = data;

      if (!token) {
        return this.socket.emit('notification:error', {
          code: 'MISSING_TOKEN',
          message: 'Device token is required'
        });
      }

      await notificationService.registerDeviceToken(
        this.userId,
        token,
        {
          platform,
          ...deviceInfo,
          socketId: this.socket.id
        }
      );

      this.socket.emit('notification:token-registered', {
        token,
        timestamp: new Date()
      });

      logger.info(`Device token registered for user ${this.userId}`);
    } catch (error) {
      logger.error('Register token error:', error);
      this.socket.emit('notification:error', {
        code: 'REGISTER_ERROR',
        message: error.message || 'Failed to register device token'
      });
    }
  }

  // Handle unregister device token
  async handleUnregisterToken(data) {
    try {
      const { token } = data;

      if (!token) {
        return this.socket.emit('notification:error', {
          code: 'MISSING_TOKEN',
          message: 'Device token is required'
        });
      }

      await notificationService.unregisterDeviceToken(this.userId, token);

      this.socket.emit('notification:token-unregistered', {
        token,
        timestamp: new Date()
      });

      logger.info(`Device token unregistered for user ${this.userId}`);
    } catch (error) {
      logger.error('Unregister token error:', error);
      this.socket.emit('notification:error', {
        code: 'UNREGISTER_ERROR',
        message: error.message || 'Failed to unregister device token'
      });
    }
  }

  // Handle get settings
  async handleGetSettings() {
    try {
      const settings = await this.getNotificationSettings();
      this.socket.emit('notification:settings', settings);
    } catch (error) {
      logger.error('Get settings error:', error);
      this.socket.emit('notification:error', {
        code: 'SETTINGS_ERROR',
        message: error.message || 'Failed to get notification settings'
      });
    }
  }

  // Handle update settings
  async handleUpdateSettings(data) {
    try {
      const settings = await this.updateNotificationSettings(this.userId, data);

      this.socket.emit('notification:settings-updated', {
        settings,
        timestamp: new Date()
      });

      logger.debug(`Notification settings updated for user ${this.userId}`);
    } catch (error) {
      logger.error('Update settings error:', error);
      this.socket.emit('notification:error', {
        code: 'UPDATE_SETTINGS_ERROR',
        message: error.message || 'Failed to update notification settings'
      });
    }
  }

  // Send unread count
  async sendUnreadCount() {
    try {
      const unreadCount = await Notification.countDocuments({
        userId: this.userId,
        isRead: false
      });

      this.socket.emit('notification:unread-count', {
        count: unreadCount,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Send unread count error:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings() {
    // In a real implementation, these would come from a settings model
    return {
      push: {
        enabled: true,
        emergencies: true,
        messages: true,
        updates: true,
        alerts: true
      },
      email: {
        enabled: true,
        emergencies: true,
        messages: false,
        updates: true,
        alerts: true
      },
      sms: {
        enabled: false,
        emergencies: true,
        alerts: true
      },
      inApp: {
        enabled: true,
        emergencies: true,
        messages: true,
        updates: true,
        alerts: true
      }
    };
  }

  // Update notification settings
  async updateNotificationSettings(userId, settings) {
    // In a real implementation, this would update a settings model
    logger.info(`Notification settings updated for user ${userId}`);
    return settings;
  }

  // Send notification to user
  async sendNotification(notification) {
    try {
      // Send to user's socket
      this.socketServer.sendToUser(this.userId, 'notification:new', {
        notification,
        timestamp: new Date()
      });

      // Update unread count
      await this.sendUnreadCount();

      logger.debug(`Notification sent to user ${this.userId}`);
    } catch (error) {
      logger.error('Send notification error:', error);
    }
  }

  // Send batch notifications
  async sendBatchNotifications(notifications) {
    try {
      for (const notification of notifications) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      logger.error('Send batch notifications error:', error);
    }
  }
}

// Create singleton instance
const notificationHandler = new NotificationSocketHandler();

module.exports = notificationHandler;
