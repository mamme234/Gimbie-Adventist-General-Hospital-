// utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('./logger');

class JWTUtils {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.algorithm = 'HS256';
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '1h';
    this.refreshTokenExpiry = '7d';
  }

  // Generate access token
  generateAccessToken(payload) {
    try {
      const token = jwt.sign(
        {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          jti: this.generateTokenId()
        },
        this.secret,
        {
          algorithm: this.algorithm,
          expiresIn: this.accessTokenExpiry
        }
      );
      
      return token;
    } catch (error) {
      logger.error('Generate access token error:', error);
      throw error;
    }
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    try {
      const token = jwt.sign(
        {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          jti: this.generateTokenId()
        },
        this.refreshSecret,
        {
          algorithm: this.algorithm,
          expiresIn: this.refreshTokenExpiry
        }
      );
      
      return token;
    } catch (error) {
      logger.error('Generate refresh token error:', error);
      throw error;
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm]
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        algorithms: [this.algorithm]
      });
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  // Decode token without verification
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Decode token error:', error);
      return null;
    }
  }

  // Generate token ID
  generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate API key
  generateApiKey(prefix = 'api') {
    const key = crypto.randomBytes(32).toString('base64');
    return `${prefix}_${key}`;
  }

  // Generate one-time token
  generateOneTimeToken(data, expiresIn = '5m') {
    try {
      const token = jwt.sign(
        {
          ...data,
          jti: this.generateTokenId(),
          type: 'one-time'
        },
        this.secret,
        {
          algorithm: this.algorithm,
          expiresIn
        }
      );
      return token;
    } catch (error) {
      logger.error('Generate one-time token error:', error);
      throw error;
    }
  }

  // Verify one-time token
  verifyOneTimeToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm]
      });
      
      if (decoded.type !== 'one-time') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Generate CSRF token
  generateCsrfToken() {
    return crypto.randomBytes(32).toString('base64');
  }

  // Generate reset password token
  generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    return { token, expires };
  }

  // Generate email verification token
  generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 86400000); // 24 hours
    return { token, expires };
  }

  // Token blacklist
  tokenBlacklist = new Map();

  // Add token to blacklist
  blacklistToken(token, expiry = null) {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        const ttl = (decoded.exp * 1000) - Date.now();
        if (ttl > 0) {
          this.tokenBlacklist.set(token, {
            addedAt: new Date(),
            expiresAt: new Date(decoded.exp * 1000)
          });
          
          // Auto-remove after expiry
          setTimeout(() => {
            this.tokenBlacklist.delete(token);
          }, ttl);
          
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Blacklist token error:', error);
      return false;
    }
  }

  // Check if token is blacklisted
  isTokenBlacklisted(token) {
    return this.tokenBlacklist.has(token);
  }

  // Clean expired tokens from blacklist
  cleanupBlacklist() {
    const now = Date.now();
    for (const [token, data] of this.tokenBlacklist.entries()) {
      if (data.expiresAt && data.expiresAt.getTime() < now) {
        this.tokenBlacklist.delete(token);
      }
    }
  }

  // Generate JWT for service-to-service communication
  generateServiceToken(serviceName, permissions = []) {
    return jwt.sign(
      {
        service: serviceName,
        permissions,
        type: 'service',
        jti: this.generateTokenId()
      },
      this.secret,
      {
        algorithm: this.algorithm,
        expiresIn: '24h'
      }
    );
  }

  // Verify service token
  verifyServiceToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: [this.algorithm]
      });
      
      if (decoded.type !== 'service') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid service token');
    }
  }

  // Generate temporary access token
  generateTemporaryToken(userId, purpose, expiresIn = '15m') {
    return jwt.sign(
      {
        userId,
        purpose,
        type: 'temporary',
        jti: this.generateTokenId()
      },
      this.secret,
      {
        algorithm: this.algorithm,
        expiresIn
      }
    );
  }

  // Rotate refresh token
  rotateRefreshToken(oldToken, newToken) {
    this.blacklistToken(oldToken);
    return newToken;
  }
}

module.exports = new JWTUtils();
