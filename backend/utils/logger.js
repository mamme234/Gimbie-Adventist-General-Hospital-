// sockets/index.js
const { logger } = require('../utils/logger');
const { jwt } = require('../utils/jwt');

class SocketServer {
  constructor(server) {
    this.io = null;
    this.onlineUsers = new Map();
    this.userSockets = new Map();
    this.initialize(server);
  }

  initialize(server) {
    try {
      const socketIO = require('socket.io');
      
      this.io = socketIO(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Authentication middleware
      this.io.use((socket, next) => {
        try {
          const token = socket.handshake.auth.token || 
                        socket.handshake.headers.authorization?.split(' ')[1];
          
          if (!token) {
            return next(new Error('Authentication required'));
          }

          // Verify token (simplified)
          const decoded = jwt.verify(token);
          socket.userId = decoded.id;
          socket.user = decoded;
          next();
        } catch (error) {
          next(new Error('Invalid token'));
        }
      });

      this.io.on('connection', (socket) => {
        this.handleConnection(socket);
      });

      this.io.on('error', (error) => {
        logger.error('Socket.IO error:', error);
      });

      logger.info('Socket.IO initialized successfully');
    } catch (error) {
      logger.error('Socket.IO initialization error:', error);
    }
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user
    this.onlineUsers.set(userId, {
      socketId: socket.id,
      connectedAt: new Date()
    });
    this.userSockets.set(userId, socket);

    logger.info(`User ${userId} connected`);

    // Join user room
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      this.onlineUsers.delete(userId);
      this.userSockets.delete(userId);
      logger.info(`User ${userId} disconnected`);
    });

    // Handle messages
    socket.on('message', (data) => {
      this.handleMessage(socket, data);
    });

    // Handle typing
    socket.on('typing', (data) => {
      socket.to(`user:${data.targetUserId}`).emit('typing', {
        userId,
        isTyping: data.isTyping
      });
    });
  }

  handleMessage(socket, data) {
    try {
      const { targetUserId, message, type } = data;
      
      // Send to target user
      this.sendToUser(targetUserId, 'message', {
        from: socket.userId,
        message,
        type: type || 'text',
        timestamp: new Date()
      });

      // Send confirmation to sender
      socket.emit('message_sent', {
        to: targetUserId,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Message handling error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

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

  sendToRoom(roomId, event, data) {
    try {
      if (this.io) {
        this.io.to(roomId).emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Send to room error:', error);
      return false;
    }
  }

  broadcast(event, data) {
    try {
      if (this.io) {
        this.io.emit(event, data);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Broadcast error:', error);
      return false;
    }
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  shutdown() {
    if (this.io) {
      this.io.close();
    }
    this.onlineUsers.clear();
    this.userSockets.clear();
    logger.info('Socket.IO shutdown complete');
  }
}

let socketServer = null;

function initializeSocket(server) {
  if (!socketServer) {
    socketServer = new SocketServer(server);
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
