// sockets/chat.socket.js
const { logger } = require('../utils/logger');
const { Chat } = require('../models/Chat');
const { Message } = require('../models/Message');

class ChatSocketHandler {
  constructor(socketServer) {
    this.socketServer = socketServer;
  }

  init(socket) {
    this.socket = socket;
    this.userId = socket.userId;

    // Register events
    socket.on('chat:send', this.handleSendMessage.bind(this));
    socket.on('chat:join', this.handleJoinChat.bind(this));
    socket.on('chat:leave', this.handleLeaveChat.bind(this));
    socket.on('chat:history', this.handleGetHistory.bind(this));
    socket.on('chat:read', this.handleMarkAsRead.bind(this));
    socket.on('chat:typing', this.handleTyping.bind(this));
  }

  async handleSendMessage(data) {
    try {
      const { chatId, message, type } = data;

      if (!chatId || !message) {
        return this.socket.emit('chat:error', {
          message: 'Chat ID and message are required'
        });
      }

      // Save message
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return this.socket.emit('chat:error', { message: 'Chat not found' });
      }

      const newMessage = {
        senderId: this.userId,
        message,
        type: type || 'text',
        sentAt: new Date(),
        readBy: [{ userId: this.userId, readAt: new Date() }]
      };

      chat.messages.push(newMessage);
      chat.lastActivity = new Date();
      await chat.save();

      const savedMessage = chat.messages[chat.messages.length - 1];

      // Broadcast to chat room
      this.socketServer.sendToRoom(`chat:${chatId}`, 'chat:message', {
        ...savedMessage.toObject(),
        chatId,
        sender: {
          id: this.userId,
          name: this.socket.user?.name || 'User'
        }
      });

      // Notify participants
      for (const participant of chat.participants) {
        if (participant.userId.toString() !== this.userId) {
          this.socketServer.sendToUser(participant.userId, 'chat:notification', {
            chatId,
            message: message.substring(0, 50),
            senderId: this.userId
          });
        }
      }

    } catch (error) {
      logger.error('Send message error:', error);
      this.socket.emit('chat:error', { message: error.message });
    }
  }

  async handleJoinChat(data) {
    try {
      const { chatId } = data;
      
      this.socket.join(`chat:${chatId}`);
      
      // Notify others
      this.socket.to(`chat:${chatId}`).emit('chat:participant-joined', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('chat:joined', { chatId });
    } catch (error) {
      logger.error('Join chat error:', error);
    }
  }

  async handleLeaveChat(data) {
    try {
      const { chatId } = data;
      
      this.socket.leave(`chat:${chatId}`);
      
      this.socket.to(`chat:${chatId}`).emit('chat:participant-left', {
        userId: this.userId,
        timestamp: new Date()
      });

      this.socket.emit('chat:left', { chatId });
    } catch (error) {
      logger.error('Leave chat error:', error);
    }
  }

  async handleGetHistory(data) {
    try {
      const { chatId, page = 1, limit = 50 } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return this.socket.emit('chat:error', { message: 'Chat not found' });
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const messages = chat.messages.slice(-end, -start || undefined).reverse();

      this.socket.emit('chat:history', {
        chatId,
        messages,
        total: chat.messages.length,
        page,
        limit,
        hasMore: chat.messages.length > end
      });
    } catch (error) {
      logger.error('Get history error:', error);
      this.socket.emit('chat:error', { message: error.message });
    }
  }

  async handleMarkAsRead(data) {
    try {
      const { chatId, messageIds } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return this.socket.emit('chat:error', { message: 'Chat not found' });
      }

      // Mark messages as read
      const messagesToUpdate = messageIds ? 
        chat.messages.filter(m => messageIds.includes(m._id.toString())) :
        chat.messages;

      for (const message of messagesToUpdate) {
        if (!message.readBy.some(r => r.userId.toString() === this.userId)) {
          message.readBy.push({ userId: this.userId, readAt: new Date() });
        }
      }

      await chat.save();

      this.socket.emit('chat:read', {
        chatId,
        userId: this.userId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Mark as read error:', error);
    }
  }

  async handleTyping(data) {
    try {
      const { chatId, isTyping } = data;

      this.socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId: this.userId,
        chatId,
        isTyping,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Typing error:', error);
    }
  }
}

module.exports = ChatSocketHandler;
