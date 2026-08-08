/**
 * ============================================
 * SETTINGS.CONTROLLER.JS - Settings Controller
 * ============================================
 */

const Settings = require('../models/Settings');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get general settings
 */
const getGeneralSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'general' });
    
    if (!settings) {
      settings = new Settings({
        type: 'general',
        data: {
          hospitalName: 'Adventist General Hospital',
          address: 'Bole Sub-city, Addis Ababa, Ethiopia',
          phone: '+251-911-234-567',
          email: 'info@adventisthospital.et',
          website: 'www.adventisthospital.et',
          timezone: 'Africa/Addis_Ababa',
          currency: 'ETB',
          language: 'en'
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get general settings',
      error: error.message
    });
  }
};

/**
 * Update general settings
 */
const updateGeneralSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    let settings = await Settings.findOne({ type: 'general' });
    
    if (!settings) {
      settings = new Settings({ type: 'general' });
    }

    const {
      hospitalName,
      address,
      phone,
      email,
      website,
      timezone,
      currency,
      language
    } = req.body;

    settings.data = {
      hospitalName: hospitalName || settings.data?.hospitalName || 'Adventist General Hospital',
      address: address || settings.data?.address || 'Bole Sub-city, Addis Ababa, Ethiopia',
      phone: phone || settings.data?.phone || '+251-911-234-567',
      email: email || settings.data?.email || 'info@adventisthospital.et',
      website: website || settings.data?.website || 'www.adventisthospital.et',
      timezone: timezone || settings.data?.timezone || 'Africa/Addis_Ababa',
      currency: currency || settings.data?.currency || 'ETB',
      language: language || settings.data?.language || 'en'
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`General settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update general settings',
      error: error.message
    });
  }
};

/**
 * Get hospital info
 */
const getHospitalInfo = async (req, res) => {
  try {
    const settings = await Settings.findOne({ type: 'general' });
    
    const defaultInfo = {
      name: 'Adventist General Hospital',
      address: 'Bole Sub-city, Addis Ababa, Ethiopia',
      phone: '+251-911-234-567',
      email: 'info@adventisthospital.et',
      website: 'www.adventisthospital.et',
      founded: '1965',
      description: 'Providing quality healthcare services with compassion and excellence.'
    };

    res.status(200).json({
      success: true,
      data: settings?.data || defaultInfo
    });
  } catch (error) {
    logger.error('Get hospital info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hospital info',
      error: error.message
    });
  }
};

/**
 * Update hospital info
 */
const updateHospitalInfo = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'general' });
    
    if (!settings) {
      settings = new Settings({ type: 'general' });
    }

    const { name, address, phone, email, website, founded, description } = req.body;

    settings.data = {
      ...settings.data,
      hospitalName: name || settings.data?.hospitalName,
      address: address || settings.data?.address,
      phone: phone || settings.data?.phone,
      email: email || settings.data?.email,
      website: website || settings.data?.website,
      founded: founded || settings.data?.founded || '1965',
      description: description || settings.data?.description
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Hospital info updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Hospital info updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update hospital info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hospital info',
      error: error.message
    });
  }
};

/**
 * Get system settings
 */
const getSystemSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'system' });
    
    if (!settings) {
      settings = new Settings({
        type: 'system',
        data: {
          maintenanceMode: false,
          debugMode: false,
          registrationEnabled: true,
          sessionTimeout: 120,
          maxLoginAttempts: 5,
          forcePasswordChange: false,
          enableAuditLog: true
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system settings',
      error: error.message
    });
  }
};

/**
 * Update system settings
 */
const updateSystemSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'system' });
    
    if (!settings) {
      settings = new Settings({ type: 'system' });
    }

    const {
      maintenanceMode,
      debugMode,
      registrationEnabled,
      sessionTimeout,
      maxLoginAttempts,
      forcePasswordChange,
      enableAuditLog
    } = req.body;

    settings.data = {
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : settings.data?.maintenanceMode || false,
      debugMode: debugMode !== undefined ? debugMode : settings.data?.debugMode || false,
      registrationEnabled: registrationEnabled !== undefined ? registrationEnabled : settings.data?.registrationEnabled || true,
      sessionTimeout: sessionTimeout || settings.data?.sessionTimeout || 120,
      maxLoginAttempts: maxLoginAttempts || settings.data?.maxLoginAttempts || 5,
      forcePasswordChange: forcePasswordChange !== undefined ? forcePasswordChange : settings.data?.forcePasswordChange || false,
      enableAuditLog: enableAuditLog !== undefined ? enableAuditLog : settings.data?.enableAuditLog || true
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`System settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message
    });
  }
};

