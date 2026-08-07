// config/email.js - FIXED
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
    name: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    email: process.env.SMTP_FROM || 'noreply@gimbiehospital.com',
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
 * Load email template with fallback
 */
const loadTemplate = (templateName, data = {}) => {
  const templatePath = path.join(__dirname, '../templates/email', templateName);
  try {
    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      // Return simple HTML fallback
      let html = `<html><body><h1>${templateName}</h1><p>${JSON.stringify(data)}</p></body></html>`;
      return html;
    }
    
    let html = fs.readFileSync(templatePath, 'utf8');
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  } catch (error) {
    console.error(`Template ${templateName} error:`, error.message);
    return `<html><body><h1>${templateName}</h1><p>${JSON.stringify(data)}</p></body></html>`;
  }
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  try {
    const transporter = getTransporter();
    
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
    console.error('❌ Email send error:', error.message);
    throw error;
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = (to, name, role = 'Patient') => {
  return sendEmail({
    to,
    subject: `Welcome to Gimbie Adventist General Hospital, ${name}!`,
    template: 'welcome.html',
    templateData: {
      name,
      role,
      year: new Date().getFullYear(),
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
      loginLink: `${process.env.FRONTEND_URL || 'https://gimbiehospital.com'}/login`,
    },
  });
};

/**
 * Send appointment confirmation
 */
const sendAppointmentEmail = (to, appointment) => {
  return sendEmail({
    to,
    subject: `Appointment Confirmation - ${appointment.date}`,
    template: 'appointment.html',
    templateData: {
      patientName: appointment.patientName || 'Patient',
      doctorName: appointment.doctorName || 'Doctor',
      date: appointment.date || 'N/A',
      time: appointment.time || 'N/A',
      location: appointment.location || 'Gimbie Adventist General Hospital',
      notes: appointment.notes || '',
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    },
  });
};

/**
 * Send appointment reminder
 */
const sendAppointmentReminder = (to, appointment) => {
  return sendEmail({
    to,
    subject: `Reminder: Upcoming Appointment - ${appointment.date}`,
    template: 'appointment-reminder.html',
    templateData: {
      patientName: appointment.patientName || 'Patient',
      doctorName: appointment.doctorName || 'Doctor',
      date: appointment.date || 'N/A',
      time: appointment.time || 'N/A',
      location: appointment.location || 'Gimbie Adventist General Hospital',
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    },
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = (to, name, resetLink) => {
  return sendEmail({
    to,
    subject: 'Password Reset - Gimbie Adventist General Hospital',
    template: 'password-reset.html',
    templateData: {
      name,
      resetLink,
      year: new Date().getFullYear(),
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    },
  });
};

/**
 * Send lab result email
 */
const sendLabResultEmail = (to, result) => {
  return sendEmail({
    to,
    subject: `Lab Results Available - ${result.testName || 'Lab Test'}`,
    template: 'lab-result.html',
    templateData: {
      patientName: result.patientName || 'Patient',
      testName: result.testName || 'Lab Test',
      resultDate: result.resultDate || new Date().toLocaleDateString(),
      summary: result.summary || 'Your lab results are now available.',
      viewLink: `${process.env.FRONTEND_URL || 'https://gimbiehospital.com'}/patient/laboratory-results.html`,
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
    },
  });
};

/**
 * Send billing email
 */
const sendBillingEmail = (to, bill) => {
  return sendEmail({
    to,
    subject: `Bill #${bill.invoiceNumber || 'N/A'} - Gimbie Adventist General Hospital`,
    template: 'billing.html',
    templateData: {
      patientName: bill.patientName || 'Patient',
      invoiceNumber: bill.invoiceNumber || 'N/A',
      amount: bill.amount || '0.00',
      dueDate: bill.dueDate || 'N/A',
      status: bill.status || 'Pending',
      viewLink: `${process.env.FRONTEND_URL || 'https://gimbiehospital.com'}/patient/bills.html`,
      hospitalName: process.env.HOSPITAL_NAME || 'Gimbie Adventist General Hospital',
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
