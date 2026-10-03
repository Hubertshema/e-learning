import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel } from '../models/user.model.js';
import { PasswordResetModel } from '../models/password-reset.model.js';
import { emailService } from './email.service.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { cache } from '../config/cache.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ email, password, firstName, lastName, role = 'STUDENT' }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const error = new Error('A user with this email address already exists');
      error.statusCode = 409;
      error.code = 'USER_ALREADY_EXISTS';
      throw error;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    });

    const tokens = await this.generateTokenPair(user);

    return { user, tokens };
  }

  /**
   * Log in an existing user
   */
  static async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (user.status === 'SUSPENDED') {
      const error = new Error('Account is suspended. Please contact support.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_SUSPENDED';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Omit sensitive hash
    delete user.passwordHash;

    const tokens = await this.generateTokenPair(user);

    return { user, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refresh(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await UserModel.findRefreshToken(tokenHash);

    if (!storedToken) {
      const error = new Error('Refresh token has been revoked or expired');
      error.statusCode = 401;
      error.code = 'TOKEN_REVOKED';
      throw error;
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || user.status === 'SUSPENDED') {
      const error = new Error('User account is invalid or suspended');
      error.statusCode = 401;
      error.code = 'USER_INACTIVE';
      throw error;
    }

    // Revoke old refresh token and create new pair
    await UserModel.revokeRefreshToken(tokenHash);
    const tokens = await this.generateTokenPair(user);

    return { user, tokens };
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(refreshToken) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await UserModel.revokeRefreshToken(tokenHash);
    }
    return true;
  }

  /**
   * Helper to generate Access & Refresh token pair
   */
  static async generateTokenPair(user) {
    const sessionId = crypto.randomUUID();
    
    // Revoke all previous refresh tokens to enforce single active session
    await UserModel.revokeAllRefreshTokens(user.id);
    
    await UserModel.update(user.id, { activeSessionId: sessionId });
    cache.set(`session_${user.id}`, sessionId, 7 * 24 * 60 * 60);

    const payload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      sessionId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token hash in DB for 30 days
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await UserModel.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Change user password
   */
  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await UserModel.findWithPasswordById(userId);
    if (!user) {
      const error = new Error('User account not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 400;
      error.code = 'INVALID_PASSWORD';
      throw error;
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    await UserModel.update(userId, { passwordHash: newHash });
    return true;
  }

  /**
   * Request password reset link
   */
  static async forgotPassword(email) {
    if (!email || !email.includes('@')) {
      const err = new Error('A valid email address is required');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      // Don't disclose if user doesn't exist
      return { sent: true };
    }

    const resetRecord = await PasswordResetModel.createToken(user.id, user.email);
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';

    // Dispatch reset link via email asynchronously
    emailService.sendPasswordResetEmail({
      email: user.email,
      name: fullName,
      resetToken: resetRecord.token,
    }).catch(err => console.error('Error sending reset email:', err));

    return { sent: true };
  }

  /**
   * Reset password with valid token
   */
  static async resetPassword({ token, password }) {
    if (!token) {
      const err = new Error('Reset token is required');
      err.statusCode = 400;
      throw err;
    }
    const hasLength = typeof password === 'string' && password.length >= 8;
    const hasUpper = typeof password === 'string' && /[A-Z]/.test(password);
    const hasNumber = typeof password === 'string' && /[0-9]/.test(password);
    const hasSymbol = typeof password === 'string' && /[^A-Za-z0-9]/.test(password);

    if (!hasLength || !hasUpper || !hasNumber || !hasSymbol) {
      const err = new Error(
        'Weak passwords are prohibited. Only the strongest passwords are accepted (minimum 8 characters with at least one uppercase letter, one number, and one special symbol).'
      );
      err.statusCode = 400;
      err.code = 'WEAK_PASSWORD_PROHIBITED';
      throw err;
    }

    const record = await PasswordResetModel.findValidToken(token);
    if (!record) {
      const err = new Error('This password reset link is invalid or has expired. Please request a new one.');
      err.statusCode = 400;
      err.code = 'INVALID_OR_EXPIRED_TOKEN';
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(password, salt);

    await UserModel.update(record.userId, { passwordHash: newHash });
    await PasswordResetModel.markUsed(record.id);

    // Send security alert
    const fullName = `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Student';
    emailService.sendPasswordChangedAlert({
      email: record.email,
      name: fullName,
    }).catch(err => console.error('Error sending password changed alert:', err));

    return { success: true };
  }
}
