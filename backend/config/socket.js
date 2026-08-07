// config/socket.js - FIXED
/**
 * ============================================
 * SOCKET.JS - WebSocket Configuration
 * ============================================
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Fix: Correct logger import path
const logger = require('../utils/logger')?.logger || console;

/**
 * Socket.IO Configuration
 */
const socketConfig = {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
};

let io = null;

/**
 * Initialize Socket.IO
 */
const initializeSocket = (server) => {
  if (io) {
    logger.warn('Socket.IO already initialized');
    return io;
  }

  io = new Server(server, socketConfig);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;

    logger.info(`⚡ Socket connected: ${socket.id} (User: ${userId})`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    socket.on('join-room', (room) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('appointment-update', (data) => {
      const { appointmentId, doctorId, patientId } = data;
      io.to(`appointment:${appointmentId}`).emit('appointment-updated', data);
      if (doctorId) io.to(`doctor:${doctorId}`).emit('appointment-updated', data);
      if (patientId) io.to(`patient:${patientId}`).emit('appointment-updated', data);
    });

    socket.on('send-notification', (notification) => {
      if (notification?.userId) {
        io.to(`user:${notification.userId}`).emit('notification', notification);
      }
    });

    socket.on('typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: userId,
        isTyping: data.isTyping,
        timestamp: new Date(),
      });
    });

    socket.on('chat-message', (data) => {
      io.to(`chat:${data.chatId}`).emit('new-message', {
        ...data,
        userId: userId,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      logger.info(`⚡ Socket disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('🚀 Socket.IO initialized');
  return io;
};

const getSocket = () => io;

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const broadcast = (event, data, excludeSocketId = null) => {
  if (io) {
    if (excludeSocketId) {
      io.except(excludeSocketId).emit(event, data);
    } else {
      io.emit(event, data);
    }
  }
};

const sendAppointmentUpdate = (appointment, action = 'updated') => {
  const data = { appointment, action, timestamp: new Date() };
  if (appointment?.doctorId) {
    emitToUser(appointment.doctorId, 'appointment-update', data);
  }
  if (appointment?.patientId) {
    emitToUser(appointment.patientId, 'appointment-update', data);
  }
};

const sendNotification = (userId, notification) => {
  emitToUser(userId, 'notification', {
    ...notification,
    timestamp: new Date(),
  });
};

const sendChatMessage = (chatId, message) => {
  emitToRoom(`chat:${chatId}`, 'new-message', {
    ...message,
    timestamp: new Date(),
  });
};

module.exports = {
  initializeSocket,
  getSocket,
  emitToUser,
  emitToRoom,
  broadcast,
  sendAppointmentUpdate,
  sendNotification,
  sendChatMessage,
  socketConfig,
};
