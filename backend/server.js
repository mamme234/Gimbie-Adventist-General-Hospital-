// server.js
const app = require('./app');
const http = require('http');
const config = require('./config/server');

// Create HTTP server
const server = http.createServer(app);

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit, let the server continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit, let the server continue
});

server.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log(`🏥 ${config.hospital.name || 'Gimbie Adventist General Hospital'}`);
  console.log('========================================');
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${config.env}`);
  console.log(`🔗 API URL: http://${HOST}:${PORT}/api/v1`);
  console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
  console.log('========================================');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
