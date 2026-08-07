// services/payment.service.js
const { logger } = require('../utils/logger');
const paymentConfig = require('../config/payment');
const { Payment } = require('../models/Payment');
const { AuditLog } = require('../models/AuditLog');
const axios = require('axios');

class PaymentService {
  constructor() {
    this.banks = paymentConfig.getEnabledBanks();
    this.defaultCurrency = paymentConfig.defaultCurrency;
    this.timeout = paymentConfig.timeout;
  }

  // Process payment with selected bank
  async processPayment({ 
    amount, 
    currency = this.defaultCurrency, 
    bankName,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
    description,
    metadata = {}
  }) {
    try {
      // Get bank configuration
      const bank = paymentConfig.getBankConfig(bankName);
      
      // Create payment record
      const payment = new Payment({
        amount,
        currency,
        bank: bankName,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        description,
        metadata,
        status: 'pending',
        transactionId: this.generateTransactionId(bankName),
        createdAt: new Date()
      });

      await payment.save();

      // Process payment with the specific bank
      let result;
      switch (bankName.toLowerCase()) {
        case 'cbe':
          result = await this.processCBEPayment(payment, bank);
          break;
        case 'telebirr':
          result = await this.processTelebirrPayment(payment, bank);
          break;
        case 'awash':
          result = await this.processAwashPayment(payment, bank);
          break;
        case 'coop':
          result = await this.processCoopPayment(payment, bank);
          break;
        default:
          throw new Error(`Unsupported bank: ${bankName}`);
      }

      // Update payment status
      payment.status = 'processing';
      payment.paymentData = result;
      await payment.save();

      // Log payment
      await AuditLog.logAction({
        action: 'payment_initiated',
        resource: 'payment',
        resourceId: payment._id,
        details: {
          amount,
          currency,
          bank: bankName,
          customerId,
          transactionId: payment.transactionId
        },
        status: 'success'
      });

      return {
        success: true,
        payment,
        redirectUrl: result.redirectUrl,
        transactionId: payment.transactionId,
        reference: result.reference,
        bankResponse: result.response
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      throw error;
    }
  }

  // Process CBE Payment
  async processCBEPayment(payment, bank) {
    try {
      const payload = {
        merchantId: bank.merchantId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        customerId: payment.customerId,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        description: payment.description,
        returnUrl: `${process.env.HOSPITAL_WEBSITE}/payment/return`,
        cancelUrl: `${process.env.HOSPITAL_WEBSITE}/payment/cancel`,
        webhookUrl: `${process.env.HOSPITAL_WEBSITE}/api/webhooks/cbe`
      };

      // In production, this would be an actual API call
      const response = await this.callBankAPI('cbe', 'initiate', payload);

      return {
        redirectUrl: response.paymentUrl || `${bank.apiUrl}/pay/${payment.transactionId}`,
        reference: response.reference || payment.transactionId,
        response: response
      };
    } catch (error) {
      logger.error('CBE payment error:', error);
      throw error;
    }
  }

  // Process Telebirr Payment
  async processTelebirrPayment(payment, bank) {
    try {
      const payload = {
        merchantId: bank.merchantId,
        shortCode: bank.shortCode,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        customerId: payment.customerId,
        customerPhone: payment.customerPhone,
        description: payment.description,
        returnUrl: `${process.env.HOSPITAL_WEBSITE}/payment/return`,
        cancelUrl: `${process.env.HOSPITAL_WEBSITE}/payment/cancel`,
        webhookUrl: `${process.env.HOSPITAL_WEBSITE}/api/webhooks/telebirr`
      };

      const response = await this.callBankAPI('telebirr', 'initiate', payload);

      return {
        redirectUrl: response.paymentUrl || this.getTelebirrPayUrl(payment.transactionId),
        reference: response.reference || payment.transactionId,
        response: response,
        qrCode: response.qrCode || null
      };
    } catch (error) {
      logger.error('Telebirr payment error:', error);
      throw error;
    }
  }

  // Process Awash Bank Payment
  async processAwashPayment(payment, bank) {
    try {
      const payload = {
        merchantId: bank.merchantId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        customerId: payment.customerId,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        description: payment.description,
        returnUrl: `${process.env.HOSPITAL_WEBSITE}/payment/return`,
        cancelUrl: `${process.env.HOSPITAL_WEBSITE}/payment/cancel`,
        webhookUrl: `${process.env.HOSPITAL_WEBSITE}/api/webhooks/awash`
      };

      const response = await this.callBankAPI('awash', 'initiate', payload);

      return {
        redirectUrl: response.paymentUrl || `${bank.apiUrl}/pay/${payment.transactionId}`,
        reference: response.reference || payment.transactionId,
        response: response
      };
    } catch (error) {
      logger.error('Awash payment error:', error);
      throw error;
    }
  }

  // Process Coop Bank Payment
  async processCoopPayment(payment, bank) {
    try {
      const payload = {
        merchantId: bank.merchantId,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        customerId: payment.customerId,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        description: payment.description,
        returnUrl: `${process.env.HOSPITAL_WEBSITE}/payment/return`,
        cancelUrl: `${process.env.HOSPITAL_WEBSITE}/payment/cancel`,
        webhookUrl: `${process.env.HOSPITAL_WEBSITE}/api/webhooks/coop`
      };

      const response = await this.callBankAPI('coop', 'initiate', payload);

      return {
        redirectUrl: response.paymentUrl || `${bank.apiUrl}/pay/${payment.transactionId}`,
        reference: response.reference || payment.transactionId,
        response: response
      };
    } catch (error) {
      logger.error('Coop payment error:', error);
      throw error;
    }
  }

  // Call Bank API (Mock implementation)
  async callBankAPI(bank, action, payload) {
    try {
      const bankConfig = paymentConfig.getBankConfig(bank);
      
      // In production, this would make actual API calls
      logger.info(`Calling ${bank} API for ${action}`, { payload });

      // Mock response for testing
      return {
        success: true,
        reference: `REF-${Date.now()}`,
        paymentUrl: `https://${bank}.com/pay/${payload.transactionId}`,
        status: 'pending'
      };

      // Actual API call implementation:
      // const response = await axios.post(
      //   `${bankConfig.apiUrl}/${action}`,
      //   payload,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${bankConfig.apiKey}`,
      //       'Content-Type': 'application/json'
      //     },
      //     timeout: this.timeout
      //   }
      // );
      // return response.data;
    } catch (error) {
      logger.error(`Bank API call error (${bank}):`, error);
      throw error;
    }
  }

  // Handle payment webhook
  async handleWebhook(bank, payload) {
    try {
      const bankConfig = paymentConfig.getBankConfig(bank);
      
      // Verify webhook signature
      // const isValid = this.verifyWebhookSignature(payload, bankConfig.webhookSecret);
      // if (!isValid) {
      //   throw new Error('Invalid webhook signature');
      // }

      const { transactionId, status, reference } = payload;

      // Find payment
      const payment = await Payment.findOne({ transactionId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      const statusMap = {
        'success': 'completed',
        'failed': 'failed',
        'pending': 'pending',
        'cancelled': 'cancelled',
        'refunded': 'refunded'
      };

      payment.status = statusMap[status] || 'failed';
      payment.paymentData = {
        ...payment.paymentData,
        webhookPayload: payload,
        webhookReceived: new Date()
      };
      
      if (status === 'success') {
        payment.paymentDate = new Date();
      }

      await payment.save();

      // Log webhook
      await AuditLog.logAction({
        action: 'payment_webhook',
        resource: 'payment',
        resourceId: payment._id,
        details: {
          bank,
          transactionId,
          status,
          reference
        },
        status: status === 'success' ? 'success' : 'failure'
      });

      // Send notification
      await this.sendPaymentNotification(payment, status);

      return {
        success: true,
        payment,
        status: payment.status
      };
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId) {
    try {
      const payment = await Payment.findOne({ transactionId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      const bank = paymentConfig.getBank(payment.bank);
      if (!bank || !bank.enabled) {
        throw new Error('Bank not configured');
      }

      // In production, call bank API to check status
      const status = await this.callBankAPI(payment.bank, 'status', {
        transactionId: payment.transactionId
      });

      return {
        transactionId: payment.transactionId,
        status: payment.status,
        bankStatus: status,
        amount: payment.amount,
        currency: payment.currency,
        bank: payment.bank
      };
    } catch (error) {
      logger.error('Check payment status error:', error);
      throw error;
    }
  }

  // Generate transaction ID
  generateTransactionId(bank) {
    const prefix = {
      'cbe': 'CBE',
      'telebirr': 'TLB',
      'awash': 'AWS',
      'coop': 'COP'
    };
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix[bank.toLowerCase()] || 'PAY'}-${timestamp}-${random}`;
  }

  // Get Telebirr pay URL
  getTelebirrPayUrl(transactionId) {
    return `telebirr://pay?txn=${transactionId}`;
  }

  // Send payment notification
  async sendPaymentNotification(payment, status) {
    try {
      const emailService = require('./email.service');
      const smsService = require('./sms.service');

      if (status === 'success') {
        // Send success email
        await emailService.sendEmail({
          to: payment.customerEmail,
          subject: 'Payment Successful - Gimbie Adventist General Hospital',
          template: 'payment-success',
          templateData: {
            customerName: payment.customerName,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.transactionId,
            date: new Date().toLocaleDateString(),
            bank: payment.bank,
            hospital: 'Gimbie Adventist General Hospital'
          }
        });

        // Send SMS
        await smsService.sendSMS({
          to: payment.customerPhone,
          message: `Payment of ${payment.amount} ${payment.currency} successful. Transaction: ${payment.transactionId}. Thank you for choosing Gimbie Adventist General Hospital.`
        });
      } else if (status === 'failed') {
        // Send failure notification
        await emailService.sendEmail({
          to: payment.customerEmail,
          subject: 'Payment Failed - Gimbie Adventist General Hospital',
          template: 'payment-failed',
          templateData: {
            customerName: payment.customerName,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.transactionId,
            bank: payment.bank,
            hospital: 'Gimbie Adventist General Hospital',
            supportEmail: process.env.HOSPITAL_EMAIL
          }
        });
      }
    } catch (error) {
      logger.error('Payment notification error:', error);
    }
  }

  // Refund payment
  async refundPayment(transactionId, amount = null) {
    try {
      const payment = await Payment.findOne({ transactionId });
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment cannot be refunded');
      }

      const bank = paymentConfig.getBank(payment.bank);
      if (!bank || !bank.enabled) {
        throw new Error('Bank not configured');
      }

      // Call bank API for refund
      const result = await this.callBankAPI(payment.bank, 'refund', {
        transactionId: payment.transactionId,
        amount: amount || payment.amount,
        currency: payment.currency
      });

      payment.status = 'refunded';
      payment.refundData = {
        amount: amount || payment.amount,
        date: new Date(),
        reference: result.reference
      };
      await payment.save();

      return {
        success: true,
        payment,
        refund: result
      };
    } catch (error) {
      logger.error('Refund payment error:', error);
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(startDate, endDate) {
    try {
      const stats = await Payment.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: '$bank',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Get payment stats error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
