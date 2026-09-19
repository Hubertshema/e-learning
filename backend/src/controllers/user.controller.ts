import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import { sendSuccess } from '../utils/response.util.js';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/user.validator.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { AppError } from '../middleware/error.middleware.js';
import { auditService } from '../services/audit.service.js';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await userRepository.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const { passwordHash: _, ...safeUser } = user;
      sendSuccess(res, { user: safeUser }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = req.body as UpdateProfileInput;

      // Update core user
      await userRepository.updateUser(userId, {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.timezone !== undefined && { timezone: input.timezone }),
        ...(input.preferredLanguage !== undefined && { preferredLanguage: input.preferredLanguage }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      });

      // Update role profiles
      if (req.user!.role === 'TEACHER') {
        await userRepository.updateTeacherProfile(userId, {
          ...(input.headline !== undefined && { headline: input.headline }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.qualifications && { qualifications: input.qualifications }),
          ...(input.specialties && { specialties: input.specialties }),
          ...(input.experienceYears !== undefined && { experienceYears: input.experienceYears }),
          ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
          ...(input.languagesSpoken && { languagesSpoken: input.languagesSpoken }),
          ...(input.levelsTaught && { levelsTaught: input.levelsTaught as any }),
          ...(input.profileVisibility && { profileVisibility: input.profileVisibility }),
        });
      } else if (req.user!.role === 'STUDENT') {
        await userRepository.updateStudentProfile(userId, {
          ...(input.nativeLanguage !== undefined && { nativeLanguage: input.nativeLanguage }),
          ...(input.currentLevel && { currentLevel: input.currentLevel }),
          ...(input.targetLevel !== undefined && { targetLevel: input.targetLevel }),
          ...(input.learningGoals && { learningGoals: input.learningGoals }),
          ...(input.preferredSchedule !== undefined && { preferredSchedule: input.preferredSchedule }),
          ...(input.targetSkills && { targetSkills: input.targetSkills }),
        });
      }

      await auditService.log({
        userId,
        action: 'PROFILE_UPDATED',
        entity: 'USER',
        entityId: userId,
        metadata: { role: req.user!.role },
      });

      const refreshed = await userRepository.findById(userId);
      const { passwordHash: _, ...safeUser } = refreshed!;

      sendSuccess(res, { user: safeUser }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        throw new AppError('Avatar URL is required', 400);
      }

      const updatedUser = await userRepository.updateUser(userId, { avatarUrl });

      await auditService.log({
        userId,
        action: 'PROFILE_PHOTO_UPDATED',
        entity: 'USER',
        entityId: userId,
      });

      const { passwordHash: _, ...safeUser } = updatedUser;
      sendSuccess(res, { user: safeUser }, 'Profile photo updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async removePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updatedUser = await userRepository.updateUser(userId, { avatarUrl: null });

      await auditService.log({
        userId,
        action: 'PROFILE_PHOTO_REMOVED',
        entity: 'USER',
        entityId: userId,
      });

      const { passwordHash: _, ...safeUser } = updatedUser;
      sendSuccess(res, { user: safeUser }, 'Profile photo removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body as ChangePasswordInput;

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new AppError('Current password does not match.', 400, 'INVALID_CURRENT_PASSWORD');
      }

      const newHash = await hashPassword(newPassword);
      await userRepository.updateUser(userId, { passwordHash: newHash });

      await auditService.log({
        userId,
        action: 'PASSWORD_CHANGED',
        entity: 'USER',
        entityId: userId,
      });

      sendSuccess(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await userRepository.getActiveSessions(userId);
      sendSuccess(res, data, 'Active sessions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await userRepository.revokeAllSessions(userId);

      await auditService.log({
        userId,
        action: 'LOGOUT_ALL_DEVICES',
        entity: 'USER',
        entityId: userId,
      });

      sendSuccess(res, null, 'All other sessions revoked successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
