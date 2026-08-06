/**
 * ============================================
 * SERVER.JS - Server Configuration
 * ============================================
 */

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Server configuration object
 */
const serverConfig = {
  // Server settings
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // CORS options
  corsOptions: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },

  // Rate limiting
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Helmet security options
  helmetOptions: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  },

  // Morgan logging options
  morganOptions: {
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    stream: {
      write: (message) => {
        // Will be handled by logger
        console.log(message.trim());
      }
    }
  },

  // File upload paths
  uploadPaths: {
    profileImages: path.join(__dirname, '../uploads/profiles'),
    medicalRecords: path.join(__dirname, '../uploads/medical'),
    prescriptions: path.join(__dirname, '../uploads/prescriptions'),
    labResults: path.join(__dirname, '../uploads/lab-results'),
    radiologyImages: path.join(__dirname, '../uploads/radiology'),
    temp: path.join(__dirname, '../uploads/temp'),
  },

  // API versioning
  apiVersion: 'v1',
  apiPrefix: '/api',
};

module.exports = serverConfig;
