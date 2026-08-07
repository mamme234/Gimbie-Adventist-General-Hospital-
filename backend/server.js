// server.js
const app = require('./app');
const http = require('http');
const { initializeSocket } = require('./sockets');
const { logger } = require('./utils/logger');
const database = require('./config/database');
const config = require('./config/server');
const backupService = require('./services/backup.service');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const socketServer = initializeSocket(server);

// Connect to database
database.connect();

// Start server
server.listen(config.port, config.host, () => {
  logger.info(`🚀 Server running on ${config.host}:${config.port}`);
  logger.info(`📡 Environment: ${config.env}`);
  logger.info(`🔗 API URL: http://${config.host}:${config.port}/api/v1`);
  logger.info(`🔌 WebSocket: ws://${config.host}:${config.port}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('Error closing server:', err);
      process.exit(1);
    }
    
    logger.info('HTTP server closed');
    
    // Close database connection
    await database.disconnect();
    
    // Shutdown Socket.IO
    socketServer.shutdown();
    
    logger.info('All connections closed. Exiting process.');
    process.exit(0);
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = { server, socketServer };
