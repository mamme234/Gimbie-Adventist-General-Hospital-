// config/server.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbie_hospital',
    name: process.env.MONGODB_DB || 'gimbie_hospital'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'gimbie-hospital-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'gimbie-hospital-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@gimbiehospital.com',
    enabled: process.env.EMAIL_ENABLED === 'true'
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled: process.env.SMS_ENABLED === 'true'
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    enabled: process.env.AI_ENABLED === 'true'
  },

  hospital: {
    name: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    website: process.env.HOSPITAL_WEBSITE || 'https://gimbiehospital.com',
    email: process.env.HOSPITAL_EMAIL || 'info@gimbiehospital.com',
    phone: process.env.HOSPITAL_PHONE || '+251-123-456789'
  },

  corsOrigins: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',') : 
    ['*'],

  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    maxFiles: parseInt(process.env.MAX_FILES) || 10,
    path: process.env.UPLOAD_PATH || './uploads'
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key'
  }
};

module.exports = config;
