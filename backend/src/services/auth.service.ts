import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { tokenService } from './token.service.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { emailService } from './email/email.service.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { AppError } from '../middleware/error.middleware.js';
import { AuthTokens, AuthenticatedUser, RoleType, UserStatusType } from '../types/auth.types.js';
import { prisma } from '../config/database.js';

export class AuthService {
  /**
   * Helper to hash raw tokens before storing in database
   */
  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async register(
    input: RegisterInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: AuthenticatedUser; tokens: AuthTokens; verificationSent: boolean }> {
    // Check if user already exists
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    // Initial status:
    // Students get ACTIVE immediately.
    // Teachers get PENDING_APPROVAL based on configuration.
    const initialStatus: UserStatusType = input.role === 'TEACHER' ? 'PENDING_APPROVAL' : 'ACTIVE';
    const isTeacherApproved = false;

    const newUser = await userRepository.createUserWithProfile(
      input,
      passwordHash,
      initialStatus,
      isTeacherApproved
    );

    // Initialize notification preferences
    try {
      await notificationService.getPreferences(newUser.id);
    } catch (e) {
      console.warn('Failed initializing notification preferences', e);
    }

    // Generate Email Verification Token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawVerificationToken);
    const expiresMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || '30', 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    try {
      await prisma.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt,
        },
      });
    } catch (tokenErr) {
      console.warn('Could not persist verification token:', tokenErr);
    }

    // Send Welcome & Verification Emails based on role
    if (input.role === 'STUDENT') {
      // 1. In-App Notification
      await notificationService.createNotification({
        userId: newUser.id,
        title: 'Welcome to FluentEdge Academy!',
        message: 'Your student account has been created. Start exploring your courses and lessons.',
        type: 'WELCOME',
      });

      // 2. Welcome & Verification Emails
      await emailService.sendTemplate({
        to: newUser.email,
        userId: newUser.id,
        template: 'WelcomeEmail',
        data: {
          studentName: `${newUser.firstName} ${newUser.lastName}`,
          name: `${newUser.firstName} ${newUser.lastName}`,
        },
      });

      await emailService.sendTemplate({
        to: newUser.email,
        userId: newUser.id,
        template: 'EmailVerificationEmail',
        data: {
          name: newUser.firstName,
          token: rawVerificationToken,
        },
        isSecurityCritical: true,
      });
    } else if (input.role === 'TEACHER') {
      // Teacher registration acknowledgement
      await notificationService.createNotification({
        userId: newUser.id,
        title: 'Instructor Application Submitted',
        message: 'Your teaching credentials are under review by the academic administrator.',
        type: 'TEACHER_APPLICATION',
      });

      await emailService.sendTemplate({
        to: newUser.email,
        userId: newUser.id,
        template: 'TeacherRegistrationEmail',
        data: {
          teacherName: `${newUser.firstName} ${newUser.lastName}`,
        },
      });
    }

    // Audit log
    await auditService.log({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      entity: 'USER',
      entityId: newUser.id,
      ipAddress,
      userAgent,
      metadata: { role: newUser.role, status: newUser.status },
    });

    const tokens = await tokenService.generateAuthTokens({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as RoleType,
      status: newUser.status as UserStatusType,
    });

    const formattedUser: AuthenticatedUser = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role as RoleType,
      status: newUser.status as UserStatusType,
      isVerified: newUser.isVerified,
      avatarUrl: newUser.avatarUrl,
      teacherProfile: (newUser as any).teacherProfile
        ? {
            id: (newUser as any).teacherProfile.id,
            isApproved: (newUser as any).teacherProfile.isApproved,
            headline: (newUser as any).teacherProfile.headline,
          }
        : null,
      studentProfile: (newUser as any).studentProfile
        ? {
            id: (newUser as any).studentProfile.id,
            currentLevel: (newUser as any).studentProfile.currentLevel,
          }
        : null,
    };

    return { user: formattedUser, tokens, verificationSent: true };
  }

  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account is currently suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Audit log
    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const tokens = await tokenService.generateAuthTokens({
      id: user.id,
      email: user.email,
      role: user.role as RoleType,
      status: user.status as UserStatusType,
    });

    const formattedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as RoleType,
      status: user.status as UserStatusType,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      teacherProfile: user.teacherProfile
        ? {
            id: user.teacherProfile.id,
            isApproved: user.teacherProfile.isApproved,
            headline: user.teacherProfile.headline,
          }
        : null,
      studentProfile: user.studentProfile
        ? {
            id: user.studentProfile.id,
            currentLevel: user.studentProfile.currentLevel,
          }
        : null,
    };

    return { user: formattedUser, tokens };
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as RoleType,
      status: user.status as UserStatusType,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      teacherProfile: user.teacherProfile
        ? {
            id: user.teacherProfile.id,
            isApproved: user.teacherProfile.isApproved,
            headline: user.teacherProfile.headline,
          }
        : null,
      studentProfile: user.studentProfile
        ? {
            id: user.studentProfile.id,
            currentLevel: user.studentProfile.currentLevel,
          }
        : null,
    };
  }

  /**
   * Resend verification email
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    if (user.isVerified) {
      throw new AppError('Email address is already verified.', 400, 'ALREADY_VERIFIED');
    }

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawVerificationToken);
    const expiresMinutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || '30', 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    // Invalidate previous unused verification tokens
    await prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    await emailService.sendTemplate({
      to: user.email,
      userId: user.id,
      template: 'EmailVerificationEmail',
      data: {
        name: user.firstName,
        token: rawVerificationToken,
      },
      isSecurityCritical: true,
    });
  }

  /**
   * Verify email using raw token
   */
  async verifyEmail(rawToken: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AppError('Invalid verification link.', 400, 'INVALID_TOKEN');
    }

    if (tokenRecord.usedAt) {
      throw new AppError('This verification link has already been used.', 400, 'TOKEN_USED');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('Verification link has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    // Mark token as used and set user as verified
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { isVerified: true },
      }),
    ]);

    await notificationService.createNotification({
      userId: tokenRecord.userId,
      title: 'Email Verified Successfully',
      message: 'Your email address is now verified. You have full access to learning features.',
      type: 'EMAIL_VERIFIED',
    });

    return { success: true, message: 'Email verified successfully.' };
  }

  /**
   * Request password reset token (does not reveal if email exists)
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = await userRepository.findByEmail(email);

    if (user) {
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawResetToken);
      const expiresMinutes = parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '30', 10);
      const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

      // Invalidate existing unused reset tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await emailService.sendTemplate({
        to: user.email,
        userId: user.id,
        template: 'PasswordResetEmail',
        data: {
          name: user.firstName,
          token: rawResetToken,
        },
        isSecurityCritical: true,
      });
    }

    return {
      success: true,
      message: 'If an account exists with that email address, password reset instructions have been sent.',
    };
  }

  /**
   * Reset password using raw token
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new AppError('Invalid or expired password reset link.', 400, 'INVALID_TOKEN');
    }

    if (tokenRecord.usedAt) {
      throw new AppError('This password reset link has already been used.', 400, 'TOKEN_USED');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('Password reset link has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password, mark token used, revoke all refresh tokens for security
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true },
      }),
    ]);

    // Send security alert notifications
    await notificationService.notifyUser({
      userId: tokenRecord.userId,
      type: 'SECURITY_ALERT',
      title: 'Password Changed Successfully',
      message: 'Your account password was recently changed. If you did not make this change, please contact support.',
      emailTemplate: 'PasswordChangedEmail',
      emailData: {
        name: tokenRecord.user.firstName,
      },
      isSecurityCritical: true,
    });

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  async logout(refreshToken: string, userId?: string): Promise<void> {
    if (refreshToken) {
      await tokenService.revokeToken(refreshToken);
    }
    if (userId) {
      await auditService.log({
        userId,
        action: 'USER_LOGOUT',
        entity: 'USER',
        entityId: userId,
      });
    }
  }
}

export const authService = new AuthService();
