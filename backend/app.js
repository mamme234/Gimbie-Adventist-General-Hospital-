// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config/server');
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');
const routes = require('./routes');

const app = express();

// Create directories
const directories = ['uploads', 'uploads/patients', 'uploads/doctors', 'uploads/staff', 'uploads/reports', 'logs', 'backups'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: config.corsOrigins || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => req.path === '/health' || req.path === '/'
});
app.use('/api', limiter);

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) }, skip: (req) => req.path === '/health' }));
app.use(requestLogger);

// Health check
const hospitalInfo = {
  name: config.hospital?.name || 'Gimbie Adventist General Hospital',
  version: require('./package.json').version,
  environment: config.env,
  ai: { enabled: config.gemini.enabled }
};

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `Welcome to ${hospitalInfo.name}`,
    hospital: hospitalInfo,
    endpoints: { api: '/api/v1', health: '/health' },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    hospital: hospitalInfo.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    environment: config.env,
    ai: { enabled: config.gemini.enabled }
  });
});

// API routes
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler.handle);

module.exports = app;
