// middleware/auth.js
const jwt = require('jsonwebtoken');
const { Employee } = require('../models/Employee');
const { AuditLog } = require('../models/AuditLog');

const auth = {
  // Primary authentication middleware
  authenticate: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || 
                    req.cookies?.accessToken ||
                    req.query?.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.',
          code: 'AUTH_REQUIRED'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is blacklisted
      const isBlacklisted = await checkTokenBlacklist(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked. Please log in again.',
          code: 'TOKEN_REVOKED'
        });
      }

      const employee = await Employee.findById(decoded.id)
        .select('-password -refreshToken')
        .lean();

      if (!employee) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please contact administrator.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Check if password was changed after token issuance
      if (employee.passwordChangedAt && 
          decoded.iat < employee.passwordChangedAt.getTime() / 1000) {
        return res.status(401).json({
          success: false,
          message: 'Password has been changed. Please log in again.',
          code: 'PASSWORD_CHANGED'
        });
      }

      req.user = {
        ...employee,
        tokenVersion: decoded.version || 0,
        tokenExpiry: decoded.exp
      };

      // Log authentication
      await AuditLog.logAction({
        action: 'login',
        resource: 'employee',
        resourceId: employee._id,
        userId: employee._id,
        details: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          method: 'token_auth'
        },
        status: 'success'
      });

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token.',
          code: 'INVALID_TOKEN'
        });
      }

      console.error('Auth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed. Please try again.',
        code: 'AUTH_ERROR'
      });
    }
  },

  // Refresh token middleware
  refresh: async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken || 
                          req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required.',
          code: 'REFRESH_REQUIRED'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const employee = await Employee.findById(decoded.id)
        .select('+refreshToken');
      
      if (!employee || employee.refreshToken !== refreshToken) {
        return res.status(403).json({
          success: false,
          message: 'Invalid refresh token.',
          code: 'INVALID_REFRESH'
        });
      }

      // Generate new tokens
      const accessToken = generateAccessToken(employee);
      const newRefreshToken = generateRefreshToken(employee);

      // Update refresh token in database
      employee.refreshToken = newRefreshToken;
      await employee.save();

      req.newTokens = { accessToken, refreshToken: newRefreshToken };
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token.',
        code: 'REFRESH_ERROR'
      });
    }
  },

  // Optional authentication (doesn't fail if no token)
  optional: async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employee = await Employee.findById(decoded.id)
          .select('-password')
          .lean();
        if (employee && employee.status === 'active') {
          req.user = employee;
        }
      }
      next();
    } catch {
      next();
    }
  },

  // API key authentication for external services
  apiKey: async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required.',
        code: 'API_KEY_REQUIRED'
      });
    }

    try {
      const isValid = await validateApiKey(apiKey);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          message: 'Invalid API key.',
          code: 'INVALID_API_KEY'
        });
      }

      req.apiKey = apiKey;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'API key validation failed.',
        code: 'API_KEY_ERROR'
      });
    }
  }
};

// Helper functions
function generateAccessToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      version: user.tokenVersion || 0 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

async function checkTokenBlacklist(token) {
  // Implement token blacklist check in Redis
  const redis = require('../config/redis');
  const blacklisted = await redis.get(`blacklist:${token}`);
  return !!blacklisted;
}

async function validateApiKey(apiKey) {
  // Implement API key validation
  const { ApiKey } = require('../models/ApiKey');
  const key = await ApiKey.findOne({ 
    key: apiKey, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
  return !!key;
}

module.exports = auth;
