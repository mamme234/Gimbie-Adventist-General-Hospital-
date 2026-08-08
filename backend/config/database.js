// config/database.js
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const config = require('./server');

class Database {
  constructor() {
    this.connection = null;
    this.options = {
      autoIndex: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000
    };
  }

  async connect() {
    try {
      const uri = config.db.uri;
      
      mongoose.set('strictQuery', false);
      
      this.connection = await mongoose.connect(uri, this.options);
      
      logger.info(`✅ MongoDB connected successfully to ${config.db.name}`);
      
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      await this.createIndexes();

      return this.connection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected successfully');
        this.connection = null;
      }
    } catch (error) {
      logger.error('MongoDB disconnection error:', error);
    }
  }

  async createIndexes() {
    try {
      logger.info('Creating database indexes...');
      
      await mongoose.connection.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { role: 1, status: 1 } }
      ]);

      await mongoose.connection.collection('emergencies').createIndexes([
        { key: { status: 1, priority: 1 } },
        { key: { createdAt: -1 } }
      ]);

      await mongoose.connection.collection('payments').createIndexes([
        { key: { transactionId: 1 }, unique: true },
        { key: { status: 1, createdAt: -1 } }
      ]);

      await mongoose.connection.collection('patients').createIndexes([
        { key: { patientId: 1 }, unique: true },
        { key: { userId: 1 }, unique: true }
      ]);

      logger.info('✅ Database indexes created successfully');
    } catch (error) {
      logger.error('Database index creation error:', error);
    }
  }

  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      readyState: mongoose.connection.readyState,
      state: states[mongoose.connection.readyState] || 'unknown',
      name: mongoose.connection.name,
      host: mongoose.connection.host
    };
  }
}

module.exports = new Database();
