import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel } from '../models/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';

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
    const payload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token hash in DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await UserModel.saveRefreshToken(user.id, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
