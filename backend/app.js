// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ============================================
// IMPORT CONFIGURATIONS
// ============================================
const config = require('./config/server');

// ============================================
// IMPORT MIDDLEWARE & UTILITIES
// ============================================
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

// ============================================
// IMPORT ROUTES
// ============================================
const routes = require('./routes');

// ============================================
// INITIALIZE EXPRESS
// ============================================
const app = express();

// ============================================
// CREATE REQUIRED DIRECTORIES
// ============================================
const directories = [
  'uploads',
  'uploads/patients',
  'uploads/doctors',
  'uploads/staff',
  'uploads/reports',
  'uploads/laboratory',
  'uploads/radiology',
  'uploads/gallery',
  'uploads/documents',
  'logs',
  'backups'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// ============================================
// CORS CONFIGURATION
// ============================================
const corsOptions = {
  origin: config.corsOrigins || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'Accept',
    'Origin',
    'User-Agent',
    'Cache-Control'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400
};

app.use(cors(corsOptions));

// ============================================
// COMPRESSION
// ============================================
app.use(compression({
  level: 6,
  threshold: 100 * 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// ============================================
// REQUEST PARSING
// ============================================
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(express.text({ limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/docs', express.static(path.join(__dirname, 'public/docs')));

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' ||
           req.path === '/' ||
           req.path.startsWith('/api/docs') ||
           req.path.startsWith('/api/v1/health');
  }
});

app.use('/api', limiter);

// Stricter rate limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

app.use('/api/v1/auth', authLimiter);

// ============================================
// LOGGING
// ============================================
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req) => req.path === '/health'
}));

app.use(requestLogger);

// ============================================
// HOSPITAL INFORMATION
// ============================================
const hospitalInfo = {
  name: config.hospital?.name || 'Gimbie Adventist General Hospital',
  website: config.hospital?.website || 'https://gimbiehospital.com',
  email: config.hospital?.email || 'info@gimbiehospital.com',
  phone: config.hospital?.phone || '+251-123-456789',
  location: 'Gimbie, Ethiopia',
  version: require('./package.json').version,
  environment: config.env
};

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `Welcome to ${hospitalInfo.name}`,
    hospital: hospitalInfo,
    endpoints: {
      api: '/api/v1',
      health: '/health',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const healthStatus = {
    success: true,
    status: 'healthy',
    hospital: hospitalInfo.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    environment: config.env,
    version: hospitalInfo.version
  };

  res.json(healthStatus);
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/v1', routes);
app.use('/api', routes);

// ============================================
// 404 HANDLER
// ============================================
app.use(notFoundHandler);

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler.handle);

// ============================================
// EXPORT APP
// ============================================
module.exports = app;
