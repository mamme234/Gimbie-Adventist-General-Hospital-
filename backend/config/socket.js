/**
 * ============================================
 * SOCKET.JS - WebSocket Configuration
 * ============================================
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { logger } = require('./logger');

dotenv.config();

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

/**
 * Socket.IO instance
 */
let io = null;

/**
 * Initialize Socket.IO with HTTP server
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} Socket.IO server instance
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
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user data to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;

    logger.info(`⚡ Socket connected: ${socket.id} (User: ${userId})`);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    // Handle joining specific rooms (e.g., appointment, department)
    socket.on('join-room', (room) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle appointment updates
    socket.on('appointment-update', (data) => {
      // Broadcast to relevant rooms
      io.to(`appointment:${data.appointmentId}`).emit('appointment-updated', data);
      io.to(`doctor:${data.doctorId}`).emit('appointment-updated', data);
      io.to(`patient:${data.patientId}`).emit('appointment-updated', data);
    });

    // Handle notification
    socket.on('send-notification', (notification) => {
      // Send to specific user
      io.to(`user:${notification.userId}`).emit('notification', notification);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('user-typing', {
        userId: userId,
        isTyping: data.isTyping,
      });
    });

    // Handle chat message
    socket.on('chat-message', (data) => {
      io.to(`chat:${data.chatId}`).emit('new-message', {
        ...data,
        userId: userId,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`⚡ Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('🚀 Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {SocketIO.Server|null} Socket.IO server instance
 */
const getSocket = () => {
  return io;
};

/**
 * Emit event to specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  } else {
    logger.warn('Socket.IO not initialized, cannot emit event');
  }
};

/**
 * Emit event to specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  } else {
    logger.warn('Socket.IO not initialized, cannot emit event');
  }
};

/**
 * Broadcast event to all connected clients (except sender)
 * @param {string} event - Event name
 * @param {Object} data - Event data
 * @param {string} excludeSocketId - Socket ID to exclude
 */
const broadcast = (event, data, excludeSocketId = null) => {
  if (io) {
    if (excludeSocketId) {
      io.except(excludeSocketId).emit(event, data);
    } else {
      io.emit(event, data);
    }
  } else {
    logger.warn('Socket.IO not initialized, cannot broadcast event');
  }
};

/**
 * Send real-time appointment update
 * @param {Object} appointment - Appointment data
 * @param {string} action - Action type (created, updated, cancelled, etc.)
 */
const sendAppointmentUpdate = (appointment, action = 'updated') => {
  const data = { appointment, action, timestamp: new Date() };
  
  // Notify doctor
  if (appointment.doctor) {
    emitToUser(appointment.doctor.userId || appointment.doctor, 'appointment-update', data);
  }
  
  // Notify patient
  if (appointment.patient) {
    emitToUser(appointment.patient.userId || appointment.patient, 'appointment-update', data);
  }
};

/**
 * Send real-time notification
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const sendNotification = (userId, notification) => {
  emitToUser(userId, 'notification', {
    ...notification,
    timestamp: new Date(),
  });
};

/**
 * Send real-time message
 * @param {string} chatId - Chat ID
 * @param {Object} message - Message data
 */
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
