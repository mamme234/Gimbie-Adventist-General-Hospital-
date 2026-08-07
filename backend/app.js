// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version,
    hospital: 'Gimbie Adventist General Hospital'
  });
});

// API routes - Basic routes for testing
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Gimbie Adventist General Hospital API',
    version: '1.0.0',
    hospital: 'Gimbie Adventist General Hospital',
    endpoints: {
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      emergency: '/api/v1/emergency',
      appointments: '/api/v1/appointments'
    }
  });
});

// Simple auth route for testing
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Demo login - accept any valid format
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'admin'
      },
      token: 'demo-jwt-token-' + Date.now()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

module.exports = app;
