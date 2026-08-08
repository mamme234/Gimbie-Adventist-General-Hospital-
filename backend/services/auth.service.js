// services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Employee } = require('../models/Employee');
const { AuditLog } = require('../models/AuditLog');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('./email.service');
const smsService = require('./sms.service');

// In-memory token blacklist (no Redis)
const tokenBlacklist = new Map();

class AuthService {
  constructor() {
    // Clean blacklist every hour
    setInterval(() => this.cleanupBlacklist(), 3600000);
  }

  async login(email, password, ip, userAgent) {
    try {
      const user = await Employee.findOne({ email })
        .select('+password +refreshToken')
        .lean();

      if (!user) {
        logger.warn(`Login attempt failed: User not found - ${email}`);
        throw AppError.unauthorized('Invalid email or password');
      }

      if (user.status !== 'active') {
        logger.warn(`Login attempt failed: Account inactive - ${email}`);
        throw AppError.forbidden('Account is not active. Please contact support.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Login attempt failed: Invalid password - ${email}`);
        throw AppError.unauthorized('Invalid email or password');
      }

      const tokens = this.generateTokens(user);

      await Employee.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken,
        lastLogin: new Date(),
        lastLoginIP: ip
      });

      await AuditLog.logAction({
        action: 'login',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { ip, userAgent, method: 'password' },
        status: 'success'
      });

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

  async register(userData, ip, userAgent) {
    try {
      const existingUser = await Employee.findOne({ email: userData.email });
      if (existingUser) {
        throw AppError.conflict('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = new Employee({
        ...userData,
        password: hashedPassword,
        employeeId: await this.generateEmployeeId(),
        createdAt: new Date()
      });

      await user.save();

      await emailService.sendWelcomeEmail(user.email, user.firstName);

      await AuditLog.logAction({
        action: 'register',
        resource: 'employee',
        resourceId: user._id,
        userId: user._id,
        details: { ip, userAgent },
        status: 'success'
      });

      const tokens = this.generateTokens(user);

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

  async logout(userId, token, ip) {
    try {
      // Blacklist token (in-memory)
      this.blacklistToken(token);

      await Employee.findByIdAndUpdate(userId, {
        refreshToken: null
      });

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

  async refreshToken(refreshToken, ip) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const user = await Employee.findOne({
        _id: decoded.id,
        refreshToken: refreshToken
      }).lean();

      if (!user) {
        throw AppError.unauthorized('Invalid refresh token');
      }

      if (tokenBlacklist.has(refreshToken)) {
        throw AppError.unauthorized('Token has been revoked');
      }

      const tokens = this.generateTokens(user);

      await Employee.findByIdAndUpdate(user._id, {
        refreshToken: tokens.refreshToken
      });

      this.blacklistToken(refreshToken);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

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

  blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) return;

      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        tokenBlacklist.set(token, {
          expiresAt: new Date(decoded.exp * 1000)
        });
        setTimeout(() => {
          tokenBlacklist.delete(token);
        }, expiresIn * 1000);
      }
    } catch (error) {
      logger.error('Blacklist token error:', error);
    }
  }

  cleanupBlacklist() {
    const now = Date.now();
    for (const [token, data] of tokenBlacklist.entries()) {
      if (data.expiresAt && data.expiresAt.getTime() < now) {
        tokenBlacklist.delete(token);
      }
    }
  }

  async generateEmployeeId() {
    const year = new Date().getFullYear();
    const count = await Employee.countDocuments() + 1;
    return `EMP${year}${String(count).padStart(4, '0')}`;
  }

  async changePassword(userId, currentPassword, newPassword, ip) {
    try {
      const user = await Employee.findById(userId).select('+password');
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw AppError.unauthorized('Current password is incorrect');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = new Date();
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      await AuditLog.logAction({
        action: 'change_password',
        resource: 'employee',
        resourceId: userId,
        userId: userId,
        details: { ip },
        status: 'success',
        severity: 'warning'
      });

      await emailService.sendPasswordChangedEmail(user.email, user.firstName);

      return { success: true };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const user = await Employee.findOne({ email });
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000;

      await Employee.findByIdAndUpdate(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetTokenExpiry
      });

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

  async confirmResetPassword(token, newPassword) {
    try {
      const user = await Employee.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
      });

      if (!user) {
        throw AppError.badRequest('Invalid or expired reset token');
      }

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

  async enable2FA(userId) {
    try {
      const user = await Employee.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const { authenticator } = require('otplib');
      const secret = authenticator.generateSecret();

      user.twoFactorSecret = secret;
      await user.save();

      const otpauth = authenticator.keyuri(
        user.email,
        process.env.APP_NAME || 'Gimbie Hospital',
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

  async generateQRCode(otpauth) {
    const QRCode = require('qrcode');
    try {
      return await QRCode.toDataURL(otpauth);
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw error;
    }
  }

  async socialLogin(provider, profile, ip, userAgent) {
    try {
      let user = await Employee.findOne({
        [`socialLogins.${provider}.id`]: profile.id
      });

      if (!user) {
        user = await Employee.findOne({ email: profile.email });
        
        if (!user) {
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
          user.socialLogins[provider] = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar
          };
          await user.save();
        }
      }

      const tokens = this.generateTokens(user);

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
