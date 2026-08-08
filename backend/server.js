// server.js
const app = require('./app');
const http = require('http');
const config = require('./config/server');
const database = require('./config/database');
const { logger } = require('./utils/logger');

const server = http.createServer(app);

let socketServer = null;
try {
  const { initializeSocket } = require('./sockets');
  socketServer = initializeSocket(server);
  logger.info('🔌 Socket.IO initialized successfully');
} catch (error) {
  logger.warn('⚠️ Socket.IO not initialized:', error.message);
}

database.connect();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║    🏥 ${config.hospital?.name?.padEnd(42) || 'Gimbie Adventist General Hospital'.padEnd(42)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║    🚀 Server      : ${HOST}:${PORT}`);
  console.log(`║    📡 Environment : ${config.env}`);
  console.log(`║    🔗 API URL     : http://${HOST}:${PORT}/api/v1`);
  console.log(`║    📊 Health      : http://${HOST}:${PORT}/health`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const dbStatus = database.getConnectionStatus();
  logger.info(`💾 Database: ${dbStatus.state} (${dbStatus.name})`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error closing server:', err);
      process.exit(1);
    }

    logger.info('HTTP server closed');
    await database.disconnect();

    if (socketServer && socketServer.shutdown) {
      socketServer.shutdown();
    }

    logger.info(`✅ ${config.hospital?.name || 'Gimbie Adventist General Hospital'} shutdown complete`);
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('⚠️ Forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = { server, socketServer };
