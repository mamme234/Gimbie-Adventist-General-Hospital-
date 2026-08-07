// sockets/notification.socket.js
const { logger } = require('../utils/logger');
const { Notification } = require('../models/Notification');

class NotificationSocketHandler {
  constructor(socketServer) {
    this.socketServer = socketServer;
  }

  init(socket) {
    this.socket = socket;
    this.userId = socket.userId;

    // Register events
    socket.on('notification:get', this.handleGetNotifications.bind(this));
    socket.on('notification:read', this.handleMarkAsRead.bind(this));
    socket.on('notification:read-all', this.handleMarkAllAsRead.bind(this));
    socket.on('notification:delete', this.handleDelete.bind(this));
  }

  async handleGetNotifications(data) {
    try {
      const { isRead, page = 1, limit = 20 } = data || {};

      const query = { userId: this.userId };
      if (isRead !== undefined) query.isRead = isRead;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId: this.userId,
        isRead: false
      });

      this.socket.emit('notification:list', {
        notifications,
        total,
        unreadCount,
        page,
        limit,
        hasMore: total > page * limit
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      this.socket.emit('notification:error', { message: error.message });
    }
  }

  async handleMarkAsRead(data) {
    try {
      const { notificationId } = data;

      await Notification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date()
      });

      this.socket.emit('notification:read', { notificationId });

      // Send updated unread count
      await this.sendUnreadCount();
    } catch (error) {
      logger.error('Mark as read error:', error);
    }
  }

  async handleMarkAllAsRead() {
    try {
      await Notification.updateMany(
        { userId: this.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      this.socket.emit('notification:read-all');
      await this.sendUnreadCount();
    } catch (error) {
      logger.error('Mark all as read error:', error);
    }
  }

  async handleDelete(data) {
    try {
      const { notificationId } = data;

      await Notification.findOneAndDelete({
        _id: notificationId,
        userId: this.userId
      });

      this.socket.emit('notification:deleted', { notificationId });
      await this.sendUnreadCount();
    } catch (error) {
      logger.error('Delete notification error:', error);
    }
  }

  async sendUnreadCount() {
    try {
      const count = await Notification.countDocuments({
        userId: this.userId,
        isRead: false
      });

      this.socket.emit('notification:unread-count', { count });
    } catch (error) {
      logger.error('Send unread count error:', error);
    }
  }

  // Send notification to user
  async sendNotification(notification) {
    try {
      this.socketServer.sendToUser(this.userId, 'notification:new', {
        notification,
        timestamp: new Date()
      });

      await this.sendUnreadCount();
    } catch (error) {
      logger.error('Send notification error:', error);
    }
  }
}

module.exports = NotificationSocketHandler;
