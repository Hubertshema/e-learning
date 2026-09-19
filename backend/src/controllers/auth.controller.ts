import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { tokenService } from '../services/token.service.js';
import { sendSuccess } from '../utils/response.util.js';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../validators/auth.validator.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.register(input, ip, userAgent);

      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(input, ip, userAgent);

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.googleLogin(input, ip, userAgent);

      sendSuccess(res, result, 'Google authentication successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await tokenService.rotateRefreshToken(refreshToken);

      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await authService.getCurrentUser(userId);

      sendSuccess(res, { user }, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as Partial<RefreshTokenInput>;
      const userId = req.user?.userId;

      if (refreshToken) {
        await authService.logout(refreshToken, userId);
      }

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async sendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await authService.sendVerificationEmail(userId);
      sendSuccess(res, null, 'Verification email dispatched successfully');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as VerifyEmailInput;
      const result = await authService.verifyEmail(token);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ForgotPasswordInput;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as ResetPasswordInput;
      const result = await authService.resetPassword(token, password);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
