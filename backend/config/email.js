/**
 * ============================================
 * EMAIL.JS - Email Configuration
 * ============================================
 */

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

/**
 * Email configuration
 */
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: {
    name: 'Adventist General Hospital',
    email: process.env.SMTP_FROM || 'noreply@adventisthospital.et',
  },
  templates: {
    welcome: 'welcome.html',
    appointment: 'appointment.html',
    appointmentReminder: 'appointment-reminder.html',
    prescription: 'prescription.html',
    billing: 'billing.html',
    passwordReset: 'password-reset.html',
    labResult: 'lab-result.html',
    general: 'general.html',
  },
};

/**
 * Create email transporter
 */
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

/**
 * Load email template
 * @param {string} templateName - Name of template file
 * @param {Object} data - Data to inject into template
 * @returns {string} Rendered HTML
 */
const loadTemplate = (templateName, data = {}) => {
  const templatePath = path.join(__dirname, '../templates/email', templateName);
  try {
    let html = fs.readFileSync(templatePath, 'utf8');
    // Replace placeholders with data
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  } catch (error) {
    console.error(`Template ${templateName} not found:`, error);
    return `<html><body><p>${JSON.stringify(data)}</p></body></html>`;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.template - Template name (optional)
 * @param {Object} options.templateData - Data for template
 * @param {Array} options.attachments - File attachments
 * @returns {Promise} Nodemailer send result
 */
const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    
    // If template is provided, load it
    let html = options.html;
    if (options.template) {
      html = loadTemplate(options.template, options.templateData || {});
    }

    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: options.to,
      subject: options.subject,
      html: html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

/**
 * Send welcome email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} role - User role
 * @returns {Promise}
 */
const sendWelcomeEmail = (to, name, role = 'Patient') => {
  return sendEmail({
    to,
    subject: `Welcome to Adventist General Hospital, ${name}!`,
    template: 'welcome',
    templateData: {
      name,
      role,
      year: new Date().getFullYear(),
      loginLink: `${process.env.FRONTEND_URL}/login`,
    },
  });
};

/**
 * Send appointment confirmation
 * @param {string} to - Recipient email
 * @param {Object} appointment - Appointment details
 * @returns {Promise}
 */
const sendAppointmentEmail = (to, appointment) => {
  return sendEmail({
    to,
    subject: `Appointment Confirmation - ${appointment.date}`,
    template: 'appointment',
    templateData: {
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      location: appointment.location || 'Adventist General Hospital',
      notes: appointment.notes || '',
    },
  });
};

/**
 * Send appointment reminder
 * @param {string} to - Recipient email
 * @param {Object} appointment - Appointment details
 * @returns {Promise}
 */
const sendAppointmentReminder = (to, appointment) => {
  return sendEmail({
    to,
    subject: `Reminder: Upcoming Appointment - ${appointment.date}`,
    template: 'appointment-reminder',
    templateData: {
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      location: appointment.location || 'Adventist General Hospital',
    },
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} name - User name
 * @param {string} resetLink - Password reset link
 * @returns {Promise}
 */
const sendPasswordResetEmail = (to, name, resetLink) => {
  return sendEmail({
    to,
    subject: 'Password Reset - Adventist General Hospital',
    template: 'password-reset',
    templateData: {
      name,
      resetLink,
      year: new Date().getFullYear(),
    },
  });
};

/**
 * Send lab result email
 * @param {string} to - Recipient email
 * @param {Object} result - Lab result details
 * @returns {Promise}
 */
const sendLabResultEmail = (to, result) => {
  return sendEmail({
    to,
    subject: `Lab Results Available - ${result.testName}`,
    template: 'lab-result',
    templateData: {
      patientName: result.patientName,
      testName: result.testName,
      resultDate: result.resultDate,
      summary: result.summary || 'Your lab results are now available.',
      viewLink: `${process.env.FRONTEND_URL}/patient/laboratory-results.html`,
    },
  });
};

/**
 * Send billing email
 * @param {string} to - Recipient email
 * @param {Object} bill - Bill details
 * @returns {Promise}
 */
const sendBillingEmail = (to, bill) => {
  return sendEmail({
    to,
    subject: `Bill #${bill.invoiceNumber} - Adventist General Hospital`,
    template: 'billing',
    templateData: {
      patientName: bill.patientName,
      invoiceNumber: bill.invoiceNumber,
      amount: bill.amount,
      dueDate: bill.dueDate,
      status: bill.status,
      viewLink: `${process.env.FRONTEND_URL}/patient/bills.html`,
    },
  });
};

module.exports = {
  emailConfig,
  sendEmail,
  sendWelcomeEmail,
  sendAppointmentEmail,
  sendAppointmentReminder,
  sendPasswordResetEmail,
  sendLabResultEmail,
  sendBillingEmail,
  loadTemplate,
};
