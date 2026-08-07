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
const paymentConfig = require('./config/payment');

// ============================================
// IMPORT MIDDLEWARE & UTILITIES
// ============================================
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

// ============================================
// IMPORT ROUTES
// ============================================
const routes = require('./routes/index');

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
  'backups',
  'database'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ============================================
// SECURITY MIDDLEWARE (Helmet)
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
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
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ============================================
// COMPRESSION
// ============================================
app.use(compression({
  level: 6,
  threshold: 100 * 1024, // 100KB
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
// RATE LIMITING - General API
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || 
           req.path === '/' ||
           req.path.startsWith('/api/docs') ||
           req.path.startsWith('/api/v1/health');
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  }
});

app.use('/api', limiter);

// ============================================
// RATE LIMITING - Authentication (Stricter)
// ============================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip
});

app.use('/api/v1/auth', authLimiter);

// ============================================
// RATE LIMITING - Payment (Stricter)
// ============================================
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.ip
});

app.use('/api/v1/payments', paymentLimiter);

// ============================================
// LOGGING
// ============================================
// Morgan HTTP logger
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req) => req.path === '/health'
}));

// Custom request logger
app.use(requestLogger);

// ============================================
// SESSION CONFIGURATION (Optional - Uncomment if needed)
// ============================================
/*
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET || 'gimbie-hospital-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: config.db.uri,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'gimbie.sid'
}));
*/

// ============================================
// HOSPITAL INFORMATION
// ============================================
const hospitalInfo = {
  name: config.hospital.name || 'Gimbie Adventist General Hospital',
  website: config.hospital.website || 'https://gimbiehospital.com',
  email: config.hospital.email || 'info@gimbiehospital.com',
  phone: config.hospital.phone || '+251-123-456789',
  location: 'Gimbie, Ethiopia',
  version: require('./package.json').version,
  environment: config.env,
  banks: paymentConfig.getEnabledBanks ? paymentConfig.getEnabledBanks().map(b => ({
    name: b.name,
    shortName: b.shortName,
    supportedMethods: b.supportedMethods
  })) : []
};

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: `Welcome to ${hospitalInfo.name}`,
    hospital: hospitalInfo,
    endpoints: {
      api: '/api/v1',
      health: '/health',
      banks: '/api/banks',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Basic health check
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
    services: {
      database: 'connected',
      paymentBanks: hospitalInfo.banks.map(b => b.shortName)
    },
    version: hospitalInfo.version
  };

  res.json(healthStatus);
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const database = require('./config/database');
  const dbStatus = database.getConnectionStatus();

  const detailedHealth = {
    success: true,
    status: 'healthy',
    hospital: hospitalInfo.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    database: dbStatus,
    paymentBanks: hospitalInfo.banks,
    environment: config.env,
    version: hospitalInfo.version
  };

  res.json(detailedHealth);
});

// ============================================
// BANKS INFORMATION ENDPOINT
// ============================================
app.get('/api/banks', (req, res) => {
  const banks = paymentConfig.getEnabledBanks ? paymentConfig.getEnabledBanks() : [];
  
  res.json({
    success: true,
    data: banks.map(bank => ({
      id: bank.id || bank.shortName.toLowerCase(),
      name: bank.name,
      shortName: bank.shortName,
      logo: bank.logo || `/images/banks/${bank.shortName.toLowerCase()}.png`,
      supportedMethods: bank.supportedMethods || [],
      description: bank.description || `Pay with ${bank.name}`
    })),
    defaultCurrency: paymentConfig.defaultCurrency || 'ETB',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TEST PAYMENT ENDPOINT (Development Only)
// ============================================
if (config.env !== 'production') {
  app.post('/api/test/payment', (req, res) => {
    const { bank = 'cbe', amount = 100, currency = 'ETB' } = req.body;
    
    const bankConfig = paymentConfig.getBank ? paymentConfig.getBank(bank) : null;
    
    if (!bankConfig || !bankConfig.enabled) {
      return res.status(400).json({
        success: false,
        message: `Bank ${bank} is not available`,
        availableBanks: paymentConfig.getEnabledBanks ? 
          paymentConfig.getEnabledBanks().map(b => b.shortName) : 
          ['CBE', 'Telebirr', 'Awash', 'Coop']
      });
    }

    res.json({
      success: true,
      message: `Test payment initiated with ${bankConfig.name}`,
      data: {
        bank: bankConfig.shortName,
        amount,
        currency,
        transactionId: `TEST-${Date.now()}`,
        status: 'pending',
        redirectUrl: `https://${bank}.com/pay/test-${Date.now()}`,
        qrCode: bank === 'telebirr' ? `telebirr://pay?txn=TEST-${Date.now()}` : null,
        timestamp: new Date().toISOString()
      }
    });
  });
}

// ============================================
// API DOCUMENTATION
// ============================================
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    baseUrl: '/api/v1',
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        forgotPassword: 'POST /auth/forgot-password',
        resetPassword: 'POST /auth/reset-password'
      },
      patients: {
        list: 'GET /patients',
        create: 'POST /patients',
        get: 'GET /patients/:id',
        update: 'PUT /patients/:id',
        delete: 'DELETE /patients/:id'
      },
      doctors: {
        list: 'GET /doctors',
        create: 'POST /doctors',
        get: 'GET /doctors/:id',
        update: 'PUT /doctors/:id',
        delete: 'DELETE /doctors/:id'
      },
      emergency: {
        list: 'GET /emergency',
        create: 'POST /emergency',
        get: 'GET /emergency/:id',
        update: 'PUT /emergency/:id',
        updateStatus: 'PUT /emergency/:id/status'
      },
      appointments: {
        list: 'GET /appointments',
        create: 'POST /appointments',
        get: 'GET /appointments/:id',
        update: 'PUT /appointments/:id',
        cancel: 'DELETE /appointments/:id'
      },
      payments: {
        banks: 'GET /payments/banks',
        initiate: 'POST /payments/initiate',
        status: 'GET /payments/status/:transactionId',
        refund: 'POST /payments/refund'
      },
      ambulance: {
        list: 'GET /ambulance',
        create: 'POST /ambulance',
        get: 'GET /ambulance/:id',
        update: 'PUT /ambulance/:id',
        assign: 'POST /ambulance/:id/assign'
      },
      chat: {
        send: 'POST /chat/send',
        history: 'GET /chat/:chatId/history',
        create: 'POST /chat/create'
      },
      notifications: {
        list: 'GET /notifications',
        read: 'PUT /notifications/:id/read',
        readAll: 'PUT /notifications/read-all'
      },
      reports: {
        generate: 'POST /reports/generate',
        list: 'GET /reports',
        download: 'GET /reports/:id/download'
      },
      analytics: {
        dashboard: 'GET /analytics/dashboard',
        metrics: 'GET /analytics/metrics',
        insights: 'GET /analytics/insights'
      },
      settings: {
        get: 'GET /settings',
        update: 'PUT /settings'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API V1 ROUTES
// ============================================
app.use('/api/v1', routes);

// ============================================
// API V1 ALTERNATIVE (Backward Compatibility)
// ============================================
app.use('/api', routes);

// ============================================
// 404 HANDLER
// ============================================
app.use(notFoundHandler);

// ============================================
// ERROR HANDLER (Must be last)
// ============================================
app.use(errorHandler.handle);

// ============================================
// EXPORT APP
// ============================================
module.exports = app;
