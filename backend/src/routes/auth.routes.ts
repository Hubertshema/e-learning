import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public auth endpoints
router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/refresh-token', validate(RefreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Email Verification & Password Reset
router.post('/forgot-password', validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(ResetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validate(VerifyEmailSchema), authController.verifyEmail);

// Authenticated endpoints
router.get('/me', authenticate, authController.me);
router.post('/send-verification-email', authenticate, authController.sendVerificationEmail);

export default router;
