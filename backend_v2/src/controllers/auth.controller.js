import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';
import { UserModel } from '../models/user.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return sendError(res, 'Email, password, first name and last name are required', 400, 'VALIDATION_ERROR');
      }

      const result = await AuthService.register({ email, password, firstName, lastName, role });
      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return sendError(res, 'Email and password are required', 400, 'VALIDATION_ERROR');
      }

      const result = await AuthService.login({ email, password });
      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required', 400, 'VALIDATION_ERROR');
      }

      const result = await AuthService.refresh(refreshToken);
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async me(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      if (!user) {
        return sendError(res, 'User account not found', 401, 'USER_INACTIVE');
      }
      return sendSuccess(res, { user }, 'Current user profile');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return sendError(res, 'Current password and new password are required', 400, 'VALIDATION_ERROR');
      }
      if (newPassword.length < 8) {
        return sendError(res, 'New password must be at least 8 characters long', 400, 'VALIDATION_ERROR');
      }

      await AuthService.changePassword(req.user.id, { currentPassword, newPassword });
      return sendSuccess(res, null, 'Password updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body || {};
      if (!email) {
        return sendError(res, 'Email address is required', 400, 'VALIDATION_ERROR');
      }
      const result = await AuthService.forgotPassword(email);
      return sendSuccess(res, result, 'If your email is registered, password reset instructions have been sent.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body || {};
      if (!token || !password) {
        return sendError(res, 'Reset token and new password are required', 400, 'VALIDATION_ERROR');
      }
      const result = await AuthService.resetPassword({ token, password });
      return sendSuccess(res, result, 'Password successfully reset. You may now log in.');
    } catch (err) {
      next(err);
    }
  }
}
