// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// HOSPITAL INFORMATION
// ============================================
const hospitalInfo = {
  name: 'Gimbie Adventist General Hospital',
  website: 'https://gimbiehospital.com',
  email: 'info@gimbiehospital.com',
  phone: '+251-123-456789',
  version: '1.0.0'
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
      banks: '/api/banks'
    },
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
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    version: hospitalInfo.version
  });
});

// ============================================
// BANKS INFORMATION
// ============================================
app.get('/api/banks', (req, res) => {
  const banks = [
    {
      id: 'cbe',
      name: 'Commercial Bank of Ethiopia',
      shortName: 'CBE',
      supportedMethods: ['card', 'mobile', 'internet-banking'],
      description: 'Pay with CBE Internet Banking, CBE Birr or CBE Card'
    },
    {
      id: 'telebirr',
      name: 'Telebirr',
      shortName: 'Telebirr',
      supportedMethods: ['mobile'],
      description: 'Pay with Telebirr mobile money'
    },
    {
      id: 'awash',
      name: 'Awash Bank',
      shortName: 'Awash',
      supportedMethods: ['card', 'internet-banking'],
      description: 'Pay with Awash Bank Internet Banking or Card'
    },
    {
      id: 'coop',
      name: 'Cooperative Bank of Oromia',
      shortName: 'Coop',
      supportedMethods: ['card', 'internet-banking'],
      description: 'Pay with Coop Bank Internet Banking or Card'
    }
  ];

  res.json({
    success: true,
    data: banks,
    defaultCurrency: 'ETB',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// TEST PAYMENT ENDPOINT
// ============================================
app.post('/api/test/payment', (req, res) => {
  const { bank = 'cbe', amount = 100, currency = 'ETB' } = req.body;
  
  const banks = {
    cbe: { name: 'Commercial Bank of Ethiopia', shortName: 'CBE' },
    telebirr: { name: 'Telebirr', shortName: 'Telebirr' },
    awash: { name: 'Awash Bank', shortName: 'Awash' },
    coop: { name: 'Cooperative Bank of Oromia', shortName: 'Coop' }
  };

  const bankInfo = banks[bank];
  if (!bankInfo) {
    return res.status(400).json({
      success: false,
      message: `Bank ${bank} not found`,
      availableBanks: Object.keys(banks)
    });
  }

  res.json({
    success: true,
    message: `Test payment initiated with ${bankInfo.name}`,
    data: {
      bank: bankInfo.shortName,
      amount,
      currency,
      transactionId: `TEST-${Date.now()}`,
      status: 'pending',
      redirectUrl: `https://${bank}.com/pay/test-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  });
});

// ============================================
// API V1 ROUTES
// ============================================
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Gimbie Adventist General Hospital API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      emergency: '/api/v1/emergency',
      appointments: '/api/v1/appointments',
      payments: '/api/v1/payments',
      banks: '/api/banks'
    }
  });
});

// ============================================
// AUTH ROUTES (Simple for testing)
// ============================================
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'admin',
        hospital: 'Gimbie Adventist General Hospital'
      },
      token: 'demo-jwt-token-' + Date.now(),
      expiresIn: '7d'
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
});

module.exports = app;
