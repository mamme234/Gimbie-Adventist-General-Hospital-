// services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Employee } = require('../models/Employee');
const { Patient } = require('../models/Patient');
const { AuditLog } = require('../models/AuditLog');
const { logger } = require('../middleware/logger');
const { AppError } = require('../middleware/errorHandler');
const redis = require('../config/redis');
const emailService = require('./email.service');
const smsService = require('./sms.service');

class AuthService {
  constructor() {
    this.tokenBlacklist = new Map();
    this.refreshTokens = new Map();
  }

  // Login user
  async login(email, password, ip, userAgent) {
    try {
      // Find user
      const user = await Employee.findOne({ email })
        .select('+password +refreshToken')
        .lean();

      if (!user) {
        logger.warn(`Login attempt failed: User not found - ${email}`);
        throw AppError.unauthorized('Invalid email or password');
      }

      // Check if account is active
      if (user.status !== 'active') {
        logger.warn(`Login attempt failed: Account inactive - ${email}`);
        throw AppError.forbidden('Account is not active. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login attempt failed: Invalid password - ${email}`);
        throw AppError.unauthorized('Invalid email or password');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Update refresh token in database
      await Employee.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken,
        lastLogin: new Date(),
        lastLoginIP: ip
      });

      // Log successful login
      await AuditLog.logAction({
        action: 'login',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { ip, userAgent, method: 'password' },
        status: 'success'
      });

      // Remove sensitive data
      delete user.password;
      delete user.refreshToken;

      return {
        user,
        ...tokens,
        expiresIn: process.env.JWT_EXPIRE || '1h'
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData, ip, userAgent) {
    try {
      // Check if email exists
      const existingUser = await Employee.findOne({ email: userData.email });
      if (existingUser) {
        throw AppError.conflict('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = new Employee({
        ...userData,
        password: hashedPassword,
        employeeId: await this.generateEmployeeId(),
        createdAt: new Date()
      });

      await user.save();

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.firstName);

      // Log registration
      await AuditLog.logAction({
        action: 'register',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { ip, userAgent },
        status: 'success'
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Remove sensitive data
      user.password = undefined;
      user.refreshToken = undefined;

      return {
        user,
        ...tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(userId, token, ip) {
    try {
      // Blacklist token
      await this.blacklistToken(token);

      // Clear refresh token
      await Employee.findByIdAndUpdate(userId, {
        refreshToken: null
      });

      // Log logout
      await AuditLog.logAction({
        action: 'logout',
        resource: 'employee',
        resourceId: userId,
        userId: userId,
        details: { ip },
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken, ip) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find user with refresh token
      const user = await Employee.findOne({
        _id: decoded.id,
        refreshToken: refreshToken
      }).lean();

      if (!user) {
        throw AppError.unauthorized('Invalid refresh token');
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw AppError.unauthorized('Token has been revoked');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update refresh token in database
      await Employee.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken
      });

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  // Generate tokens
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        version: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Blacklist token
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return;

      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await redis.setex(
          `blacklist:${token}`,
          expiresIn,
          '1'
        );
      }
    } catch (error) {
      logger.error('Blacklist token error:', error);
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const result = await redis.get(`blacklist:${token}`);
      return !!result;
    } catch (error) {
      logger.error('Check token blacklist error:', error);
      return false;
    }
  }

  // Generate employee ID
  async generateEmployeeId() {
    const year = new Date().getFullYear();
    const count = await Employee.countDocuments() + 1;
    return `EMP${year}${String(count).padStart(4, '0')}`;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword, ip) {
    try {
      const user = await Employee.findById(userId).select('+password');
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw AppError.unauthorized('Current password is incorrect');
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      // Log password change
      await AuditLog.logAction({
        action: 'change_password',
        resource: 'employee',
        resourceId: userId,
        userId: userId,
        details: { ip },
        status: 'success',
        severity: 'warning'
      });

      // Send notification
      await emailService.sendPasswordChangedEmail(user.email, user.firstName);

      return { success: true };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const user = await Employee.findOne({ email });
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      // Store reset token
      await Employee.findByIdAndUpdate(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetTokenExpiry
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetUrl);

      await AuditLog.logAction({
        action: 'reset_password_request',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { email: user.email },
        status: 'success',
        severity: 'warning'
      });

      return { success: true };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  // Confirm reset password
  async confirmResetPassword(token, newPassword) {
    try {
      const user = await Employee.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
      });

      if (!user) {
        throw AppError.badRequest('Invalid or expired reset token');
      }

      // Update password
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      await AuditLog.logAction({
        action: 'reset_password_confirm',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        status: 'success',
        severity: 'warning'
      });

      return { success: true };
    } catch (error) {
      logger.error('Confirm reset password error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const user = await Employee.findOne({
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: Date.now() }
      });

      if (!user) {
        throw AppError.badRequest('Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpiry = undefined;
      await user.save();

      await AuditLog.logAction({
        action: 'verify_email',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  // Two-factor authentication
  async enable2FA(userId) {
    try {
      const user = await Employee.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Generate TOTP secret
      const { authenticator } = require('otplib');
      const secret = authenticator.generateSecret();

      // Store secret temporarily
      user.twoFactorSecret = secret;
      await user.save();

      // Generate QR code
      const otpauth = authenticator.keyuri(
        user.email,
        process.env.APP_NAME || 'EmergencySystem',
        secret
      );

      return {
        secret,
        otpauth,
        qrCode: await this.generateQRCode(otpauth)
      };
    } catch (error) {
      logger.error('Enable 2FA error:', error);
      throw error;
    }
  }

  // Verify 2FA
  async verify2FA(userId, token) {
    try {
      const user = await Employee.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const { authenticator } = require('otplib');
      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret
      });

      if (!isValid) {
        throw AppError.unauthorized('Invalid 2FA token');
      }

      user.twoFactorEnabled = true;
      user.twoFactorSecret = undefined;
      await user.save();

      await AuditLog.logAction({
        action: 'enable_2fa',
        resource: 'employee',
        resourceId: userId,
        userId: userId,
        status: 'success',
        severity: 'warning'
      });

      return { success: true };
    } catch (error) {
      logger.error('Verify 2FA error:', error);
      throw error;
    }
  }

  // Generate QR code
  async generateQRCode(otpauth) {
    const QRCode = require('qrcode');
    try {
      return await QRCode.toDataURL(otpauth);
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw error;
    }
  }

  // Social login
  async socialLogin(provider, profile, ip, userAgent) {
    try {
      let user = await Employee.findOne({
        [`socialLogins.${provider}.id`]: profile.id
      });

      if (!user) {
        // Try to find by email
        user = await Employee.findOne({ email: profile.email });
        
        if (!user) {
          // Create new user
          user = new Employee({
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
            socialLogins: {
              [provider]: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar
              }
            },
            isEmailVerified: true
          });
          await user.save();
        } else {
          // Link social account to existing user
          user.socialLogins[provider] = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar
          };
          await user.save();
        }
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Update refresh token
      await Employee.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken,
        lastLogin: new Date(),
        lastLoginIP: ip
      });

      await AuditLog.logAction({
        action: 'social_login',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { provider, ip, userAgent },
        status: 'success'
      });

      return {
        user,
        ...tokens
      };
    } catch (error) {
      logger.error('Social login error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
