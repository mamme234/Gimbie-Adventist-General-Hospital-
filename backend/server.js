// server.js
const app = require('./app');
const http = require('http');
const { logger } = require('./utils/logger');
const config = require('./config/server');
const database = require('./config/database');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO (if needed)
let socketServer = null;
try {
  const { initializeSocket } = require('./sockets');
  socketServer = initializeSocket(server);
  logger.info('🔌 Socket.IO initialized');
} catch (error) {
  logger.warn('Socket.IO not initialized:', error.message);
}

// Connect to database
database.connect();

// Start server
const PORT = process.env.PORT || config.port || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n========================================');
  console.log(`🏥 ${config.hospital.name || 'Gimbie Adventist General Hospital'}`);
  console.log('========================================');
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${config.env}`);
  console.log(`🔗 API URL: http://${HOST}:${PORT}/api/v1`);
  console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`💳 Payment Banks: ${require('./config/payment').getEnabledBanks().map(b => b.shortName).join(', ')}`);
  console.log('========================================\n');
  
  // Log database status
  const dbStatus = database.getConnectionStatus();
  logger.info(`💾 Database: ${dbStatus.state} (${dbStatus.name})`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('Error closing server:', err);
      process.exit(1);
    }
    
    logger.info('HTTP server closed');
    
    // Close database connection
    await database.disconnect();
    
    // Shutdown Socket.IO
    if (socketServer && socketServer.shutdown) {
      socketServer.shutdown();
    }
    
    logger.info(`🏥 ${config.hospital.name || 'Gimbie Adventist General Hospital'} server shutdown complete`);
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
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

// Export for testing
module.exports = { server, socketServer };
