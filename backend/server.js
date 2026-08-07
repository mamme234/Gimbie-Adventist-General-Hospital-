// server.js
const app = require('./app');
const http = require('http');
const { logger } = require('./utils/logger');
const config = require('./config/server');
const database = require('./config/database');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
let socketServer = null;
try {
  const { initializeSocket } = require('./sockets');
  socketServer = initializeSocket(server);
  logger.info('🔌 Socket.IO initialized successfully');
} catch (error) {
  logger.warn('⚠️ Socket.IO not initialized:', error.message);
}

// Connect to database
database.connect();

// Start server
const PORT = process.env.PORT || config.port || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║    🏥 ${config.hospital.name.padEnd(42)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║    🚀 Server      : ${HOST}:${PORT}`);
  console.log(`║    📡 Environment : ${config.env}`);
  console.log(`║    🔗 API URL     : http://${HOST}:${PORT}/api/v1`);
  console.log(`║    📊 Health      : http://${HOST}:${PORT}/health`);
  console.log(`║    💳 Banks       : CBE, Telebirr, Awash, Coop`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Log database status
  const dbStatus = database.getConnectionStatus();
  logger.info(`💾 Database: ${dbStatus.state} (${dbStatus.name})`);
  
  // Log available routes
  logger.info('📋 Available Routes:');
  logger.info('   POST /api/v1/auth/login     - Login');
  logger.info('   POST /api/v1/auth/register  - Register');
  logger.info('   GET  /api/v1/patients       - Get patients');
  logger.info('   POST /api/v1/emergency      - Create emergency');
  logger.info('   GET  /api/v1/ambulance      - Get ambulances');
  logger.info('   GET  /api/v1/payments       - Get payments');
  logger.info('   GET  /api/v1/banks          - Get available banks');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  // Stop accepting new connections
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
    
    logger.info(`✅ ${config.hospital.name} shutdown complete`);
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise);
  logger.error('Reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Export for testing
module.exports = { server, socketServer };