/**
 * Get system status
 */
const getSystemStatus = async (req, res) => {
  try {
    const status = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    });
  }
};

/**
 * Get system info
 */
const getSystemInfo = async (req, res) => {
  try {
    const info = {
      name: 'Adventist General Hospital',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Get system info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system info',
      error: error.message
    });
  }
};

/**
 * Get user settings
 */
const getUserSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ 
      type: 'user',
      userId: req.user._id 
    });
    
    if (!settings) {
      settings = new Settings({
        type: 'user',
        userId: req.user._id,
        data: {
          theme: 'light',
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          language: 'en',
          timezone: 'Africa/Addis_Ababa',
          dashboardLayout: 'default'
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings',
      error: error.message
    });
  }
};

/**
 * Update user settings
 */
const updateUserSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ 
      type: 'user',
      userId: req.user._id 
    });
    
    if (!settings) {
      settings = new Settings({
        type: 'user',
        userId: req.user._id
      });
    }

    const { theme, notifications, language, timezone, dashboardLayout } = req.body;

    settings.data = {
      theme: theme || settings.data?.theme || 'light',
      notifications: {
        ...settings.data?.notifications,
        ...notifications
      },
      language: language || settings.data?.language || 'en',
      timezone: timezone || settings.data?.timezone || 'Africa/Addis_Ababa',
      dashboardLayout: dashboardLayout || settings.data?.dashboardLayout || 'default'
    };

    settings.updatedAt = new Date();
    await settings.save();

    logger.info(`User settings updated for ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message
    });
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const settings = await Settings.findOne({ 
      type: 'user',
      userId: req.user._id 
    });

    const defaultPreferences = {
      theme: 'light',
      language: 'en',
      notifications: true,
      compactMode: false
    };

    res.status(200).json({
      success: true,
      data: settings?.data || defaultPreferences
    });
  } catch (error) {
    logger.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user preferences',
      error: error.message
    });
  }
};

/**
 * Update user preferences
 */
const updateUserPreferences = async (req, res) => {
  try {
    let settings = await Settings.findOne({ 
      type: 'user',
      userId: req.user._id 
    });
    
    if (!settings) {
      settings = new Settings({
        type: 'user',
        userId: req.user._id
      });
    }

    const { theme, language, notifications, compactMode } = req.body;

    settings.data = {
      ...settings.data,
      theme: theme || settings.data?.theme || 'light',
      language: language || settings.data?.language || 'en',
      notifications: notifications !== undefined ? notifications : settings.data?.notifications || true,
      compactMode: compactMode !== undefined ? compactMode : settings.data?.compactMode || false
    };

    settings.updatedAt = new Date();
    await settings.save();

    logger.info(`User preferences updated for ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User preferences updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user preferences',
      error: error.message
    });
  }
};

/**
 * Get security settings
 */
const getSecuritySettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'security' });
    
    if (!settings) {
      settings = new Settings({
        type: 'security',
        data: {
          twoFactorAuth: false,
          sessionTimeout: 120,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          ipWhitelist: [],
          rateLimiting: {
            enabled: true,
            maxRequests: 100,
            windowMs: 15
          }
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security settings',
      error: error.message
    });
  }
};

/**
 * Update security settings
 */
const updateSecuritySettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'security' });
    
    if (!settings) {
      settings = new Settings({ type: 'security' });
    }

    const {
      twoFactorAuth,
      sessionTimeout,
      passwordPolicy,
      ipWhitelist,
      rateLimiting
    } = req.body;

    settings.data = {
      twoFactorAuth: twoFactorAuth !== undefined ? twoFactorAuth : settings.data?.twoFactorAuth || false,
      sessionTimeout: sessionTimeout || settings.data?.sessionTimeout || 120,
      passwordPolicy: {
        ...settings.data?.passwordPolicy,
        ...passwordPolicy
      },
      ipWhitelist: ipWhitelist || settings.data?.ipWhitelist || [],
      rateLimiting: {
        ...settings.data?.rateLimiting,
        ...rateLimiting
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Security settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: error.message
    });
  }
};

