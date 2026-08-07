// config/payment.js
const config = require('./server');

const paymentConfig = {
  // Default settings
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'ETB',
  timeout: parseInt(process.env.PAYMENT_TIMEOUT, 10) || 300,

  // Commercial Bank of Ethiopia (CBE)
  cbe: {
    merchantId: process.env.CBE_MERCHANT_ID,
    apiKey: process.env.CBE_API_KEY,
    apiSecret: process.env.CBE_API_SECRET,
    apiUrl: process.env.CBE_API_URL || 'https://api.cbe.com.et/v1',
    webhookSecret: process.env.CBE_WEBHOOK_SECRET,
    enabled: !!process.env.CBE_MERCHANT_ID && !!process.env.CBE_API_KEY,
    name: 'Commercial Bank of Ethiopia',
    shortName: 'CBE',
    logo: '/images/banks/cbe.png',
    supportedMethods: ['card', 'mobile', 'internet-banking'],
    description: 'Pay with CBE Internet Banking, CBE Birr or CBE Card'
  },

  // Telebirr
  telebirr: {
    merchantId: process.env.TELEBIRR_MERCHANT_ID,
    apiKey: process.env.TELEBIRR_API_KEY,
    apiSecret: process.env.TELEBIRR_API_SECRET,
    apiUrl: process.env.TELEBIRR_API_URL || 'https://api.telebirr.et/v1',
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    enabled: !!process.env.TELEBIRR_MERCHANT_ID && !!process.env.TELEBIRR_API_KEY,
    name: 'Telebirr',
    shortName: 'Telebirr',
    logo: '/images/banks/telebirr.png',
    supportedMethods: ['mobile'],
    description: 'Pay with Telebirr mobile money'
  },

  // Awash Bank
  awash: {
    merchantId: process.env.AWASH_MERCHANT_ID,
    apiKey: process.env.AWASH_API_KEY,
    apiSecret: process.env.AWASH_API_SECRET,
    apiUrl: process.env.AWASH_API_URL || 'https://api.awashbank.com/v1',
    enabled: !!process.env.AWASH_MERCHANT_ID && !!process.env.AWASH_API_KEY,
    name: 'Awash Bank',
    shortName: 'Awash',
    logo: '/images/banks/awash.png',
    supportedMethods: ['card', 'internet-banking'],
    description: 'Pay with Awash Bank Internet Banking or Card'
  },

  // Coop Bank (Cooperative Bank of Oromia)
  coop: {
    merchantId: process.env.COOP_MERCHANT_ID,
    apiKey: process.env.COOP_API_KEY,
    apiSecret: process.env.COOP_API_SECRET,
    apiUrl: process.env.COOP_API_URL || 'https://api.coopbankoromia.com.et/v1',
    enabled: !!process.env.COOP_MERCHANT_ID && !!process.env.COOP_API_KEY,
    name: 'Cooperative Bank of Oromia',
    shortName: 'Coop',
    logo: '/images/banks/coop.png',
    supportedMethods: ['card', 'internet-banking'],
    description: 'Pay with Coop Bank Internet Banking or Card'
  },

  // Get all enabled payment methods
  getEnabledBanks() {
    const banks = [];
    if (this.cbe.enabled) banks.push(this.cbe);
    if (this.telebirr.enabled) banks.push(this.telebirr);
    if (this.awash.enabled) banks.push(this.awash);
    if (this.coop.enabled) banks.push(this.coop);
    return banks;
  },

  // Get bank by short name
  getBank(shortName) {
    const map = {
      'cbe': this.cbe,
      'telebirr': this.telebirr,
      'awash': this.awash,
      'coop': this.coop
    };
    return map[shortName.toLowerCase()] || null;
  },

  // Get bank configuration for payment
  getBankConfig(shortName) {
    const bank = this.getBank(shortName);
    if (!bank || !bank.enabled) {
      throw new Error(`Bank ${shortName} is not configured or disabled`);
    }
    return bank;
  }
};

module.exports = paymentConfig;
