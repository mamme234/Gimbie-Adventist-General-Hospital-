// config/server.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Database
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbie_hospital',
    name: process.env.MONGODB_DB || 'gimbie_hospital'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'gimbie-hospital-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'gimbie-hospital-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },

  // Hospital Info
  hospital: {
    name: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    website: process.env.HOSPITAL_WEBSITE || 'https://gimbiehospital.com',
    email: process.env.HOSPITAL_EMAIL || 'info@gimbiehospital.com',
    phone: process.env.HOSPITAL_PHONE || '+251-123-456789'
  },

  // CORS
  corsOrigins: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['*'],

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // Payment
  payment: {
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'ETB',
    timeout: parseInt(process.env.PAYMENT_TIMEOUT, 10) || 300
  }
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

if (process.env.NODE_ENV === 'production') {
  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach((varName) => console.error(`  - ${varName}`));
    process.exit(1);
  }
}

module.exports = config;
