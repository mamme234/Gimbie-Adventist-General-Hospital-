// config/sms.js - FIXED
/**
 * ============================================
 * SMS.JS - SMS Configuration
 * ============================================
 */

const dotenv = require('dotenv');

dotenv.config();

/**
 * SMS Configuration
 */
const smsConfig = {
  provider: process.env.SMS_PROVIDER || 'twilio',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  // African SMS providers
  africanProviders: {
    africastalking: {
      username: process.env.AFRICASTALKING_USERNAME,
      apiKey: process.env.AFRICASTALKING_API_KEY,
      from: process.env.AFRICASTALKING_FROM,
    },
    smsportal: {
      apiKey: process.env.SMSPORTAL_API_KEY,
      sender: process.env.SMSPORTAL_SENDER,
    },
  },
  templates: {
    appointment: 'Dear {name}, your appointment with Dr. {doctor} on {date} at {time} is confirmed.',
    reminder: 'Reminder: Your appointment with Dr. {doctor} is tomorrow at {time}.',
    billing: 'Dear {name}, your bill #{invoice} of {amount} is due on {dueDate}.',
    otp: 'Your verification code is: {otp}',
    welcome: 'Welcome to Gimbie Adventist General Hospital, {name}! Your account has been created.',
    labResult: 'Dear {name}, your lab results are ready. Please log in to view them.',
  },
};

/**
 * SMS Service class
 */
class SMSService {
  constructor() {
    this.provider = smsConfig.provider;
    this.client = null;
  }

  /**
   * Send SMS message
   */
  async send(to, message, options = {}) {
    console.log(`📱 Sending SMS to ${to}: ${message}`);
    
    // In development, just log the message
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        message: 'SMS sent (development mode)',
        to,
        content: message,
        provider: this.provider,
      };
    }

    try {
      // Dynamic import for Twilio
      if (this.provider === 'twilio') {
        const twilio = require('twilio');
        const client = twilio(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
        
        const result = await client.messages.create({
          body: message,
          from: smsConfig.twilio.phoneNumber,
          to: to,
        });
        return result;
      } else {
        // Mock for other providers
        console.warn('SMS provider not configured, using mock');
        return {
          success: true,
          message: 'SMS sent (mock)',
          to,
          content: message,
          provider: this.provider,
        };
      }
    } catch (error) {
      console.error('SMS send error:', error.message);
      throw error;
    }
  }

  /**
   * Send templated SMS
   */
  async sendTemplate(template, to, data) {
    const templateText = smsConfig.templates[template];
    if (!templateText) {
      throw new Error(`Template "${template}" not found`);
    }

    let message = templateText;
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return this.send(to, message);
  }

  sendAppointmentConfirmation(to, appointment) {
    return this.sendTemplate('appointment', to, {
      name: appointment.patientName || 'Patient',
      doctor: appointment.doctorName || 'Doctor',
      date: appointment.date || 'N/A',
      time: appointment.time || 'N/A',
    });
  }

  sendAppointmentReminder(to, appointment) {
    return this.sendTemplate('reminder', to, {
      doctor: appointment.doctorName || 'Doctor',
      time: appointment.time || 'N/A',
    });
  }

  sendOTP(to, otp) {
    return this.sendTemplate('otp', to, { otp });
  }

  sendBillingNotification(to, bill) {
    return this.sendTemplate('billing', to, {
      name: bill.patientName || 'Patient',
      invoice: bill.invoiceNumber || 'N/A',
      amount: bill.amount || '0.00',
      dueDate: bill.dueDate || 'N/A',
    });
  }
}

const smsService = new SMSService();

module.exports = {
  smsConfig,
  smsService,
};
