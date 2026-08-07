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
  body('allowIPs').optional().isArray(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
];

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// General Settings
router.get('/general', getGeneralSettings);
router.put('/general', generalSettingsValidation, updateGeneralSettings);
router.get('/hospital', getHospitalInfo);
router.put('/hospital', generalSettingsValidation, updateHospitalInfo);

// System Settings
router.get('/system', getSystemSettings);
router.put('/system', systemSettingsValidation, updateSystemSettings);
router.get('/system/status', getSystemStatus);
router.get('/system/info', getSystemInfo);

// User Settings
router.get('/user', getUserSettings);
router.put('/user', updateUserSettings);
router.get('/user/preferences', getUserPreferences);
router.put('/user/preferences', updateUserPreferences);

// Security Settings
router.get('/security', getSecuritySettings);
router.put('/security', securitySettingsValidation, updateSecuritySettings);
router.get('/security/logs', getSecurityLogs);

// Email Settings
router.get('/email', getEmailSettings);
router.put('/email', emailSettingsValidation, updateEmailSettings);
router.post('/email/test', testEmailSettings);

// SMS Settings
router.get('/sms', getSmsSettings);
router.put('/sms', updateSmsSettings);
router.post('/sms/test', testSmsSettings);

// Payment Settings
router.get('/payment', getPaymentSettings);
router.put('/payment', paymentSettingsValidation, updatePaymentSettings);
router.post('/payment/test', testPaymentSettings);

// Notification Settings
router.get('/notification', getNotificationSettings);
router.put('/notification', notificationSettingsValidation, updateNotificationSettings);

// Integration Settings
router.get('/integration', getIntegrationSettings);
router.put('/integration', updateIntegrationSettings);
router.post('/integration/test', testIntegration);

// Backup Settings
router.get('/backup', getBackupSettings);
router.put('/backup', backupSettingsValidation, updateBackupSettings);
router.post('/backup/create', createBackup);
router.post('/backup/restore', restoreBackup);

// Audit Settings
router.get('/audit', getAuditSettings);
router.put('/audit', updateAuditSettings);
router.get('/audit/logs', getAuditLogs);

// Maintenance Settings
router.get('/maintenance', getMaintenanceSettings);
router.put('/maintenance', maintenanceSettingsValidation, updateMaintenanceSettings);
router.post('/maintenance/toggle', toggleMaintenance);

// Theme Settings
router.get('/theme', getThemeSettings);
router.put('/theme', updateThemeSettings);

// Language Settings
router.get('/language', getLanguageSettings);
router.put('/language', updateLanguageSettings);

// Reset Settings
router.post('/reset', resetSettings);
router.get('/default', getDefaultSettings);

module.exports = router;