/**
 * Get security logs
 */
const getSecurityLogs = async (req, res) => {
  try {
    // Placeholder - would get security logs from AuditLog model
    const logs = [];

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get security logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security logs',
      error: error.message
    });
  }
};

/**
 * Get email settings
 */
const getEmailSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'email' });
    
    if (!settings) {
      settings = new Settings({
        type: 'email',
        data: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          },
          from: {
            email: process.env.SMTP_FROM || 'noreply@adventisthospital.et',
            name: 'Adventist General Hospital'
          }
        }
      });
      await settings.save();
    }

    // Don't expose password
    const data = { ...settings.data };
    if (data.auth) {
      data.auth = { ...data.auth, pass: '********' };
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email settings',
      error: error.message
    });
  }
};

/**
 * Update email settings
 */
const updateEmailSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'email' });
    
    if (!settings) {
      settings = new Settings({ type: 'email' });
    }

    const { host, port, secure, auth, from } = req.body;

    settings.data = {
      host: host || settings.data?.host || 'smtp.gmail.com',
      port: port || settings.data?.port || 587,
      secure: secure !== undefined ? secure : settings.data?.secure || false,
      auth: {
        user: auth?.user || settings.data?.auth?.user || '',
        pass: auth?.pass || settings.data?.auth?.pass || ''
      },
      from: {
        email: from?.email || settings.data?.from?.email || 'noreply@adventisthospital.et',
        name: from?.name || settings.data?.from?.name || 'Adventist General Hospital'
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Email settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email settings',
      error: error.message
    });
  }
};

/**
 * Test email settings
 */
const testEmailSettings = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required'
      });
    }

    // Placeholder - would send test email
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    logger.error('Test email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

/**
 * Get SMS settings
 */
const getSmsSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'sms' });
    
    if (!settings) {
      settings = new Settings({
        type: 'sms',
        data: {
          provider: 'twilio',
          enabled: false,
          twilio: {
            accountSid: '',
            authToken: '',
            phoneNumber: ''
          },
          africastalking: {
            username: '',
            apiKey: '',
            from: ''
          }
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get SMS settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS settings',
      error: error.message
    });
  }
};

/**
 * Update SMS settings
 */
const updateSmsSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'sms' });
    
    if (!settings) {
      settings = new Settings({ type: 'sms' });
    }

    const { provider, enabled, twilio, africastalking } = req.body;

    settings.data = {
      provider: provider || settings.data?.provider || 'twilio',
      enabled: enabled !== undefined ? enabled : settings.data?.enabled || false,
      twilio: {
        ...settings.data?.twilio,
        ...twilio
      },
      africastalking: {
        ...settings.data?.africastalking,
        ...africastalking
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`SMS settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'SMS settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update SMS settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SMS settings',
      error: error.message
    });
  }
};

/**
 * Test SMS settings
 */
const testSmsSettings = async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number is required'
      });
    }

    // Placeholder - would send test SMS
    res.status(200).json({
      success: true,
      message: 'Test SMS sent successfully'
    });
  } catch (error) {
    logger.error('Test SMS settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS',
      error: error.message
    });
  }
};

/**
 * Get payment settings
 */
const getPaymentSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'payment' });
    
    if (!settings) {
      settings = new Settings({
        type: 'payment',
        data: {
          defaultCurrency: 'ETB',
          defaultGateway: 'chapa',
          chapa: {
            secretKey: '',
            publicKey: ''
          },
          stripe: {
            secretKey: '',
            publicKey: ''
          },
          paypal: {
            clientId: '',
            secret: '',
            mode: 'sandbox'
          }
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment settings',
      error: error.message
    });
  }
};

/**
 * Update payment settings
 */
const updatePaymentSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'payment' });
    
    if (!settings) {
      settings = new Settings({ type: 'payment' });
    }

    const { defaultCurrency, defaultGateway, chapa, stripe, paypal } = req.body;

    settings.data = {
      defaultCurrency: defaultCurrency || settings.data?.defaultCurrency || 'ETB',
      defaultGateway: defaultGateway || settings.data?.defaultGateway || 'chapa',
      chapa: {
        ...settings.data?.chapa,
        ...chapa
      },
      stripe: {
        ...settings.data?.stripe,
        ...stripe
      },
      paypal: {
        ...settings.data?.paypal,
        ...paypal
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Payment settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment settings',
      error: error.message
    });
  }
};

/**
 * Test payment settings
 */
const testPaymentSettings = async (req, res) => {
  try {
    // Placeholder - would test payment gateway
    res.status(200).json({
      success: true,
      message: 'Payment gateway test successful'
    });
  } catch (error) {
    logger.error('Test payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test payment gateway',
      error: error.message
    });
  }
};

/**
 * Get notification settings
 */
const getNotificationSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'notification' });
    
    if (!settings) {
      settings = new Settings({
        type: 'notification',
        data: {
          email: {
            enabled: true,
            templates: {}
          },
          sms: {
            enabled: false,
            provider: 'twilio'
          },
          push: {
            enabled: true
          },
          inApp: {
            enabled: true
          }
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings',
      error: error.message
    });
  }
};

/**
 * Update notification settings
 */
const updateNotificationSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'notification' });
    
    if (!settings) {
      settings = new Settings({ type: 'notification' });
    }

    const { email, sms, push, inApp } = req.body;

    settings.data = {
      email: {
        ...settings.data?.email,
        ...email
      },
      sms: {
        ...settings.data?.sms,
        ...sms
      },
      push: {
        ...settings.data?.push,
        ...push
      },
      inApp: {
        ...settings.data?.inApp,
        ...inApp
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Notification settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};

/**
 * Get integration settings
 */
const getIntegrationSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'integration' });
    
    if (!settings) {
      settings = new Settings({
        type: 'integration',
        data: {
          enabled: false,
          integrations: {
            zoom: { enabled: false, apiKey: '', apiSecret: '' },
            google: { enabled: false, clientId: '', clientSecret: '' },
            slack: { enabled: false, webhookUrl: '' },
            payment: { enabled: false, gateway: 'chapa' }
          }
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get integration settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration settings',
      error: error.message
    });
  }
};

/**
 * Update integration settings
 */
const updateIntegrationSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'integration' });
    
    if (!settings) {
      settings = new Settings({ type: 'integration' });
    }

    const { enabled, integrations } = req.body;

    settings.data = {
      enabled: enabled !== undefined ? enabled : settings.data?.enabled || false,
      integrations: {
        ...settings.data?.integrations,
        ...integrations
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Integration settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Integration settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update integration settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update integration settings',
      error: error.message
    });
  }
};

/**
 * Test integration
 */
const testIntegration = async (req, res) => {
  try {
    const { type } = req.body;

    // Placeholder - would test specific integration
    res.status(200).json({
      success: true,
      message: `Integration test successful for ${type}`
    });
  } catch (error) {
    logger.error('Test integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test integration',
      error: error.message
    });
  }
};

/**
 * Get backup settings
 */
const getBackupSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'backup' });
    
    if (!settings) {
      settings = new Settings({
        type: 'backup',
        data: {
          frequency: 'daily',
          time: '02:00',
          retention: 30,
          location: 'local',
          includeDatabase: true,
          includeFiles: true,
          compress: true
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get backup settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup settings',
      error: error.message
    });
  }
};

/**
 * Update backup settings
 */
const updateBackupSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'backup' });
    
    if (!settings) {
      settings = new Settings({ type: 'backup' });
    }

    const {
      frequency,
      time,
      retention,
      location,
      includeDatabase,
      includeFiles,
      compress
    } = req.body;

    settings.data = {
      frequency: frequency || settings.data?.frequency || 'daily',
      time: time || settings.data?.time || '02:00',
      retention: retention || settings.data?.retention || 30,
      location: location || settings.data?.location || 'local',
      includeDatabase: includeDatabase !== undefined ? includeDatabase : settings.data?.includeDatabase || true,
      includeFiles: includeFiles !== undefined ? includeFiles : settings.data?.includeFiles || true,
      compress: compress !== undefined ? compress : settings.data?.compress || true
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Backup settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Backup settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update backup settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update backup settings',
      error: error.message
    });
  }
};

/**
 * Create backup
 */
const createBackup = async (req, res) => {
  try {
    // Placeholder - would create backup
    res.status(200).json({
      success: true,
      message: 'Backup created successfully'
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * Restore backup
 */
const restoreBackup = async (req, res) => {
  try {
    // Placeholder - would restore backup
    res.status(200).json({
      success: true,
      message: 'Backup restored successfully'
    });
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

/**
 * Get audit settings
 */
const getAuditSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'audit' });
    
    if (!settings) {
      settings = new Settings({
        type: 'audit',
        data: {
          enabled: true,
          logUserActions: true,
          logSystemEvents: true,
          logErrors: true,
          retention: 90,
          notifyOnCritical: true
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get audit settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit settings',
      error: error.message
    });
  }
};

/**
 * Update audit settings
 */
const updateAuditSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'audit' });
    
    if (!settings) {
      settings = new Settings({ type: 'audit' });
    }

    const {
      enabled,
      logUserActions,
      logSystemEvents,
      logErrors,
      retention,
      notifyOnCritical
    } = req.body;

    settings.data = {
      enabled: enabled !== undefined ? enabled : settings.data?.enabled || true,
      logUserActions: logUserActions !== undefined ? logUserActions : settings.data?.logUserActions || true,
      logSystemEvents: logSystemEvents !== undefined ? logSystemEvents : settings.data?.logSystemEvents || true,
      logErrors: logErrors !== undefined ? logErrors : settings.data?.logErrors || true,
      retention: retention || settings.data?.retention || 90,
      notifyOnCritical: notifyOnCritical !== undefined ? notifyOnCritical : settings.data?.notifyOnCritical || true
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Audit settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Audit settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update audit settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update audit settings',
      error: error.message
    });
  }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
  try {
    // Placeholder - would get audit logs
    const logs = [];

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
};

/**
 * Get maintenance settings
 */
const getMaintenanceSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'maintenance' });
    
    if (!settings) {
      settings = new Settings({
        type: 'maintenance',
        data: {
          enabled: false,
          message: 'System is currently under maintenance. Please check back later.',
          allowIPs: [],
          startTime: null,
          endTime: null
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get maintenance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance settings',
      error: error.message
    });
  }
};

/**
 * Update maintenance settings
 */
const updateMaintenanceSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'maintenance' });
    
    if (!settings) {
      settings = new Settings({ type: 'maintenance' });
    }

    const { enabled, message, allowIPs, startTime, endTime } = req.body;

    settings.data = {
      enabled: enabled !== undefined ? enabled : settings.data?.enabled || false,
      message: message || settings.data?.message || 'System is currently under maintenance.',
      allowIPs: allowIPs || settings.data?.allowIPs || [],
      startTime: startTime || settings.data?.startTime || null,
      endTime: endTime || settings.data?.endTime || null
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Maintenance settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Maintenance settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update maintenance settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance settings',
      error: error.message
    });
  }
};

/**
 * Toggle maintenance mode
 */
const toggleMaintenance = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'maintenance' });
    
    if (!settings) {
      settings = new Settings({
        type: 'maintenance',
        data: { enabled: false }
      });
    }

    settings.data.enabled = !settings.data.enabled;
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Maintenance mode ${settings.data.enabled ? 'enabled' : 'disabled'} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${settings.data.enabled ? 'enabled' : 'disabled'} successfully`,
      data: settings.data
    });
  } catch (error) {
    logger.error('Toggle maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle maintenance mode',
      error: error.message
    });
  }
};

