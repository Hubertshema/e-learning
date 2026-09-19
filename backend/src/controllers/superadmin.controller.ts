import { Request, Response, NextFunction } from 'express';
import { superadminService } from '../services/superadmin.service.js';
import { sendSuccess } from '../utils/response.util.js';
import {
  ToggleUserStatusInput,
  ApproveTeacherInput,
  RejectTeacherInput,
  CourseStatusInput,
  UpdateEnrollmentStatusInput,
  ExtendEnrollmentInput,
  UpdateStudentLevelInput,
  VerifyPaymentInput,
  ResetUserPasswordInput,
  UpdateSettingsInput,
} from '../validators/superadmin.validator.js';
import { UserStatus, PaymentStatus, EnrollmentStatus, CEFRLevel } from '@prisma/client';
import { prisma } from '../config/database.js';

export class SuperadminController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await superadminService.getOverview();
      sendSuccess(res, stats, 'Platform overview statistics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTeachers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const status = req.query.status as UserStatus | undefined;
      const isApproved =
        req.query.isApproved !== undefined ? req.query.isApproved === 'true' : undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.listTeachers({
        page,
        limit,
        status,
        isApproved,
        search,
      });

      sendSuccess(res, result.teachers, 'Teachers retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async approveTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const teacherUserId = req.params.id;
      const { hourlyRate } = req.body as ApproveTeacherInput;
      const ip = req.ip || req.socket.remoteAddress;

      const result = await superadminService.approveTeacher(
        adminUserId,
        teacherUserId,
        hourlyRate,
        ip
      );

      sendSuccess(res, result, 'Teacher approved successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const teacherUserId = req.params.id;
      const { reason } = req.body as RejectTeacherInput;
      const ip = req.ip || req.socket.remoteAddress;

      const result = await superadminService.rejectTeacher(
        adminUserId,
        teacherUserId,
        reason,
        ip
      );

      sendSuccess(res, result, 'Teacher application rejected');
    } catch (error) {
      next(error);
    }
  }

  async getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const status = req.query.status as UserStatus | undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.listStudents({ page, limit, status, search });

      sendSuccess(res, result.students, 'Students retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateStudentLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const studentUserId = req.params.id;
      const { level, reason } = req.body as UpdateStudentLevelInput;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await superadminService.updateStudentLevel(
        adminUserId,
        studentUserId,
        level as CEFRLevel,
        reason,
        ip
      );

      sendSuccess(res, updated, `Student CEFR level updated to ${level}`);
    } catch (error) {
      next(error);
    }
  }

  async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const targetUserId = req.params.id;
      const { newPassword } = req.body as ResetUserPasswordInput;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await superadminService.resetUserPassword(
        adminUserId,
        targetUserId,
        newPassword,
        ip
      );

      sendSuccess(res, updated, 'Password reset successfully for user');
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const targetUserId = req.params.id;
      const { status, reason } = req.body as ToggleUserStatusInput;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await superadminService.toggleUserStatus(
        adminUserId,
        targetUserId,
        status,
        reason,
        ip
      );

      sendSuccess(res, { user: updated }, `User status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const isPublished =
        req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.listCourses({ page, limit, isPublished, search });

      sendSuccess(res, result.courses, 'Courses retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateCourseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const courseId = req.params.id;
      const { isPublished, featured } = req.body as CourseStatusInput;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await superadminService.updateCourseStatus(
        adminUserId,
        courseId,
        isPublished,
        featured,
        ip
      );

      sendSuccess(res, { course: updated }, 'Course status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const status = req.query.status as PaymentStatus | undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.listPayments({ page, limit, status, search });

      sendSuccess(res, result.payments, 'Payments retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const paymentId = req.params.id;
      const { status, notes } = req.body as VerifyPaymentInput;
      const ip = req.ip || req.socket.remoteAddress;

      const result = await superadminService.verifyPayment(
        adminUserId,
        paymentId,
        status,
        notes,
        ip
      );

      sendSuccess(res, result, `Payment marked as ${status} and access updated`);
    } catch (error) {
      next(error);
    }
  }

  async getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const status = req.query.status as EnrollmentStatus | undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.listEnrollments({ page, limit, status, search });

      sendSuccess(res, result.enrollments, 'Enrollments retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateEnrollmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const enrollmentId = req.params.id;
      const { status, expiresAt } = req.body as UpdateEnrollmentStatusInput;
      const ip = req.ip || req.socket.remoteAddress;

      const result = await superadminService.updateEnrollmentStatus(
        adminUserId,
        enrollmentId,
        status,
        expiresAt ? new Date(expiresAt) : undefined,
        ip
      );

      sendSuccess(res, result, `Enrollment status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async extendEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const enrollmentId = req.params.id;
      const { days } = req.body as ExtendEnrollmentInput;
      const ip = req.ip || req.socket.remoteAddress;

      const result = await superadminService.extendEnrollment(
        adminUserId,
        enrollmentId,
        days,
        ip
      );

      sendSuccess(res, result, `Enrollment access extended by ${days} days`);
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await superadminService.getSettings();
      sendSuccess(res, settings, 'Platform settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const input = req.body as UpdateSettingsInput;
      const ip = req.ip || req.socket.remoteAddress;

      const updated = await superadminService.updateSettings(adminUserId, input, ip);
      sendSuccess(res, updated, 'Platform settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const action = req.query.action as string | undefined;
      const entity = req.query.entity as string | undefined;

      const result = await superadminService.listAuditLogs({ page, limit, action, entity });

      sendSuccess(res, result.auditLogs, 'Audit logs retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await superadminService.getReports();
      sendSuccess(res, reports, 'Platform reports retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getEmailLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const status = req.query.status as string | undefined;
      const template = req.query.template as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await superadminService.getEmailLogs({ page, limit, status, template, search });
      sendSuccess(res, { logs: result.data, stats: result.stats }, 'Email delivery logs retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getEmailLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await superadminService.getEmailLogById(req.params.id);
      sendSuccess(res, log, 'Email log details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async sendAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await superadminService.sendAnnouncement(adminUserId, req.body, ip);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getEmailSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await superadminService.getEmailSettings();
      sendSuccess(res, settings, 'Email configuration retrieved');
    } catch (error) {
      next(error);
    }
  }

  async sendTestEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetEmail } = req.body;
      const superadminId = (req as any).user?.id || 'superadmin';
      const result = await superadminService.sendTestEmail(targetEmail, superadminId);
      sendSuccess(res, result, 'Test email dispatched successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNewsletterSubscribers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
      const search = (req.query.search as string) || '';

      const whereClause: any = {};
      if (search) {
        whereClause.email = { contains: search, mode: 'insensitive' };
      }

      const [subscribers, total] = await Promise.all([
        prisma.newsletterSubscriber.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { subscribedAt: 'desc' },
        }),
        prisma.newsletterSubscriber.count({ where: whereClause }),
      ]);

      sendSuccess(
        res,
        { subscribers, total },
        'Newsletter subscribers retrieved successfully',
        200,
        { page, limit, total, totalPages: Math.ceil(total / limit) }
      );
    } catch (error) {
      next(error);
    }
  }

  async getContactMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as any;
      const search = (req.query.search as string) || '';

      const whereClause: any = {};
      if (status && status !== 'ALL') {
        whereClause.status = status;
      }
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [messages, total, unreadCount] = await Promise.all([
        prisma.contactMessage.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.contactMessage.count({ where: whereClause }),
        prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      ]);

      sendSuccess(
        res,
        { messages, total, unreadCount },
        'Contact messages retrieved successfully',
        200,
        { page, limit, total, totalPages: Math.ceil(total / limit) }
      );
    } catch (error) {
      next(error);
    }
  }

  async updateContactMessageStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updated = await prisma.contactMessage.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
      });

      sendSuccess(res, updated, 'Contact message updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const superadminController = new SuperadminController();



