// sockets/index.js
const socketIO = require('socket.io');
const { logger } = require('../utils/logger');
const { jwt } = require('../utils/jwt');
const { Employee } = require('../models/Employee');
const { AuditLog } = require('../models/AuditLog');
const chatSocket = require('./chat.socket');
const notificationSocket = require('./notification.socket');
const appointmentSocket = require('./appointment.socket');

class SocketServer {
  constructor(server) {
    this.io = null;
    this.onlineUsers = new Map();
    this.userSockets = new Map();
    this.roomUsers = new Map();
    this.initialize(server);
  }

  // Initialize Socket.IO server
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      path: '/socket.io/',
      serveClient: false,
      cookie: true,
      allowEIO3: true,
      maxHttpBufferSize: 1e6 // 1MB
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    // Error handler
    this.io.on('error', (error) => {
      logger.error('Socket.IO error:', error);
    });

    logger.info('Socket.IO server initialized');
  }

  // Authenticate socket connection
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.split(' ')[1] ||
                   socket.handshake.query.token;

      if (!token) {
        logger.warn('Socket connection attempt without token');
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verifyAccessToken(token);
      
      // Get user
      const user = await Employee.findById(decoded.id)
        .select('_id firstName lastName role email status')
        .lean();

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.status !== 'active') {
        return next(new Error('Account is not active'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      
      // Store user's socket
      this.userSockets.set(socket.userId, socket);
      
      // Add to online users
      this.onlineUsers.set(socket.userId, {
        socketId: socket.id,
        userId: socket.userId,
        user: user,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set()
      });

      // Log connection
      await AuditLog.logAction({
        action: 'socket_connect',
        resource: 'websocket',
        resourceId: socket.id,
        userId: socket.userId,
        details: {
          socketId: socket.id,
          transport: socket.conn.transport.name
        },
        status: 'success'
      });

      logger.info(`User ${socket.userId} connected via WebSocket`, {
        socketId: socket.id,
        userId: socket.userId
      });

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  // Handle socket connection
  handleConnection(socket) {
    const { userId } = socket;

    // Log connection
    logger.info(`Socket connected: ${socket.id} for user ${userId}`);

    // Initialize sub-modules
    chatSocket.init(this, socket);
    notificationSocket.init(this, socket);
    appointmentSocket.init(this, socket);

    // Emit user status
    this.emitUserStatus(userId, 'online');

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join role-based rooms
    if (socket.user.role) {
      socket.join(`role:${socket.user.role}`);
    }

    // Join all rooms based on user's data
    this.joinUserRooms(socket);

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong');
      this.updateUserActivity(userId);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });

    // Handle reconnect
    socket.on('reconnect', () => {
      logger.info(`Socket reconnected: ${socket.id} for user ${userId}`);
      this.updateUserActivity(userId);
    });

    // Handle error
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });

    // Handle custom events
    socket.on('heartbeat', () => {
      this.updateUserActivity(userId);
    });

    // Handle join room
    socket.on('join-room', (roomId) => {
      this.joinRoom(socket, roomId);
    });

    // Handle leave room
    socket.on('leave-room', (roomId) => {
      this.leaveRoom(socket, roomId);
    });

    // Handle get online users
    socket.on('get-online-users', () => {
      const onlineUsers = this.getOnlineUsers();
      socket.emit('online-users', onlineUsers);
    });

    // Handle user status request
    socket.on('get-user-status', (targetUserId) => {
      const isOnline = this.isUserOnline(targetUserId);
      socket.emit('user-status', {
        userId: targetUserId,
        online: isOnline
      });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat:${chatId}`).emit('user-typing', {
        userId,
        chatId,
        isTyping,
        timestamp: new Date()
      });
    });

    // Handle read receipt
    socket.on('read-receipt', (data) => {
      const { chatId, messageId } = data;
      socket.to(`chat:${chatId}`).emit('message-read', {
        userId,
        messageId,
        timestamp: new Date()
      });
    });

    // Handle delivered receipt
    socket.on('delivered-receipt', (data) => {
      const { chatId, messageId } = data;
      socket.to(`chat:${chatId}`).emit('message-delivered', {
        userId,
        messageId,
        timestamp: new Date()
      });
    });
  }

  // Handle disconnect
  handleDisconnect(socket, reason) {
    const { userId } = socket;
    
    // Log disconnect
    logger.info(`Socket disconnected: ${socket.id} for user ${userId}`, {
      reason
    });

    // Remove from online users
    this.onlineUsers.delete(userId);
    this.userSockets.delete(userId);

    // Remove from rooms
    for (const [roomId, users] of this.roomUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) {
          this.roomUsers.delete(roomId);
        }
      }
    }

    // Update user status
    this.emitUserStatus(userId, 'offline');

    // Log disconnect
    AuditLog.logAction({
      action: 'socket_disconnect',
      resource: 'websocket',
      resourceId: socket.id,
      userId: userId,
      details: {
        reason,
        socketId: socket.id
      },
      status: 'success'
    }).catch(logger.error);
  }

  // Join user's rooms
  async joinUserRooms(socket) {
    try {
      const user = socket.user;
      
      // Join role-based room
      if (user.role) {
        socket.join(`role:${user.role}`);
        this.addToRoom(`role:${user.role}`, user._id.toString());
      }

      // Join emergency rooms if user is a paramedic
      if (['paramedic', 'doctor', 'nurse', 'dispatcher'].includes(user.role)) {
        const Emergency = require('../models/Emergency');
        const emergencies = await Emergency.find({
          'assignedParamedics': user._id,
          'status': { $nin: ['completed', 'cancelled'] }
        });
        
        for (const emergency of emergencies) {
          const roomId = `emergency:${emergency._id}`;
          socket.join(roomId);
          this.addToRoom(roomId, user._id.toString());
        }
      }

      // Join chat rooms
      const Chat = require('../models/Chat');
      const chats = await Chat.find({
        'participants.userId': user._id,
        'isActive': true
      });
      
      for (const chat of chats) {
        const roomId = `chat:${chat._id}`;
        socket.join(roomId);
        this.addToRoom(roomId, user._id.toString());
      }
    } catch (error) {
      logger.error('Join user rooms error:', error);
    }
  }

  // Join room
  joinRoom(socket, roomId) {
    try {
      socket.join(roomId);
      this.addToRoom(roomId, socket.userId);
      
      // Notify others in room
      socket.to(roomId).emit('user-joined-room', {
        userId: socket.userId,
        roomId,
        timestamp: new Date()
      });

      logger.debug(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      logger.error('Join room error:', error);
    }
  }

  // Leave room
  leaveRoom(socket, roomId) {
    try {
      socket.leave(roomId);
      this.removeFromRoom(roomId, socket.userId);
      
      // Notify others in room
      socket.to(roomId).emit('user-left-room', {
        userId: socket.userId,
        roomId,
        timestamp: new Date()
      });

      logger.debug(`User ${socket.userId} left room ${roomId}`);
    } catch (error) {
      logger.error('Leave room error:', error);
    }
  }

  // Add user to room tracking
  addToRoom(roomId, userId) {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId).add(userId);
  }

  // Remove user from room tracking
  removeFromRoom(roomId, userId) {
    if (this.roomUsers.has(roomId)) {
      this.roomUsers.get(roomId).delete(userId);
      if (this.roomUsers.get(roomId).size === 0) {
        this.roomUsers.delete(roomId);
      }
    }
  }

  // Update user activity
  updateUserActivity(userId) {
    if (this.onlineUsers.has(userId)) {
      this.onlineUsers.get(userId).lastActivity = new Date();
    }
  }

  // Get online users
  getOnlineUsers() {
    const users = [];
    for (const [userId, data] of this.onlineUsers.entries()) {
      users.push({
        userId,
        user: data.user,
        connectedAt: data.connectedAt,
        lastActivity: data.lastActivity
      });
    }
    return users;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Emit user status
  emitUserStatus(userId, status) {
    this.io.emit('user-status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Send to user
  sendToUser(userId, event, data) {
    try {
      const socket = this.userSockets.get(userId);
      if (socket) {
        socket.emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Send to user error:', error);
      return false;
    }
  }

  // Send to room
  sendToRoom(roomId, event, data) {
    try {
      this.io.to(roomId).emit(event, data);
      return true;
    } catch (error) {
      logger.error('Send to room error:', error);
      return false;
    }
  }

  // Broadcast to all
  broadcast(event, data) {
    try {
      this.io.emit(event, data);
      return true;
    } catch (error) {
      logger.error('Broadcast error:', error);
      return false;
    }
  }

  // Get socket for user
  getSocket(userId) {
    return this.userSockets.get(userId);
  }

  // Get user from socket
  getUserFromSocket(socketId) {
    for (const [userId, data] of this.onlineUsers.entries()) {
      if (data.socketId === socketId) {
        return userId;
      }
    }
    return null;
  }

  // Get online count
  getOnlineCount() {
    return this.onlineUsers.size;
  }

  // Get room users
  getRoomUsers(roomId) {
    if (this.roomUsers.has(roomId)) {
      return Array.from(this.roomUsers.get(roomId));
    }
    return [];
  }

  // Get user rooms
  getUserRooms(userId) {
    const rooms = [];
    for (const [roomId, users] of this.roomUsers.entries()) {
      if (users.has(userId)) {
        rooms.push(roomId);
      }
    }
    return rooms;
  }

  // Clean up inactive connections
  cleanupConnections() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [userId, data] of this.onlineUsers.entries()) {
      if (now - data.lastActivity.getTime() > timeout) {
        // Disconnect inactive user
        const socket = this.userSockets.get(userId);
        if (socket) {
          socket.disconnect(true);
        }
        this.onlineUsers.delete(userId);
        this.userSockets.delete(userId);
        this.emitUserStatus(userId, 'offline');
        logger.info(`Cleaned up inactive connection for user ${userId}`);
      }
    }
  }

  // Start cleanup interval
  startCleanup() {
    setInterval(() => {
      this.cleanupConnections();
    }, 60 * 1000); // Every minute
  }

  // Get statistics
  getStats() {
    return {
      onlineUsers: this.onlineUsers.size,
      userSockets: this.userSockets.size,
      rooms: this.roomUsers.size,
      activeRooms: Array.from(this.roomUsers.keys())
    };
  }

  // Shutdown
  shutdown() {
    logger.info('Shutting down Socket.IO server...');
    
    // Disconnect all clients
    for (const [userId, socket] of this.userSockets.entries()) {
      socket.disconnect(true);
    }
    
    // Clear maps
    this.onlineUsers.clear();
    this.userSockets.clear();
    this.roomUsers.clear();
    
    // Close server
    this.io.close(() => {
      logger.info('Socket.IO server shutdown complete');
    });
  }
}

// Create singleton instance
let socketServer = null;

function initializeSocket(server) {
  if (!socketServer) {
    socketServer = new SocketServer(server);
    socketServer.startCleanup();
  }
  return socketServer;
}

function getSocketInstance() {
  return socketServer;
}

module.exports = {
  initializeSocket,
  getSocketInstance
};
