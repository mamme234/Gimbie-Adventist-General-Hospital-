// sockets/chat.socket.js
const { logger } = require('../utils/logger');
const { Chat } = require('../models/Chat');
const { Employee } = require('../models/Employee');
const { AuditLog } = require('../models/AuditLog');
const chatService = require('../services/chat.service');

class ChatSocketHandler {
  constructor() {
    this.socketServer = null;
    this.socket = null;
    this.userId = null;
    this.activeChats = new Set();
  }

  // Initialize chat socket handler
  init(socketServer, socket) {
    this.socketServer = socketServer;
    this.socket = socket;
    this.userId = socket.userId;

    // Register event handlers
    this.registerEvents();
  }

  // Register chat events
  registerEvents() {
    const socket = this.socket;

    // Send message
    socket.on('chat:send', this.handleSendMessage.bind(this));

    // Get chat history
    socket.on('chat:history', this.handleGetHistory.bind(this));

    // Mark as read
    socket.on('chat:read', this.handleMarkAsRead.bind(this));

    // Delete message
    socket.on('chat:delete', this.handleDeleteMessage.bind(this));

    // Create chat
    socket.on('chat:create', this.handleCreateChat.bind(this));

    // Add participant
    socket.on('chat:add-participant', this.handleAddParticipant.bind(this));

    // Remove participant
    socket.on('chat:remove-participant', this.handleRemoveParticipant.bind(this));

    // Leave chat
    socket.on('chat:leave', this.handleLeaveChat.bind(this));

    // Archive chat
    socket.on('chat:archive', this.handleArchiveChat.bind(this));

    // Unarchive chat
    socket.on('chat:unarchive', this.handleUnarchiveChat.bind(this));

    // Search messages
    socket.on('chat:search', this.handleSearchMessages.bind(this));

    // Get chat info
    socket.on('chat:info', this.handleGetChatInfo.bind(this));

    // Get unread count
    socket.on('chat:unread', this.handleGetUnreadCount.bind(this));
  }