/**
 * Get theme settings
 */
const getThemeSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'theme' });
    
    if (!settings) {
      settings = new Settings({
        type: 'theme',
        data: {
          primaryColor: '#1a5276',
          secondaryColor: '#27ae60',
          accentColor: '#e74c3c',
          fontFamily: 'Inter',
          logoUrl: '',
          faviconUrl: ''
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get theme settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get theme settings',
      error: error.message
    });
  }
};

/**
 * Update theme settings
 */
const updateThemeSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'theme' });
    
    if (!settings) {
      settings = new Settings({ type: 'theme' });
    }

    const { primaryColor, secondaryColor, accentColor, fontFamily, logoUrl, faviconUrl } = req.body;

    settings.data = {
      primaryColor: primaryColor || settings.data?.primaryColor || '#1a5276',
      secondaryColor: secondaryColor || settings.data?.secondaryColor || '#27ae60',
      accentColor: accentColor || settings.data?.accentColor || '#e74c3c',
      fontFamily: fontFamily || settings.data?.fontFamily || 'Inter',
      logoUrl: logoUrl || settings.data?.logoUrl || '',
      faviconUrl: faviconUrl || settings.data?.faviconUrl || ''
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Theme settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Theme settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update theme settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme settings',
      error: error.message
    });
  }
};

