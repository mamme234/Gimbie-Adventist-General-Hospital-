// services/email.service.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logger');
const { Message } = require('../models/Message');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.initialize();
  }

  // Initialize email transporter
  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10
      });

      // Load templates
      this.loadTemplates();

      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization error:', error);
    }
  }

  // Load email templates
  loadTemplates() {
    const templateDir = path.join(__dirname, '../templates/email');
    const templateFiles = fs.readdirSync(templateDir);
    
    templateFiles.forEach(file => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs');
        const content = fs.readFileSync(path.join(templateDir, file), 'utf8');
        this.templates[name] = handlebars.compile(content);
      }
    });
  }

  // Send email
  async sendEmail({ to, subject, html, text, attachments, template, templateData }) {
    try {
      // Use template if provided
      if (template && this.templates[template]) {
        html = this.templates[template](templateData || {});
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@emergency-system.com',
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments: attachments || [],
        headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'X-Auto-Response-Suppress': 'All'
        }
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Log email
      await this.logEmail({
        to,
        subject,
        template,
        messageId: info.messageId,
        status: 'sent'
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      logger.error('Email send error:', error);
      
      // Log failed email
      await this.logEmail({
        to,
        subject,
        template,
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, firstName) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Emergency System',
      template: 'welcome',
      templateData: {
        name: firstName,
        year: new Date().getFullYear(),
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, firstName, resetUrl) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      templateData: {
        name: firstName,
        resetUrl,
        expiryTime: '1 hour',
        year: new Date().getFullYear()
      }
    });
  }

  // Send password changed email
  async sendPasswordChangedEmail(email, firstName) {
    return this.sendEmail({
      to: email,
      subject: 'Password Changed Successfully',
      template: 'password-changed',
      templateData: {
        name: firstName,
        year: new Date().getFullYear(),
        supportUrl: `${process.env.FRONTEND_URL}/support`
      }
    });
  }

  // Send notification email
  async sendNotificationEmail(email, notification) {
    return this.sendEmail({
      to: email,
      subject: notification.title,
      template: 'notification',
      templateData: {
        title: notification.title,
        message: notification.body,
        action: notification.action,
        actionUrl: notification.url,
        year: new Date().getFullYear()
      }
    });
  }

  // Send emergency alert email
  async sendEmergencyAlertEmail(emails, emergencyDetails) {
    return this.sendEmail({
      to: emails,
      subject: `🚨 EMERGENCY ALERT: ${emergencyDetails.priority.toUpperCase()} - ${emergencyDetails.type}`,
      template: 'emergency-alert',
      templateData: {
        emergencyId: emergencyDetails.emergencyId,
        priority: emergencyDetails.priority,
        type: emergencyDetails.type,
        location: emergencyDetails.location,
        status: emergencyDetails.status,
        timestamp: new Date().toLocaleString(),
        details: emergencyDetails.details,
        trackingUrl: `${process.env.FRONTEND_URL}/emergency/${emergencyDetails.emergencyId}`,
        year: new Date().getFullYear()
      }
    });
  }

  // Send report email
  async sendReportEmail(email, report) {
    return this.sendEmail({
      to: email,
      subject: `${report.title} - Report`,
      template: 'report',
      templateData: {
        title: report.title,
        description: report.description,
        generatedAt: report.generatedAt,
        summary: report.summary,
        downloadUrl: report.downloadUrl,
        year: new Date().getFullYear()
      }
    });
  }

  // Send bulk emails
  async sendBulkEmails(recipients, subject, template, templateData) {
    const results = [];
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const promises = batch.map(recipient => 
        this.sendEmail({
          to: recipient.email,
          subject,
          template,
          templateData: {
            ...templateData,
            name: recipient.firstName || 'User'
          }
        }).then(result => ({
          email: recipient.email,
          success: true,
          ...result
        })).catch(error => ({
          email: recipient.email,
          success: false,
          error: error.message
        }))
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Rate limiting
      if (i + batchSize < recipients.length) {
        await this.sleep(1000);
      }
    }

    return {
      total: recipients.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Log email
  async logEmail(data) {
    try {
      const message = new Message({
        type: 'email',
        to: { email: data.to },
        subject: data.subject,
        content: { text: `Template: ${data.template}` },
        status: data.status === 'sent' ? 'sent' : 'failed',
        sentAt: data.status === 'sent' ? new Date() : null,
        error: data.error ? { message: data.error } : null,
        metadata: {
          messageId: data.messageId,
          template: data.template
        }
      });
      await message.save();
    } catch (error) {
      logger.error('Email log error:', error);
    }
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
