// controllers/auth.controller.js
const { logger } = require('../utils/logger');
const { response } = require('../utils/response');
const authService = require('../services/auth.service');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { ip, userAgent } = req;

      const result = await authService.login(email, password, ip, userAgent);
      
      response.success(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  // Register
  async register(req, res, next) {
    try {
      const userData = req.body;
      const { ip, userAgent } = req;

      const result = await authService.register(userData, ip, userAgent);
      
      response.success(res, result, 'Registration successful', 201);
    } catch (error) {
      logger.error('Register error:', error);
      next(error);
    }
  }

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { ip } = req;

      const result = await authService.refreshToken(refreshToken, ip);
      
      response.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Refresh token error:', error);
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const { ip } = req;

      const result = await authService.changePassword(userId, currentPassword, newPassword, ip);
      
      response.success(res, result, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }

  // Forgot password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);
      
      response.success(res, result, 'Password reset email sent');
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  // Reset password
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const result = await authService.resetPassword(token, password);
      
      response.success(res, result, 'Password reset successfully');
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const userId = req.user.id;
      const token = req.headers.authorization?.split(' ')[1];
      const { ip } = req;

      const result = await authService.logout(userId, token, ip);
      
      response.success(res, result, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  // Get current user
  async getCurrentUser(req, res, next) {
    try {
      const user = req.user;
      
      response.success(res, { user }, 'User retrieved successfully');
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  }

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const result = await authService.updateProfile(userId, updates);
      
      response.success(res, result, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  // Verify email
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      const result = await authService.verifyEmail(token);
      
      response.success(res, result, 'Email verified successfully');
    } catch (error) {
      logger.error('Verify email error:', error);
      next(error);
    }
  }

  // Resend verification
  async resendVerification(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await authService.resendVerification(userId);
      
      response.success(res, result, 'Verification email sent');
    } catch (error) {
      logger.error('Resend verification error:', error);
      next(error);
    }
  }

  // Enable 2FA
  async enable2FA(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await authService.enable2FA(userId);
      
      response.success(res, result, '2FA setup initiated');
    } catch (error) {
      logger.error('Enable 2FA error:', error);
      next(error);
    }
  }

  // Verify 2FA
  async verify2FA(req, res, next) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      const result = await authService.verify2FA(userId, token);
      
      response.success(res, result, '2FA verified successfully');
    } catch (error) {
      logger.error('Verify 2FA error:', error);
      next(error);
    }
  }

  // Disable 2FA
  async disable2FA(req, res, next) {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      const result = await authService.disable2FA(userId, token);
      
      response.success(res, result, '2FA disabled successfully');
    } catch (error) {
      logger.error('Disable 2FA error:', error);
      next(error);
    }
  }

  // Authentication middleware
  authenticate(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw AppError.unauthorized('Authentication required');
      }

      const user = authService.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