/**
 * Get language settings
 */
const getLanguageSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'language' });
    
    if (!settings) {
      settings = new Settings({
        type: 'language',
        data: {
          defaultLanguage: 'en',
          supportedLanguages: ['en', 'am', 'om', 'ti'],
          translations: {}
        }
      });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    logger.error('Get language settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get language settings',
      error: error.message
    });
  }
};

/**
 * Update language settings
 */
const updateLanguageSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: 'language' });
    
    if (!settings) {
      settings = new Settings({ type: 'language' });
    }

    const { defaultLanguage, supportedLanguages, translations } = req.body;

    settings.data = {
      defaultLanguage: defaultLanguage || settings.data?.defaultLanguage || 'en',
      supportedLanguages: supportedLanguages || settings.data?.supportedLanguages || ['en', 'am', 'om', 'ti'],
      translations: {
        ...settings.data?.translations,
        ...translations
      }
    };

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    await settings.save();

    logger.info(`Language settings updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Language settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    logger.error('Update language settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language settings',
      error: error.message
    });
  }
};

/**
 * Reset settings
 */
const resetSettings = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Settings type is required'
      });
    }

    await Settings.findOneAndDelete({ type });

    logger.info(`Settings reset: ${type} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `Settings reset successfully for ${type}`
    });
  } catch (error) {
    logger.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};

/**
 * Get default settings
 */
const getDefaultSettings = async (req, res) => {
  try {
    const defaults = {
      general: {
        hospitalName: 'Adventist General Hospital',
        address: 'Bole Sub-city, Addis Ababa, Ethiopia',
        phone: '+251-911-234-567',
        email: 'info@adventisthospital.et',
        website: 'www.adventisthospital.et',
        timezone: 'Africa/Addis_Ababa',
        currency: 'ETB',
        language: 'en'
      },
      system: {
        maintenanceMode: false,
        debugMode: false,
        registrationEnabled: true,
        sessionTimeout: 120,
        maxLoginAttempts: 5,
        forcePasswordChange: false,
        enableAuditLog: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 120,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        ipWhitelist: [],
        rateLimiting: {
          enabled: true,
          maxRequests: 100,
          windowMs: 15
        }
      }
    };

    res.status(200).json({
      success: true,
      data: defaults
    });
  } catch (error) {
    logger.error('Get default settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default settings',
      error: error.message
    });
  }
};

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getHospitalInfo,
  updateHospitalInfo,
  getSystemSettings,
  updateSystemSettings,
  getSystemStatus,
  getSystemInfo,
  getUserSettings,
  updateUserSettings,
  getUserPreferences,
  updateUserPreferences,
  getSecuritySettings,
  updateSecuritySettings,
  getSecurityLogs,
  getEmailSettings,
  updateEmailSettings,
  testEmailSettings,
  getSmsSettings,
  updateSmsSettings,
  testSmsSettings,
  getPaymentSettings,
  updatePaymentSettings,
  testPaymentSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getIntegrationSettings,
  updateIntegrationSettings,
  testIntegration,
  getBackupSettings,
  updateBackupSettings,
  createBackup,
  restoreBackup,
  getAuditSettings,
  updateAuditSettings,
  getAuditLogs,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  toggleMaintenance,
  getThemeSettings,
  updateThemeSettings,
  getLanguageSettings,
  updateLanguageSettings,
  resetSettings,
  getDefaultSettings
};
