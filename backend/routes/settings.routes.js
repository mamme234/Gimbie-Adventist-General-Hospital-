/**
 * ============================================
 * SETTINGS.ROUTES.JS - Settings Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // General Settings
  getGeneralSettings,
  updateGeneralSettings,
  getHospitalInfo,
  updateHospitalInfo,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  getSystemStatus,
  getSystemInfo,
  
  // User Settings
  getUserSettings,
  updateUserSettings,
  getUserPreferences,
  updateUserPreferences,
  
  // Security Settings
  getSecuritySettings,
  updateSecuritySettings,
  getSecurityLogs,
  
  // Email Settings
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  
  // SMS Settings
  getSmsSettings,
  updateSmsSettings,
  testSmsSettings,
  
  // Payment Settings
  getPaymentSettings,
  updatePaymentSettings,
  testPaymentSettings,
  
  // Notification Settings
  getNotificationSettings,
  updateNotificationSettings,
  
  // Integration Settings
  getIntegrationSettings,
  updateIntegrationSettings,
  testIntegration,
  
  // Backup Settings
  getBackupSettings,
  updateBackupSettings,
  createBackup,
  restoreBackup,
  
  // Audit Settings
  getAuditSettings,
  updateAuditSettings,
  getAuditLogs,
  
  // Maintenance Settings
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenance,
  
  // Theme Settings
  getThemeSettings,
  updateThemeSettings,
  
  // Language Settings
  getLanguageSettings,
  updateLanguageSettings,
  
  // Reset Settings
  resetSettings,
  getDefaultSettings,
} = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const generalSettingsValidation = [
  body('hospitalName').optional().notEmpty().withMessage('Hospital name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('website').optional().isURL().withMessage('Invalid URL'),
  body('timezone').optional().isString(),
  body('currency').optional().isString(),
];

const systemSettingsValidation = [
  body('maintenanceMode').optional().isBoolean(),
  body('debugMode').optional().isBoolean(),
  body('registrationEnabled').optional().isBoolean(),
  body('sessionTimeout').optional().isNumeric(),
  body('maxLoginAttempts').optional().isNumeric(),
];

const securitySettingsValidation = [
  body('twoFactorAuth').optional().isBoolean(),
  body('passwordPolicy').optional().isObject(),
  body('sessionTimeout').optional().isNumeric(),
  body('ipWhitelist').optional().isArray(),
  body('rateLimiting').optional().isObject(),
];

const emailSettingsValidation = [
  body('host').optional().notEmpty().withMessage('SMTP host is required'),
  body('port').optional().isNumeric().withMessage('Port must be a number'),
  body('secure').optional().isBoolean(),
  body('auth.user').optional().notEmpty().withMessage('SMTP username is required'),
  body('auth.pass').optional().notEmpty().withMessage('SMTP password is required'),
  body('from.email').optional().isEmail().withMessage('Please provide a valid email'),
  body('from.name').optional().notEmpty().withMessage('From name is required'),
];

const paymentSettingsValidation = [
  body('chapa.secretKey').optional().isString(),
  body('chapa.publicKey').optional().isString(),
  body('stripe.secretKey').optional().isString(),
  body('stripe.publicKey').optional().isString(),
  body('paypal.clientId').optional().isString(),
  body('paypal.secret').optional().isString(),
  body('defaultCurrency').optional().isString(),
  body('defaultGateway').optional().isString(),
];

const notificationSettingsValidation = [
  body('email.enabled').optional().isBoolean(),
  body('email.templates').optional().isObject(),
  body('sms.enabled').optional().isBoolean(),
  body('sms.provider').optional().isString(),
  body('push.enabled').optional().isBoolean(),
  body('inApp.enabled').optional().isBoolean(),
];

const backupSettingsValidation = [
  body('frequency').optional().isString(),
  body('time').optional().isString(),
  body('retention').optional().isNumeric(),
  body('location').optional().isString(),
  body('includeDatabase').optional().isBoolean(),
  body('includeFiles').optional().isBoolean(),
];

const maintenanceSettingsValidation = [
  body('enabled').optional().isBoolean(),
  body('message').optional().isString(),
  body('allowIPs').optional
