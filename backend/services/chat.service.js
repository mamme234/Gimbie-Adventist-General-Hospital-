// services/chat.service.js
const { Chat } = require('../models/Chat');
const { Employee } = require('../models/Employee');
const { Emergency } = require('../models/Emergency');
const { logger } = require('../middleware/logger');
const { AuditLog } = require('../models/AuditLog');
const notificationService = require('./notification.service');
const { EventEmitter } = require('events');

class ChatService extends EventEmitter {
  constructor() {
    super();
    this.onlineUsers = new Map();
    this.typingUsers = new Map();
    this.messageHistory = new Map();
  }

  // Create chat
  async createChat({ type, participants, emergencyId, name }) {
    try {
      // Validate participants
      const validParticipants = await this.validateParticipants(participants);
      
      // Check if chat already exists for emergency
      if (emergencyId) {
        const existingChat = await Chat.findOne({ 
          emergencyId,
          isActive: true 
        });
        if (existingChat) {
          return existingChat;
        }
      }

      const chat = new Chat({
        type,
        participants: validParticipants.map(p => ({
          userId: p._id,
          role: p.role,
          joinedAt: new Date()
        })),
        emergencyId,
        name: name || this.generateChatName(validParticipants),
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      await chat.save();

      // Add initial system message
      await this.addSystemMessage(chat._id, 'Chat created');

      // Notify participants
      await this.notifyParticipants(chat._id, 'chat_created');

      await AuditLog.logAction({
        action: 'create_chat',
        resource: 'chat',
        resourceId: chat._id,
        userId: participants[0]?.userId,
        details: { type, participants: participants.length },
        status: 'success'
      });

      return chat;
    } catch (error) {
      logger.error('Create chat error:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(chatId, senderId, message, type = 'text', attachments = []) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      if (!chat.isActive) {
        throw new Error('Chat is inactive');
      }

      // Check if sender is participant
      const isParticipant = chat.participants.some(
        p => p.userId.toString() === senderId.toString()
      );
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat');
      }

      // Create message
      const newMessage = {
        senderId,
        message,
        type,
        attachments: attachments.map(a => ({
          url: a.url,
          type: a.type,
          name: a.name,
          size: a.size
        })),
        sentAt: new Date(),
        readBy: [{ userId: senderId, readAt: new Date() }],
        isDeleted: false
      };

      chat.messages.push(newMessage);
      chat.lastActivity = new Date();
      await chat.save();

      // Get the saved message
      const savedMessage = chat.messages[chat.messages.length - 1];

      // Emit message event
      this.emit('message', {
        chatId,
        message: savedMessage,
        senderId
      });

      // Notify other participants
      await this.notifyParticipants(chatId, 'new_message', {
        messageId: savedMessage._id,
        senderId,
        preview: message.substring(0, 50)
      });

      // If it's an emergency chat, alert dispatcher
      if (chat.emergencyId) {
        await this.handleEmergencyMessage(chat, savedMessage);
      }

      return savedMessage;
    } catch (error) {
      logger.error('Send message error:', error);
      throw error;
    }
  }

  // Get messages
  async getMessages(chatId, userId, options = {}) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(
        p => p.userId.toString() === userId.toString()
      );
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat');
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      // Get messages with pagination
      const messages = chat.messages
        .filter(m => !m.isDeleted)
        .slice(-skip - limit, -skip || undefined)
        .reverse();

      // Mark messages as read
      await this.markMessagesAsRead(chatId, userId, messages.map(m => m._id));

      return {
        messages,
        total: chat.messages.filter(m => !m.isDeleted).length,
        page,
        limit,
        hasMore: chat.messages.filter(m => !m.isDeleted).length > (page * limit)
      };
    } catch (error) {
      logger.error('Get messages error:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId, userId, messageIds = null) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // If no message IDs provided, mark all unread
      if (!messageIds) {
        const unreadMessages = chat.messages.filter(m => 
          !m.readBy.some(r => r.userId.toString() === userId.toString()) &&
          m.senderId.toString() !== userId.toString()
        );

        for (const message of unreadMessages) {
          message.readBy.push({ userId, readAt: new Date() });
        }
      } else {
        // Mark specific messages
        for (const messageId of messageIds) {
          const message = chat.messages.id(messageId);
          if (message && !message.readBy.some(r => r.userId.toString() === userId.toString())) {
            message.readBy.push({ userId, readAt: new Date() });
          }
        }
      }

      await chat.save();

      return { success: true };
    } catch (error) {
      logger.error('Mark messages as read error:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(chatId, messageId, userId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const message = chat.messages.id(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Only allow sender or admin to delete
      const isSender = message.senderId.toString() === userId.toString();
      const isAdmin = await this.isUserAdmin(userId);

      if (!isSender && !isAdmin) {
        throw new Error('Not authorized to delete this message');
      }

      message.isDeleted = true;
      message.message = '[Message deleted]';
      await chat.save();

      this.emit('message_deleted', {
        chatId,
        messageId,
        userId
      });

      return { success: true };
    } catch (error) {
      logger.error('Delete message error:', error);
      throw error;
    }
  }

  // Add participant
  async addParticipant(chatId, userId, adminId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if admin has permission
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin && !chat.participants.some(p => p.userId.toString() === adminId.toString())) {
        throw new Error('Not authorized to add participants');
      }

      // Check if user already in chat
      if (chat.participants.some(p => p.userId.toString() === userId.toString())) {
        throw new Error('User already in chat');
      }

      const user = await Employee.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      chat.participants.push({
        userId: user._id,
        role: user.role,
        joinedAt: new Date()
      });
      await chat.save();

      // Add system message
      await this.addSystemMessage(chatId, `${user.firstName} ${user.lastName} joined the chat`);

      // Notify participants
      await this.notifyParticipants(chatId, 'participant_added', {
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`
      });

      return { success: true };
    } catch (error) {
      logger.error('Add participant error:', error);
      throw error;
    }
  }

  // Remove participant
  async removeParticipant(chatId, userId, adminId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if admin has permission
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin && !chat.participants.some(p => p.userId.toString() === adminId.toString())) {
        throw new Error('Not authorized to remove participants');
      }

      const participantIndex = chat.participants.findIndex(
        p => p.userId.toString() === userId.toString()
      );
      if (participantIndex === -1) {
        throw new Error('User not in chat');
      }

      chat.participants.splice(participantIndex, 1);
      await chat.save();

      // Add system message
      const user = await Employee.findById(userId);
      if (user) {
        await this.addSystemMessage(chatId, `${user.firstName} ${user.lastName} left the chat`);
      }

      // Notify participants
      await this.notifyParticipants(chatId, 'participant_removed', {
        userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown user'
      });

      return { success: true };
    } catch (error) {
      logger.error('Remove participant error:', error);
      throw error;
    }
  }

  // Add system message
  async addSystemMessage(chatId, message) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      chat.messages.push({
        senderId: null,
        message,
        type: 'system',
        sentAt: new Date(),
        readBy: chat.participants.map(p => ({
          userId: p.userId,
          readAt: new Date()
        })),
        isDeleted: false
      });
      chat.lastActivity = new Date();
      await chat.save();
    } catch (error) {
      logger.error('Add system message error:', error);
    }
  }

  // Handle emergency message
  async handleEmergencyMessage(chat, message) {
    try {
      const emergency = await Emergency.findById(chat.emergencyId);
      if (!emergency) return;

      // Add to emergency timeline
      await emergency.addTimelineEntry(
        `Message from ${message.senderId}`,
        message.senderId,
        message.message
      );

      // If critical message, notify dispatcher
      if (message.message.includes('urgent') || 
          message.message.includes('emergency') ||
          message.message.includes('help')) {
        await notificationService.sendNotification({
          userId: emergency.dispatcherId,
          type: 'emergency_alert',
          title: '🚨 Urgent message in emergency chat',
          body: `Emergency ${emergency.emergencyId}: ${message.message.substring(0, 100)}`,
          priority: 'critical',
          channels: ['in-app', 'push', 'sms'],
          data: {
            emergencyId: emergency._id,
            chatId: chat._id,
            action: 'view_emergency'
          }
        });
      }
    } catch (error) {
      logger.error('Handle emergency message error:', error);
    }
  }

  // Validate participants
  async validateParticipants(participants) {
    const userIds = participants.map(p => p.userId);
    const users = await Employee.find({ _id: { $in: userIds } });
    
    if (users.length !== userIds.length) {
      throw new Error('Some participants not found');
    }

    return users;
  }

  // Generate chat name
  generateChatName(participants) {
    if (participants.length === 0) return 'Empty Chat';
    if (participants.length === 1) {
      return `${participants[0].firstName} ${participants[0].lastName}`;
    }
    if (participants.length === 2) {
      return `${participants[0].firstName} & ${participants[1].firstName}`;
    }
    return `${participants[0].firstName} and ${participants.length - 1} others`;
  }

  // Check if user is admin
  async isUserAdmin(userId) {
    const user = await Employee.findById(userId);
    return user && user.role === 'admin';
  }

  // Notify participants
  async notifyParticipants(chatId, event, data = {}) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      for (const participant of chat.participants) {
        if (participant.userId.toString() === data.senderId?.toString()) continue;

        await notificationService.sendNotification({
          userId: participant.userId,
          type: 'chat',
          title: `New message in ${chat.name || 'Chat'}`,
          body: data.preview || `New ${event}`,
          priority: 'medium',
          channels: ['in-app', 'push'],
          data: {
            chatId,
            event,
            ...data,
            action: 'view_chat'
          }
        });
      }
    } catch (error) {
      logger.error('Notify participants error:', error);
    }
  }

  // Set user online status
  setUserOnline(userId, socketId) {
    this.onlineUsers.set(userId, {
      socketId,
      lastSeen: new Date()
    });
    this.emit('user_online', { userId, socketId });
  }

  // Set user offline
  setUserOffline(userId) {
    this.onlineUsers.delete(userId);
    this.emit('user_offline', { userId });
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Set user typing
  setUserTyping(chatId, userId, isTyping) {
    const key = `${chatId}:${userId}`;
    if (isTyping) {
      this.typingUsers.set(key, {
        userId,
        chatId,
        startedAt: new Date()
      });
    } else {
      this.typingUsers.delete(key);
    }

    this.emit('typing_status', {
      chatId,
      userId,
      isTyping
    });
  }

  // Get typing users
  getTypingUsers(chatId) {
    const users = [];
    for (const [key, value] of this.typingUsers.entries()) {
      if (value.chatId === chatId) {
        // Check if typing timeout (5 seconds)
        const elapsed = Date.now() - value.startedAt.getTime();
        if (elapsed < 5000) {
          users.push(value.userId);
        } else {
          this.typingUsers.delete(key);
        }
      }
    }
    return users;
  }

  // Clean up inactive chats
  async cleanupInactiveChats(days = 30) {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const result = await Chat.updateMany(
        { 
          isActive: true,
          lastActivity: { $lt: cutoff }
        },
        { isActive: false }
      );

      logger.info(`Cleaned up ${result.modifiedCount} inactive chats`);
      return result;
    } catch (error) {
      logger.error('Cleanup inactive chats error:', error);
      throw error;
    }
  }

  // Get chat statistics
  async getChatStats(chatId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const totalMessages = chat.messages.filter(m => !m.isDeleted).length;
      const participantCount = chat.participants.length;
      const activeMessages = chat.messages.filter(m => 
        !m.isDeleted && 
        new Date(m.sentAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      return {
        totalMessages,
        participantCount,
        activeMessages,
        lastActivity: chat.lastActivity,
        isActive: chat.isActive,
        createdAt: chat.createdAt
      };
    } catch (error) {
      logger.error('Get chat stats error:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(chatId, query, userId, options = {}) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user is participant
      if (!chat.participants.some(p => p.userId.toString() === userId.toString())) {
        throw new Error('User is not a participant in this chat');
      }

      const results = chat.messages.filter(m => 
        !m.isDeleted &&
        m.type !== 'system' &&
        m.message.toLowerCase().includes(query.toLowerCase())
      );

      // Sort by relevance (simple implementation)
      results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a.message, query);
        const scoreB = this.calculateRelevanceScore(b.message, query);
        return scoreB - scoreA;
      });

      const limit = options.limit || 20;
      const page = options.page || 1;
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        results: results.slice(start, end),
        total: results.length,
        page,
        limit,
        hasMore: results.length > end
      };
    } catch (error) {
      logger.error('Search messages error:', error);
      throw error;
    }
  }

  // Calculate relevance score
  calculateRelevanceScore(text, query) {
    const words = query.toLowerCase().split(' ');
    const textLower = text.toLowerCase();
    
    let score = 0;
    for (const word of words) {
      if (textLower.includes(word)) {
        score += word.length * 2;
      }
      // Check for exact matches
      if (textLower.includes(` ${word} `)) {
        score += 5;
      }
    }
    
    return score;
  }

  // Archive chat
  async archiveChat(chatId, userId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user has permission
      const isAdmin = await this.isUserAdmin(userId);
      const isParticipant = chat.participants.some(
        p => p.userId.toString() === userId.toString()
      );
      
      if (!isAdmin && !isParticipant) {
        throw new Error('Not authorized');
      }

      chat.isActive = false;
      chat.archivedAt = new Date();
      chat.archivedBy = userId;
      await chat.save();

      await this.addSystemMessage(chatId, 'Chat archived');

      return { success: true };
    } catch (error) {
      logger.error('Archive chat error:', error);
      throw error;
    }
  }

  // Unarchive chat
  async unarchiveChat(chatId, userId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Check if user has permission
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error('Only admins can unarchive chats');
      }

      chat.isActive = true;
      chat.archivedAt = null;
      chat.archivedBy = null;
      await chat.save();

      await this.addSystemMessage(chatId, 'Chat unarchived');

      return { success: true };
    } catch (error) {
      logger.error('Unarchive chat error:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
