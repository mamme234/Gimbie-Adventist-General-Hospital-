/**
 * ============================================
 * JWT.JS - JWT Configuration
 * ============================================
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

/**
 * JWT Configuration
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  refreshExpiresIn: '30d',
  algorithm: 'HS256',
  issuer: 'adventist-hospital',
  audience: 'adventist-hospital-users',
};

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
const generateToken = (payload, options = {}) => {
  return jwt.sign(
    payload,
    jwtConfig.secret,
    {
      expiresIn: options.expiresIn || jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      ...options
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} payload - Data to encode in token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
};

/**
 * Decode JWT token (without verification)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

/**
 * Get remaining time in seconds
 * @param {string} token - JWT token
 * @returns {number} Seconds remaining
 */
const getTokenRemainingTime = (token) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    const remaining = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
};

module.exports = {
  jwtConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenRemainingTime,
};