  // Handle send message
  async handleSendMessage(data) {
    try {
      const { chatId, message, type, attachments, replyTo } = data;

      // Validate
      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      if (!message) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_MESSAGE',
          message: 'Message is required'
        });
      }

      // Send message
      const result = await chatService.sendMessage(
        chatId,
        this.userId,
        message,
        type || 'text',
        attachments || [],
        replyTo
      );

      // Emit to chat room
      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:message', {
        ...result,
        chatId,
        sender: {
          id: this.socket.user._id,
          name: `${this.socket.user.firstName} ${this.socket.user.lastName}`,
          role: this.socket.user.role
        },
        timestamp: new Date()
      });

      // Update user's active chats
      this.activeChats.add(chatId);

      logger.info(`Message sent in chat ${chatId} by user ${this.userId}`);
    } catch (error) {
      logger.error('Send message error:', error);
      this.socket.emit('chat:error', {
        code: 'SEND_ERROR',
        message: error.message || 'Failed to send message'
      });
    }
  }

  // Handle get chat history
  async handleGetHistory(data) {
    try {
      const { chatId, page, limit } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      const result = await chatService.getMessages(
        chatId,
        this.userId,
        { page: page || 1, limit: limit || 50 }
      );

      this.socket.emit('chat:history', {
        chatId,
        ...result
      });

      // Join chat room
      this.socket.join(`chat:${chatId}`);
      this.activeChats.add(chatId);

      logger.debug(`Chat history retrieved for ${chatId}`);
    } catch (error) {
      logger.error('Get history error:', error);
      this.socket.emit('chat:error', {
        code: 'HISTORY_ERROR',
        message: error.message || 'Failed to get chat history'
      });
    }
  }

  // Handle mark as read
  async handleMarkAsRead(data) {
    try {
      const { chatId, messageIds } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      await chatService.markMessagesAsRead(
        chatId,
        this.userId,
        messageIds
      );

      // Notify others
      this.socket.to(`chat:${chatId}`).emit('chat:read', {
        chatId,
        userId: this.userId,
        messageIds: messageIds || 'all',
        timestamp: new Date()
      });

      // Get updated unread count
      const unreadCount = await this.getUnreadCount(chatId);
      this.socket.emit('chat:unread-update', {
        chatId,
        unreadCount
      });

      logger.debug(`Marked messages as read in chat ${chatId}`);
    } catch (error) {
      logger.error('Mark as read error:', error);
      this.socket.emit('chat:error', {
        code: 'READ_ERROR',
        message: error.message || 'Failed to mark as read'
      });
    }
  }

  // Handle delete message
  async handleDeleteMessage(data) {
    try {
      const { chatId, messageId } = data;

      if (!chatId || !messageId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_DATA',
          message: 'Chat ID and Message ID are required'
        });
      }

      await chatService.deleteMessage(chatId, messageId, this.userId);

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:deleted', {
        chatId,
        messageId,
        deletedBy: this.userId,
        timestamp: new Date()
      });

      logger.info(`Message ${messageId} deleted from chat ${chatId}`);
    } catch (error) {
      logger.error('Delete message error:', error);
      this.socket.emit('chat:error', {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete message'
      });
    }
  }

  // Handle create chat
  async handleCreateChat(data) {
    try {
      const { type, participants, emergencyId, name } = data;

      if (!participants || participants.length === 0) {
        return this.socket.emit('chat:error', {
          code: 'NO_PARTICIPANTS',
          message: 'At least one participant is required'
        });
      }

      // Add current user to participants if not already
      if (!participants.some(p => p.userId === this.userId)) {
        participants.push({
          userId: this.userId,
          role: this.socket.user.role
        });
      }

      const chat = await chatService.createChat({
        type: type || 'individual',
        participants,
        emergencyId,
        name
      });

      // Add to chat room
      this.socket.join(`chat:${chat._id}`);
      this.activeChats.add(chat._id.toString());

      this.socket.emit('chat:created', chat);

      // Notify participants
      for (const participant of chat.participants) {
        if (participant.userId.toString() !== this.userId) {
          this.socketServer.sendToUser(participant.userId, 'chat:invited', {
            chat: chat,
            invitedBy: this.userId,
            timestamp: new Date()
          });
        }
      }

      logger.info(`Chat created by user ${this.userId}`);
    } catch (error) {
      logger.error('Create chat error:', error);
      this.socket.emit('chat:error', {
        code: 'CREATE_ERROR',
        message: error.message || 'Failed to create chat'
      });
    }
  }

  // Handle add participant
  async handleAddParticipant(data) {
    try {
      const { chatId, userId } = data;

      if (!chatId || !userId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_DATA',
          message: 'Chat ID and User ID are required'
        });
      }

      await chatService.addParticipant(chatId, userId, this.userId);

      // Add to chat room
      const userSocket = this.socketServer.getSocket(userId);
      if (userSocket) {
        userSocket.join(`chat:${chatId}`);
      }

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:participant-added', {
        chatId,
        userId,
        addedBy: this.userId,
        timestamp: new Date()
      });

      logger.info(`User ${userId} added to chat ${chatId}`);
    } catch (error) {
      logger.error('Add participant error:', error);
      this.socket.emit('chat:error', {
        code: 'ADD_PARTICIPANT_ERROR',
        message: error.message || 'Failed to add participant'
      });
    }
  }

  // Handle remove participant
  async handleRemoveParticipant(data) {
    try {
      const { chatId, userId } = data;

      if (!chatId || !userId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_DATA',
          message: 'Chat ID and User ID are required'
        });
      }

      await chatService.removeParticipant(chatId, userId, this.userId);

      // Remove from chat room
      const userSocket = this.socketServer.getSocket(userId);
      if (userSocket) {
        userSocket.leave(`chat:${chatId}`);
      }

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:participant-removed', {
        chatId,
        userId,
        removedBy: this.userId,
        timestamp: new Date()
      });

      logger.info(`User ${userId} removed from chat ${chatId}`);
    } catch (error) {
      logger.error('Remove participant error:', error);
      this.socket.emit('chat:error', {
        code: 'REMOVE_PARTICIPANT_ERROR',
        message: error.message || 'Failed to remove participant'
      });
    }
  }

  // Handle leave chat
  async handleLeaveChat(data) {
    try {
      const { chatId } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      await chatService.removeParticipant(chatId, this.userId, this.userId);

      // Leave chat room
      this.socket.leave(`chat:${chatId}`);
      this.activeChats.delete(chatId);

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:participant-left', {
        chatId,
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('chat:left', { chatId });

      logger.info(`User ${this.userId} left chat ${chatId}`);
    } catch (error) {
      logger.error('Leave chat error:', error);
      this.socket.emit('chat:error', {
        code: 'LEAVE_ERROR',
        message: error.message || 'Failed to leave chat'
      });
    }
  }

  // Handle archive chat
  async handleArchiveChat(data) {
    try {
      const { chatId } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      await chatService.archiveChat(chatId, this.userId);

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:archived', {
        chatId,
        archivedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('chat:archived', { chatId });

      logger.info(`Chat ${chatId} archived by user ${this.userId}`);
    } catch (error) {
      logger.error('Archive chat error:', error);
      this.socket.emit('chat:error', {
        code: 'ARCHIVE_ERROR',
        message: error.message || 'Failed to archive chat'
      });
    }
  }

  // Handle unarchive chat
  async handleUnarchiveChat(data) {
    try {
      const { chatId } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      await chatService.unarchiveChat(chatId, this.userId);

      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:unarchived', {
        chatId,
        unarchivedBy: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('chat:unarchived', { chatId });

      logger.info(`Chat ${chatId} unarchived by user ${this.userId}`);
    } catch (error) {
      logger.error('Unarchive chat error:', error);
      this.socket.emit('chat:error', {
        code: 'UNARCHIVE_ERROR',
        message: error.message || 'Failed to unarchive chat'
      });
    }
  }

  // Handle search messages
  async handleSearchMessages(data) {
    try {
      const { chatId, query, page, limit } = data;

      if (!chatId || !query) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_DATA',
          message: 'Chat ID and query are required'
        });
      }

      const result = await chatService.searchMessages(
        chatId,
        query,
        this.userId,
        { page: page || 1, limit: limit || 20 }
      );

      this.socket.emit('chat:search-results', {
        chatId,
        query,
        ...result
      });
    } catch (error) {
      logger.error('Search messages error:', error);
      this.socket.emit('chat:error', {
        code: 'SEARCH_ERROR',
        message: error.message || 'Failed to search messages'
      });
    }
  }

  // Handle get chat info
  async handleGetChatInfo(data) {
    try {
      const { chatId } = data;

      if (!chatId) {
        return this.socket.emit('chat:error', {
          code: 'MISSING_CHAT_ID',
          message: 'Chat ID is required'
        });
      }

      const chat = await Chat.findById(chatId)
        .populate('participants.userId', 'firstName lastName role email status')
        .lean();

      if (!chat) {
        return this.socket.emit('chat:error', {
          code: 'CHAT_NOT_FOUND',
          message: 'Chat not found'
        });
      }

      const stats = await chatService.getChatStats(chatId);
      const unreadCount = await this.getUnreadCount(chatId);

      this.socket.emit('chat:info', {
        chat,
        stats,
        unreadCount
      });
    } catch (error) {
      logger.error('Get chat info error:', error);
      this.socket.emit('chat:error', {
        code: 'INFO_ERROR',
        message: error.message || 'Failed to get chat info'
      });
    }
  }

  // Handle get unread count
  async handleGetUnreadCount(data) {
    try {
      const { chatId } = data;

      if (!chatId) {
        // Get unread count for all chats
        const counts = await this.getAllUnreadCounts();
        this.socket.emit('chat:unread-all', counts);
        return;
      }

      const unreadCount = await this.getUnreadCount(chatId);
      this.socket.emit('chat:unread', {
        chatId,
        unreadCount
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      this.socket.emit('chat:error', {
        code: 'UNREAD_ERROR',
        message: error.message || 'Failed to get unread count'
      });
    }
  }

  // Get unread count for a chat
  async getUnreadCount(chatId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return 0;

      let unreadCount = 0;
      for (const message of chat.messages) {
        if (message.senderId && 
            message.senderId.toString() !== this.userId &&
            !message.readBy.some(r => r.userId.toString() === this.userId)) {
          unreadCount++;
        }
      }
      return unreadCount;
    } catch (error) {
      logger.error('Get unread count error:', error);
      return 0;
    }
  }

  // Get all unread counts
  async getAllUnreadCounts() {
    try {
      const chats = await Chat.find({
        'participants.userId': this.userId,
        isActive: true
      });

      const counts = {};
      for (const chat of chats) {
        counts[chat._id] = await this.getUnreadCount(chat._id);
      }
      return counts;
    } catch (error) {
      logger.error('Get all unread counts error:', error);
      return {};
    }
  }

  // Clean up active chats
  cleanup() {
    for (const chatId of this.activeChats) {
      this.socket.leave(`chat:${chatId}`);
    }
    this.activeChats.clear();
  }
}

// Create singleton instance
const chatHandler = new ChatSocketHandler();

module.exports = chatHandler;
