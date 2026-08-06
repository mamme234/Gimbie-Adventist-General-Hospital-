/**
 * ============================================
 * PAYMENT.JS - Payment Gateway Configuration
 * ============================================
 */

const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

/**
 * Payment Configuration
 */
const paymentConfig = {
  // Chapa (Ethiopian payment gateway)
  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY,
    publicKey: process.env.CHAPA_PUBLIC_KEY,
    baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
    webhookUrl: process.env.CHAPA_WEBHOOK_URL,
    returnUrl: process.env.CHAPA_RETURN_URL,
    cancelUrl: process.env.CHAPA_CANCEL_URL,
  },
  // Stripe (international)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  // Paypal
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },
  // Default currency
  currency: process.env.PAYMENT_CURRENCY || 'ETB',
};

/**
 * Payment Service class
 */
class PaymentService {
  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || 'chapa';
    this.chapaClient = null;
    this.stripeClient = null;
    this.paypalClient = null;
  }

  /**
   * Initialize Chapa client
   */
  getChapaClient() {
    if (!this.chapaClient) {
      this.chapaClient = axios.create({
        baseURL: paymentConfig.chapa.baseUrl,
        headers: {
          'Authorization': `Bearer ${paymentConfig.chapa.secretKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
    return this.chapaClient;
  }

  /**
   * Initialize Stripe client
   */
  getStripeClient() {
    if (!this.stripeClient && paymentConfig.stripe.secretKey) {
      // const stripe = require('stripe')(paymentConfig.stripe.secretKey);
      // this.stripeClient = stripe;
      console.log('Stripe client initialized');
    }
    return this.stripeClient;
  }

  /**
   * Create payment using Chapa
   * @param {Object} data - Payment data
   * @param {string} data.amount - Amount to charge
   * @param {string} data.email - Customer email
   * @param {string} data.firstName - Customer first name
   * @param {string} data.lastName - Customer last name
   * @param {string} data.txRef - Transaction reference
   * @param {string} data.callbackUrl - Callback URL
   * @param {string} data.returnUrl - Return URL
   * @param {string} data.cancelUrl - Cancel URL
   * @param {string} data.description - Payment description
   * @returns {Promise}
   */
  async createChapaPayment(data) {
    try {
      const client = this.getChapaClient();
      const response = await client.post('/transaction/initialize', {
        amount: data.amount,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        tx_ref: data.txRef || `tx-${Date.now()}`,
        callback_url: data.callbackUrl || paymentConfig.chapa.webhookUrl,
        return_url: data.returnUrl || paymentConfig.chapa.returnUrl,
        cancel_url: data.cancelUrl || paymentConfig.chapa.cancelUrl,
        customization: {
          title: 'Adventist General Hospital',
          description: data.description || 'Hospital payment',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Chapa payment error:', error);
      throw error;
    }
  }

  /**
   * Verify payment with Chapa
   * @param {string} transactionId - Transaction ID from Chapa
   * @returns {Promise}
   */
  async verifyChapaPayment(transactionId) {
    try {
      const client = this.getChapaClient();
      const response = await client.get(`/transaction/verify/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Chapa verification error:', error);
      throw error;
    }
  }

  /**
   * Create payment intent (generic)
   * @param {Object} options - Payment options
   * @param {string} options.provider - Payment provider (chapa, stripe, paypal)
   * @param {number} options.amount - Amount
   * @param {string} options.currency - Currency
   * @param {string} options.description - Description
   * @param {Object} options.metadata - Additional metadata
   * @returns {Promise}
   */
  async createPaymentIntent(options) {
    const provider = options.provider || this.provider;
    
    if (provider === 'chapa') {
      return this.createChapaPayment({
        amount: options.amount,
        email: options.email || 'patient@example.com',
        firstName: options.firstName || 'Patient',
        lastName: options.lastName || '',
        txRef: options.txRef || `tx-${Date.now()}`,
        description: options.description || 'Payment to Adventist General Hospital',
      });
    } else if (provider === 'stripe') {
      // Implement Stripe payment intent
      const stripe = this.getStripeClient();
      if (!stripe) throw new Error('Stripe not configured');
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: options.amount * 100,
      //   currency: options.currency || paymentConfig.currency,
      //   description: options.description,
      //   metadata: options.metadata,
      // });
      // return paymentIntent;
      throw new Error('Stripe not fully implemented');
    } else {
      throw new Error(`Payment provider ${provider} not supported`);
    }
  }

  /**
   * Process payment (record in system)
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.patientId - Patient ID
   * @param {string} paymentData.invoiceId - Invoice ID
   * @param {number} paymentData.amount - Amount
   * @param {string} paymentData.method - Payment method
   * @param {string} paymentData.transactionId - Transaction ID
   * @param {string} paymentData.status - Payment status
   * @returns {Promise}
   */
  async processPayment(paymentData) {
    // This would typically save to database
    console.log('Processing payment:', paymentData);
    return {
      success: true,
      paymentId: `pay-${Date.now()}`,
      ...paymentData,
    };
  }
}

// Singleton instance
const paymentService = new PaymentService();

module.exports = {
  paymentConfig,
  paymentService,
};
