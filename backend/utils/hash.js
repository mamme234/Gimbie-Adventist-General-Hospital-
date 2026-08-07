// utils/hash.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logger } = require('./logger');

class HashUtils {
  constructor() {
    this.saltRounds = 10;
    this.algorithm = 'aes-256-cbc';
    this.encoding = 'hex';
  }

  // Hash password
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      logger.error('Hash password error:', error);
      throw error;
    }
  }

  // Compare password
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Compare password error:', error);
      throw error;
    }
  }

  // Generate random hash
  generateRandomHash(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate SHA256 hash
  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate SHA512 hash
  sha512(data) {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  // Generate MD5 hash
  md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Generate HMAC
  hmac(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Encrypt data
  encrypt(text, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY;
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        Buffer.from(encryptionKey, 'hex'),
        iv
      );
      
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      return {
        iv: iv.toString(this.encoding),
        encryptedData: encrypted.toString(this.encoding)
      };
    } catch (error) {
      logger.error('Encrypt error:', error);
      throw error;
    }
  }

  // Decrypt data
  decrypt(encryptedData, iv, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY;
      const ivBuffer = Buffer.from(iv, this.encoding);
      const encryptedText = Buffer.from(encryptedData, this.encoding);
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(encryptionKey, 'hex'),
        ivBuffer
      );
      
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString();
    } catch (error) {
      logger.error('Decrypt error:', error);
      throw error;
    }
  }

  // Generate UUID
  generateUUID() {
    return crypto.randomUUID();
  }

  // Generate short ID
  generateShortId(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += characters[randomBytes[i] % characters.length];
    }
    
    return result;
  }

  // Generate OTP
  generateOTP(length = 6) {
    let otp = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      otp += Math.floor(randomBytes[i] % 10);
    }
    
    return otp;
  }

  // Generate hash from object
  hashObject(obj) {
    const str = JSON.stringify(obj);
    return this.sha256(str);
  }

  // Verify hash from object
  verifyObjectHash(obj, hash) {
    const computedHash = this.hashObject(obj);
    return computedHash === hash;
  }

  // Generate key derivation
  deriveKey(password, salt, iterations = 100000, keyLength = 32) {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
  }

  // Generate signature
  sign(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Verify signature
  verifySignature(data, signature, secret) {
    const computedSignature = this.sign(data, secret);
    return computedSignature === signature;
  }

  // Generate random token
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }

  // Hash with salt
  hashWithSalt(data, salt = null) {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltToUse, 1000, 64, 'sha512').toString('hex');
    return { hash, salt: saltToUse };
  }

  // Verify hash with salt
  verifyHashWithSalt(data, hash, salt) {
    const result = this.hashWithSalt(data, salt);
    return result.hash === hash;
  }

  // Generate checksum
  generateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  // Verify checksum
  verifyChecksum(data, checksum) {
    const computedChecksum = this.generateChecksum(data);
    return computedChecksum === checksum;
  }

  // Generate API key with prefix
  generateApiKey(prefix = 'sk') {
    const key = crypto.randomBytes(32).toString('base64');
    return `${prefix}_${key}`;
  }

  // Parse API key
  parseApiKey(apiKey) {
    const parts = apiKey.split('_');
    if (parts.length === 2) {
      return {
        prefix: parts[0],
        key: parts[1]
      };
    }
    return {
      prefix: null,
      key: apiKey
    };
  }

  // Generate secure random string
  secureRandom(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  // Generate unique reference number
  generateReference(prefix = 'REF', length = 10) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = this.secureRandom(length).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}

module.exports = new HashUtils();
