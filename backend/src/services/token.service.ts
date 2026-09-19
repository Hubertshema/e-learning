import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { JwtPayload, AuthTokens, RoleType, UserStatusType } from '../types/auth.types.js';
import { tokenRepository } from '../repositories/token.repository.js';
import { AppError } from '../middleware/error.middleware.js';

export class TokenService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
      expiresIn: env.JWT.ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  async generateAuthTokens(user: {
    id: string;
    email: string;
    role: RoleType;
    status: UserStatusType;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshTokenString();

    // Calculate expiry date: default 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save refresh token to database
    await tokenRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT.ACCESS_EXPIRES_IN,
    };
  }

  async rotateRefreshToken(oldRefreshToken: string): Promise<{
    tokens: AuthTokens;
    user: JwtPayload;
  }> {
    const tokenRecord = await tokenRepository.findRefreshToken(oldRefreshToken);

    if (!tokenRecord) {
      throw new AppError('Invalid refresh token.', 401, 'INVALID_TOKEN');
    }

    if (tokenRecord.revoked) {
      // Possible token reuse attack: revoke all tokens for this user
      await tokenRepository.revokeAllUserTokens(tokenRecord.userId);
      throw new AppError(
        'Compromised refresh token detected. All sessions terminated. Please log in again.',
        401,
        'SECURITY_BREACH'
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      await tokenRepository.revokeToken(oldRefreshToken);
      throw new AppError('Refresh token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }

    const { user } = tokenRecord;
    const newRefreshToken = this.generateRefreshTokenString();

    // Revoke old token and link to new replacement
    await tokenRepository.revokeToken(oldRefreshToken, newRefreshToken);

    // Create new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await tokenRepository.createRefreshToken(user.id, newRefreshToken, expiresAt);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as RoleType,
      status: user.status as UserStatusType,
    };

    const accessToken = this.generateAccessToken(payload);

    return {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: env.JWT.ACCESS_EXPIRES_IN,
      },
      user: payload,
    };
  }

  async revokeToken(token: string): Promise<void> {
    await tokenRepository.revokeToken(token);
  }
}

export const tokenService = new TokenService();
