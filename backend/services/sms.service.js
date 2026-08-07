// services/sms.service.js
const twilio = require('twilio');
const { logger } = require('../middleware/logger');
const { Message } = require('../models/Message');

class SMSService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  // Initialize SMS client
  initialize() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      }
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('SMS service initialization error:', error);
    }
  }

  // Send SMS
  async sendSMS({ to, from, body, template, templateData }) {
    try {
      // Use template if provided
      if (template && this.templates[template]) {
        body = this.renderTemplate(template, templateData);
      }

      const message = await this.client.messages.create({
        to,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        body,
        statusCallback: `${process.env.BASE_URL}/api/webhooks/sms-status`
      });

      // Log SMS
      await this.logSMS({
        to,
        body,
        messageId: message.sid,
        status: 'sent'
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      logger.error('SMS send error:', error);
      
      // Log failed SMS
      await this.logSMS({
        to,
        body,
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  // Send emergency alert SMS
  async sendEmergencyAlertSMS(phoneNumbers, emergencyDetails) {
    const message = `🚨 EMERGENCY ALERT: ${emergencyDetails.priority.toUpperCase()} 
${emergencyDetails.type} at ${emergencyDetails.location.address}
Status: ${emergencyDetails.status}
Track: ${process.env.FRONTEND_URL}/emergency/${emergencyDetails.emergencyId}`;

    return this.sendBulkSMS(phoneNumbers, message);
  }

  // Send verification code
  async sendVerificationCode(phoneNumber, code) {
    const message = `Your verification code is: ${code}. Valid for 5 minutes.`;
    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  }

  // Send appointment reminder
  async sendAppointmentReminder(phoneNumber, appointmentDetails) {
    const message = `Reminder: ${appointmentDetails.type} appointment 
at ${appointmentDetails.facility} on ${appointmentDetails.date} at ${appointmentDetails.time}
Please arrive 15 minutes early.`;
    
    return this.sendSMS({
      to: phoneNumber,
      body: message
    });
  }

  // Send bulk SMS
  async sendBulkSMS(phoneNumbers, message) {
    const results = [];
    const batchSize = 10;

    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      const promises = batch.map(phone => 
        this.sendSMS({
          to: phone,
          body: message
        }).then(result => ({
          phone,
          success: true,
          ...result
        })).catch(error => ({
          phone,
          success: false,
          error: error.message
        }))
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Rate limiting (Twilio allows 1 message per second per number)
      if (i + batchSize < phoneNumbers.length) {
        await this.sleep(1000);
      }
    }

    return {
      total: phoneNumbers.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Log SMS
  async logSMS(data) {
    try {
      const message = new Message({
        type: 'sms',
        to: { phone: data.to },
        content: { text: data.body || data.error },
        status: data.status === 'sent' ? 'sent' : 'failed',
        sentAt: data.status === 'sent' ? new Date() : null,
        error: data.error ? { message: data.error } : null,
        metadata: {
          messageId: data.messageId,
          provider: 'twilio'
        }
      });
      await message.save();
    } catch (error) {
      logger.error('SMS log error:', error);
    }
  }

  // Get message status
  async getMessageStatus(messageId) {
    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      logger.error('Get message status error:', error);
      throw error;
    }
  }

  // Handle incoming SMS
  async handleIncomingSMS(req) {
    try {
      const { From, Body, MessageSid } = req.body;

      // Log incoming message
      await this.logSMS({
        to: From,
        from: MessageSid,
        body: Body,
        status: 'received',
        direction: 'incoming'
      });

      // Process based on keywords
      if (this.isHelpRequest(Body)) {
        await this.handleHelpRequest(From);
      }

      return {
        success: true,
        message: 'Message processed successfully'
      };
    } catch (error) {
      logger.error('Handle incoming SMS error:', error);
      throw error;
    }
  }

  // Check if message is help request
  isHelpRequest(body) {
    const keywords = ['help', 'emergency', '911', 'ambulance', 'sos'];
    return keywords.some(keyword => 
      body.toLowerCase().includes(keyword)
    );
  }

  // Handle help request
  async handleHelpRequest(phoneNumber) {
    // Find patient by phone
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ 'contactDetails.phone': phoneNumber });
    
    if (patient) {
      // Create emergency
      const Emergency = require('../models/Emergency');
      const emergency = new Emergency({
        callerInfo: {
          name: `${patient.name.firstName} ${patient.name.lastName}`,
          phone: phoneNumber
        },
        patientInfo: {
          name: `${patient.name.firstName} ${patient.name.lastName}`,
          age: patient.age,
          gender: patient.gender,
          medicalConditions: patient.medicalConditions || []
        },
        priority: 'high',
        type: 'other',
        status: 'pending'
      });
      await emergency.save();

      // Notify dispatchers
      await this.sendEmergencyAlertSMS([phoneNumber], emergency);

      return emergency;
    }
  }

  // Validate phone number
  validatePhoneNumber(phoneNumber) {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phoneNumber);
  }

  // Format phone number
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber.startsWith('+')) {
      return `+${phoneNumber}`;
    }
    return phoneNumber;
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SMSService();
