// services/payment.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../middleware/logger');
const { Payment } = require('../models/Payment');
const { AuditLog } = require('../models/AuditLog');
const emailService = require('./email.service');

class PaymentService {
  constructor() {
    this.initializeWebhooks();
  }

  // Initialize webhook handlers
  initializeWebhooks() {
    // Webhook events
    this.webhookHandlers = {
      'payment_intent.succeeded': this.handlePaymentSuccess.bind(this),
      'payment_intent.payment_failed': this.handlePaymentFailure.bind(this),
      'charge.refunded': this.handleRefund.bind(this),
      'customer.subscription.created': this.handleSubscriptionCreated.bind(this),
      'customer.subscription.deleted': this.handleSubscriptionCancelled.bind(this)
    };
  }

  // Create payment intent
  async createPaymentIntent({
    amount,
    currency = 'usd',
    customerId,
    paymentMethod,
    metadata,
    description,
    emergencyId,
    patientId
  }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        payment_method: paymentMethod,
        payment_method_types: ['card', 'us_bank_account'],
        description: description || `Emergency payment for ${emergencyId}`,
        metadata: {
          emergencyId,
          patientId,
          ...metadata
        },
        capture_method: 'automatic',
        confirmation_method: 'automatic',
        statement_descriptor: process.env.STATEMENT_DESCRIPTOR || 'Emergency Services'
      });

      // Create payment record
      const payment = new Payment({
        emergencyId,
        patientId,
        amount,
        currency,
        method: 'credit_card',
        status: 'pending',
        transactionId: paymentIntent.id,
        metadata: {
          paymentIntent: paymentIntent.id,
          clientSecret: paymentIntent.client_secret
        }
      });
      await payment.save();

      return {
        success: true,
        paymentIntent: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        payment
      };
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      // Update payment record
      const payment = await Payment.findOne({ transactionId: paymentIntentId });
      if (payment) {
        payment.status = paymentIntent.status === 'succeeded' ? 'completed' : 'processing';
        await payment.save();

        // Send receipt
        if (paymentIntent.status === 'succeeded') {
          await this.sendReceipt(payment);
        }
      }

      return paymentIntent;
    } catch (error) {
      logger.error('Confirm payment error:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: 'requested_by_customer'
      });

      // Update payment record
      const payment = await Payment.findOne({ transactionId: paymentIntentId });
      if (payment) {
        payment.status = 'refunded';
        payment.metadata.refundId = refund.id;
        payment.metadata.refundedAt = new Date().toISOString();
        await payment.save();
      }

      return refund;
    } catch (error) {
      logger.error('Refund payment error:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          source: 'emergency_system'
        }
      });

      return subscription;
    } catch (error) {
      logger.error('Create subscription error:', error);
      throw error;
    }
  }

  // Create customer
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
        preferred_locales: ['en-US']
      });

      return customer;
    } catch (error) {
      logger.error('Create customer error:', error);
      throw error;
    }
  }

  // Attach payment method
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Attach payment method error:', error);
      throw error;
    }
  }

  // Process insurance payment
  async processInsurancePayment(emergencyId, insuranceId) {
    try {
