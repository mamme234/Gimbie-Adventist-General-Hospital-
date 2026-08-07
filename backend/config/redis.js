// config/redis.js
const Redis = require('ioredis');
const { logger } = require('../utils/logger');
const config = require('./server');

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.isConnected = false;
    this.initialize();
  }

  // Initialize Redis connection
  initialize() {
    try {
      const options = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 10) {
            logger.error('Redis connection retry limit exceeded');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        enableReadyCheck: true,
        lazyConnect: true,
        commandTimeout: 5000,
        showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
      };

      // Main client
      this.client = new Redis(options);
      
      // Subscriber client (for pub/sub)
      this.subscriber = new Redis(options);

      // Set up event handlers
      this.setupEventHandlers();

      // Connect
      this.client.connect();
      this.subscriber.connect();

      logger.info('✅ Redis client initialized');
    } catch (error) {
      logger.error('❌ Redis initialization error:', error.message);
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    // Main client events
    this.client.on('connect', () => {
      logger.info('🔗 Redis connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('✅ Redis ready');
    });

    this.client.on('error', (error) => {
      logger.error('❌ Redis error:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    // Subscriber client events
    this.subscriber.on('connect', () => {
      logger.info('🔗 Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error('❌ Redis subscriber error:', error.message);
    });
  }

  // Get client instance
  getClient() {
    return this.client;
  }

  // Get subscriber instance
  getSubscriber() {
    return this.subscriber;
  }

  // ============================================
  // STRING OPERATIONS
  // ============================================

  // Set value with expiry
  async set(key, value, ttl = null) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        return await this.client.set(key, stringValue, 'EX', ttl);
      }
      return await this.client.set(key, stringValue);
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  // Get value
  async get(key, parse = true) {
    try {
      const value = await this.client.get(key);
      if (value && parse) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  // Set with expiry (alias for setex)
  async setex(key, seconds, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.setex(key, seconds, stringValue);
    } catch (error) {
      logger.error('Redis setex error:', error);
      throw error;
    }
  }

  // Set if not exists
  async setnx(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.setnx(key, stringValue);
    } catch (error) {
      logger.error('Redis setnx error:', error);
      throw error;
    }
  }

  // Delete key
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
      throw error;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis exists error:', error);
      return 0;
    }
  }

  // Get TTL
  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      return -1;
    }
  }

  // Set expiry
  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
      throw error;
    }
  }

  // ============================================
  // HASH OPERATIONS
  // ============================================

  // Set hash field
  async hset(key, field, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.hset(key, field, stringValue);
    } catch (error) {
      logger.error('Redis hset error:', error);
      throw error;
    }
  }

  // Get hash field
  async hget(key, field, parse = true) {
    try {
      const value = await this.client.hget(key, field);
      if (value && parse) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  }

  // Get all hash fields
  async hgetall(key, parse = true) {
    try {
      const result = await this.client.hgetall(key);
      if (parse && result) {
        const parsed = {};
        for (const [field, value] of Object.entries(result)) {
          try {
            parsed[field] = JSON.parse(value);
          } catch {
            parsed[field] = value;
          }
        }
        return parsed;
      }
      return result;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      return null;
    }
  }

  // Delete hash field
  async hdel(key, field) {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      logger.error('Redis hdel error:', error);
      throw error;
    }
  }

  // ============================================
  // LIST OPERATIONS
  // ============================================

  // Push to list
  async lpush(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.lpush(key, stringValue);
    } catch (error) {
      logger.error('Redis lpush error:', error);
      throw error;
    }
  }

  // Pop from list
  async rpop(key, parse = true) {
    try {
      const value = await this.client.rpop(key);
      if (value && parse) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    } catch (error) {
      logger.error('Redis rpop error:', error);
      return null;
    }
  }

  // Get list range
  async lrange(key, start, stop) {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      logger.error('Redis lrange error:', error);
      return [];
    }
  }

  // ============================================
  // SET OPERATIONS
  // ============================================

  // Add to set
  async sadd(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.sadd(key, stringValue);
    } catch (error) {
      logger.error('Redis sadd error:', error);
      throw error;
    }
  }

  // Check if member in set
  async sismember(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await this.client.sismember(key, stringValue);
    } catch (error) {
      logger.error('Redis sismember error:', error);
      return false;
    }
  }

  // Get all set members
  async smembers(key, parse = true) {
    try {
      const values = await this.client.smembers(key);
      if (parse) {
        return values.map(v => {
          try {
            return JSON.parse(v);
          } catch {
            return v;
          }
        });
      }
      return values;
    } catch (error) {
      logger.error('Redis smembers error:', error);
      return [];
    }
  }

  // ============================================
  // COUNTER OPERATIONS
  // ============================================

  // Increment
  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      throw error;
    }
  }

  // Decrement
  async decr(key) {
    try {
      return await this.client.decr(key);
    } catch (error) {
      logger.error('Redis decr error:', error);
      throw error;
    }
  }

  // Increment by
  async incrby(key, increment) {
    try {
      return await this.client.incrby(key, increment);
    } catch (error) {
      logger.error('Redis incrby error:', error);
      throw error;
    }
  }

  // ============================================
  // PUB/SUB OPERATIONS
  // ============================================

  // Subscribe to channel
  subscribe(channel, callback) {
    try {
      this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            callback(JSON.parse(message));
          } catch {
            callback(message);
          }
        }
      });
      logger.info(`📡 Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      logger.error('Redis subscribe error:', error);
    }
  }

  // Publish to channel
  async publish(channel, message) {
    try {
      const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.client.publish(channel, stringMessage);
    } catch (error) {
      logger.error('Redis publish error:', error);
      throw error;
    }
  }

  // Unsubscribe from channel
  async unsubscribe(channel) {
    try {
      await this.subscriber.unsubscribe(channel);
      logger.info(`📡 Unsubscribed from Redis channel: ${channel}`);
    } catch (error) {
      logger.error('Redis unsubscribe error:', error);
    }
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  // Get keys by pattern
  async keys(pattern) {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  }

  // Flush all keys (use with caution!)
  async flushAll() {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot flush Redis in production');
      }
      return await this.client.flushall();
    } catch (error) {
      logger.error('Redis flushAll error:', error);
      throw error;
    }
  }

  // Get Redis info
  async info() {
    try {
      return await this.client.info();
    } catch (error) {
      logger.error('Redis info error:', error);
      return null;
    }
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  // Check connection status
  isConnectedStatus() {
    return this.isConnected;
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      clientReady: this.client?.status === 'ready',
      subscriberReady: this.subscriber?.status === 'ready'
    };
  }

  // Disconnect
  async disconnect() {
    try {
      await this.client.quit();
      await this.subscriber.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnect error:', error);
    }
  }
}

// Export singleton instance
module.exports = new RedisClient();
