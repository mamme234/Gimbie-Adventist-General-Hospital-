/**
 * ============================================
 * SMS.JS - SMS Configuration
 * ============================================
 */

const dotenv = require('dotenv');
// const twilio = require('twilio'); // Uncomment when using Twilio

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
    welcome: 'Welcome to Adventist General Hospital, {name}! Your account has been created.',
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
    this.initializeProvider();
  }

  /**
   * Initialize the SMS provider
   */
  initializeProvider() {
    if (this.provider === 'twilio') {
      // Uncomment when using Twilio
      // this.client = twilio(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
      console.log('SMS Provider initialized: Twilio');
    } else if (this.provider === 'africastalking') {
      // Initialize Africa's Talking
      console.log('SMS Provider initialized: Africa\'s Talking');
    } else {
      console.log('SMS Provider: No provider selected, using mock');
    }
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @param {Object} options - Additional options
   * @returns {Promise}
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
      };
    }

    try {
      // Implement actual sending based on provider
      if (this.provider === 'twilio' && this.client) {
        // const result = await this.client.messages.create({
        //   body: message,
        //   from: smsConfig.twilio.phoneNumber,
        //   to: to,
        // });
        // return result;
        throw new Error('Twilio not configured');
      } else {
        // Mock for now
        return {
          success: true,
          message: 'SMS sent (mock)',
          to,
          content: message,
        };
      }
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send templated SMS
   * @param {string} template - Template key
   * @param {string} to - Recipient phone number
   * @param {Object} data - Template data
   * @returns {Promise}
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

  /**
   * Send appointment confirmation
   * @param {string} to - Phone number
   * @param {Object} appointment - Appointment details
   * @returns {Promise}
   */
  sendAppointmentConfirmation(to, appointment) {
    return this.sendTemplate('appointment', to, {
      name: appointment.patientName,
      doctor: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
    });
  }

  /**
   * Send appointment reminder
   * @param {string} to - Phone number
   * @param {Object} appointment - Appointment details
   * @returns {Promise}
   */
  sendAppointmentReminder(to, appointment) {
    return this.sendTemplate('reminder', to, {
      doctor: appointment.doctorName,
      time: appointment.time,
    });
  }

  /**
   * Send OTP verification code
   * @param {string} to - Phone number
   * @param {string} otp - One-time password
   * @returns {Promise}
   */
  sendOTP(to, otp) {
    return this.sendTemplate('otp', to, { otp });
  }

  /**
   * Send billing notification
   * @param {string} to - Phone number
   * @param {Object} bill - Bill details
   * @returns {Promise}
   */
  sendBillingNotification(to, bill) {
    return this.sendTemplate('billing', to, {
      name: bill.patientName,
      invoice: bill.invoiceNumber,
      amount: bill.amount,
      dueDate: bill.dueDate,
    });
  }
}

// Singleton instance
const smsService = new SMSService();

module.exports = {
  smsConfig,
  smsService,
};
