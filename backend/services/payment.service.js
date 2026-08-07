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
      const Insurance = require('../models/Insurance');
      const insurance = await Insurance.findById(insuranceId);
      
      if (!insurance) {
        throw new Error('Insurance not found');
      }

      // Calculate coverage
      const coverage = insurance.validateCoverage('emergency');
      const amount = await this.calculateEmergencyCost(emergencyId);
      const coveredAmount = amount * (coverage / 100);
      const patientAmount = amount - coveredAmount;

      // Submit claim
      const claim = await insurance.submitClaim(emergencyId, coveredAmount);

      return {
        total: amount,
        covered: coveredAmount,
        patient: patientAmount,
        coverage,
        claimId: claim.claimId,
        status: claim.status
      };
    } catch (error) {
      logger.error('Process insurance payment error:', error);
      throw error;
    }
  }

  // Send receipt
  async sendReceipt(payment) {
    try {
      await emailService.sendEmail({
        to: await this.getPatientEmail(payment.patientId),
        subject: 'Payment Receipt',
        template: 'payment-receipt',
        templateData: {
          paymentId: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          date: payment.paymentDate,
          transactionId: payment.transactionId,
          status: payment.status,
          receiptUrl: await this.generateReceiptURL(payment._id)
        }
      });
    } catch (error) {
      logger.error('Send receipt error:', error);
    }
  }

  // Calculate emergency cost
  async calculateEmergencyCost(emergencyId) {
    try {
      const Emergency = require('../models/Emergency');
      const emergency = await Emergency.findById(emergencyId);
      
      if (!emergency) {
        throw new Error('Emergency not found');
      }

      let cost = 0;

      // Base cost by priority
      const baseCosts = {
        critical: 5000,
        high: 3000,
        medium: 1500,
        low: 500
      };
      cost += baseCosts[emergency.priority] || 1000;

      // Ambulance cost
      const Ambulance = require('../models/Ambulance');
      const ambulance = await Ambulance.findById(emergency.assignedAmbulanceId);
      if (ambulance) {
        cost += 250; // Base ambulance fee
        // Distance cost
        if (ambulance.location) {
          const distance = this.calculateDistance(
            ambulance.location.coordinates,
            emergency.location.coordinates
          );
          cost += distance * 5; // $5 per mile
        }
      }

      // Treatment cost
      if (emergency.treatmentGiven && emergency.treatmentGiven.length > 0) {
        emergency.treatmentGiven.forEach(treatment => {
          cost += this.getTreatmentCost(treatment.type);
        });
      }

      return Math.round(cost * 100) / 100;
    } catch (error) {
      logger.error('Calculate emergency cost error:', error);
      return 1000; // Default fallback
    }
  }

  // Get treatment cost
  getTreatmentCost(treatmentType) {
    const costs = {
      'iv_fluid': 50,
      'medication': 100,
      'oxygen': 75,
      'defibrillation': 500,
      'cpr': 200,
      'wound_dressing': 30,
      'splint': 40,
      'ecg': 150,
      'glucose_test': 25
    };
    return costs[treatmentType] || 50;
  }

  // Calculate distance
  calculateDistance(coords1, coords2) {
    // Haversine formula
    const R = 3959; // Earth's radius in miles
    const lat1 = coords1[1] * Math.PI / 180;
    const lat2 = coords2[1] * Math.PI / 180;
    const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
    const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      const handler = this.webhookHandlers[event.type];
      if (handler) {
        await handler(event.data.object);
      }

      // Log webhook
      await AuditLog.logAction({
        action: 'webhook',
        resource: 'payment',
        details: {
          type: event.type,
          id: event.id
        },
        status: 'success'
      });

      return { received: true };
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Handle payment success
  async handlePaymentSuccess(paymentIntent) {
    // Update payment record
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (payment) {
      payment.status = 'completed';
      payment.paymentDate = new Date();
      await payment.save();

      // Update emergency status
      const Emergency = require('../models/Emergency');
      await Emergency.findByIdAndUpdate(payment.emergencyId, {
        paymentStatus: 'completed'
      });
    }
  }

  // Handle payment failure
  async handlePaymentFailure(paymentIntent) {
    const payment = await Payment.findOne({ transactionId: paymentIntent.id });
    if (payment) {
      payment.status = 'failed';
      payment.metadata.failureReason = paymentIntent.last_payment_error?.message;
      await payment.save();

      // Notify patient
      await this.sendPaymentFailedNotification(payment);
    }
  }

  // Handle refund
  async handleRefund(charge) {
    const payment = await Payment.findOne({ transactionId: charge.payment_intent });
    if (payment) {
      payment.status = 'refunded';
      payment.metadata.refundedAt = new Date();
      await payment.save();
    }
  }

  // Handle subscription created
  async handleSubscriptionCreated(subscription) {
    // Create subscription record
    const Subscription = require('../models/Subscription');
    await Subscription.create({
      customerId: subscription.customer,
      subscriptionId: subscription.id,
      status: subscription.status,
      startDate: new Date(subscription.start_date * 1000),
      endDate: new Date(subscription.current_period_end * 1000)
    });
  }

  // Handle subscription cancelled
  async handleSubscriptionCancelled(subscription) {
    const Subscription = require('../models/Subscription');
    await Subscription.findOneAndUpdate(
      { subscriptionId: subscription.id },
      { status: 'cancelled', cancelledAt: new Date() }
    );
  }

  // Send payment failed notification
  async sendPaymentFailedNotification(payment) {
    const email = await this.getPatientEmail(payment.patientId);
    if (email) {
      await emailService.sendEmail({
        to: email,
        subject: 'Payment Failed - Action Required',
        template: 'payment-failed',
        templateData: {
          amount: payment.amount,
          currency: payment.currency,
          reason: payment.metadata.failureReason || 'Unknown error',
          retryUrl: `${process.env.FRONTEND_URL}/payment/${payment._id}`
        }
      });
    }
  }

  // Generate receipt URL
  async generateReceiptURL(paymentId) {
    const token = await this.generateReceiptToken(paymentId);
    return `${process.env.FRONTEND_URL}/receipt/${token}`;
  }

  // Generate receipt token
  async generateReceiptToken(paymentId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token with expiry
    await redis.setex(
      `receipt:${token}`,
      86400, // 24 hours
      paymentId
    );
    
    return token;
  }

  // Get patient email
  async getPatientEmail(patientId) {
    const Patient = require('../models/Patient');
    const patient = await Patient.findById(patientId);
    return patient?.contactDetails?.email;
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();      const paymentIntent = await stripe.paymentIntents.create({
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
