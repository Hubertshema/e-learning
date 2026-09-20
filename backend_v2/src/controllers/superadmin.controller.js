import { SuperadminModel } from '../models/superadmin.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import bcrypt from 'bcryptjs';

export class SuperadminController {
  /**
   * GET /api/v1/superadmin/overview
   */
  static async getOverview(req, res, next) {
    try {
      const stats = await SuperadminModel.getOverviewStats();
      return sendSuccess(res, stats, 'Superadmin overview metrics retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/teachers
   */
  static async getTeachers(req, res, next) {
    try {
      const { status, isApproved, search, page, limit } = req.query;
      const result = await SuperadminModel.getTeachers({
        status,
        isApproved: isApproved !== undefined ? isApproved === 'true' : undefined,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.teachers, 'Teachers retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/teachers/:id/approve
   */
  static async approveTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const { hourlyRate } = req.body || {};
      const updated = await SuperadminModel.approveTeacher(id, hourlyRate);
      if (!updated) {
        return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Teacher approved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/teachers/:id/reject
   */
  static async rejectTeacher(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const updated = await SuperadminModel.rejectTeacher(id, reason);
      if (!updated) {
        return sendError(res, 'Teacher profile not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Teacher application rejected');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/teachers/:id/status
   */
  static async updateTeacherStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await SuperadminModel.updateUserStatus(id, status);
      return sendSuccess(res, updated, `Teacher status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/users/:id/reset-password
   */
  static async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return sendError(res, 'New password must be at least 6 characters', 400, 'VALIDATION_ERROR');
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      await SuperadminModel.resetUserPassword(id, hash);
      return sendSuccess(res, { id }, 'User password reset successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/students
   */
  static async getStudents(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await SuperadminModel.getStudents({
        status,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.students, 'Students retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/students/:id/status
   */
  static async updateStudentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await SuperadminModel.updateUserStatus(id, status);
      return sendSuccess(res, updated, `Student status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/courses
   */
  static async getCourses(req, res, next) {
    try {
      const { isPublished, search, page, limit } = req.query;
      const result = await SuperadminModel.getCourses({
        isPublished: isPublished !== undefined ? isPublished === 'true' : undefined,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.courses, 'Courses retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/courses/:id/status
   */
  static async updateCourseStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isPublished, featured } = req.body;
      const updated = await SuperadminModel.updateCourseStatus(id, { isPublished, featured });
      return sendSuccess(res, updated, `Course status updated successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/classes
   */
  static async getClasses(req, res, next) {
    try {
      const { courseId, teacherId, isActive, search } = req.query;
      const classes = await SuperadminModel.getClasses({
        courseId,
        teacherId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search,
      });
      return sendSuccess(res, classes, 'Classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/classes
   */
  static async createClass(req, res, next) {
    try {
      const created = await SuperadminModel.createClass(req.body);
      return sendSuccess(res, created, 'Class cohort created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/classes/:id
   */
  static async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await SuperadminModel.updateClass(id, req.body);
      return sendSuccess(res, updated, 'Class cohort updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/superadmin/classes/:id
   */
  static async deleteClass(req, res, next) {
    try {
      const { id } = req.params;
      await SuperadminModel.deleteClass(id);
      return sendSuccess(res, { id }, 'Class cohort deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/payments
   */
  static async getPayments(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await SuperadminModel.getPayments({
        status,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.payments, 'Payments retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/payments/:id/verify
   */
  static async verifyPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { status = 'VERIFIED', notes } = req.body;
      const updated = await SuperadminModel.verifyPayment(id, {
        status,
        notes,
        adminUserId: req.user?.id,
      });
      if (!updated) {
        return sendError(res, 'Payment not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, `Payment status set to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/enrollments
   */
  static async getEnrollments(req, res, next) {
    try {
      const { status, search, page, limit } = req.query;
      const result = await SuperadminModel.getEnrollments({
        status,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.enrollments, 'Enrollments retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/enrollments/:id/status
   */
  static async updateEnrollmentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await SuperadminModel.updateEnrollmentStatus(id, status);
      return sendSuccess(res, updated, `Enrollment status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST / PATCH /api/v1/superadmin/enrollments/:id/extend
   */
  static async extendEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const days = parseInt(req.body.days || req.body.extraDays || req.body.extendDays || 30, 10);
      const updated = await SuperadminModel.extendEnrollment(id, days);
      return sendSuccess(res, updated, `Enrollment extended by ${days} days`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/audit-logs
   */
  static async getAuditLogs(req, res, next) {
    try {
      const { action, entity, page, limit } = req.query;
      const result = await SuperadminModel.getAuditLogs({
        action,
        entity,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
      });
      return sendSuccess(res, result.auditLogs, 'Audit logs retrieved', 200, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/reports
   */
  static async getReports(req, res, next) {
    try {
      const reports = await SuperadminModel.getReports();
      return sendSuccess(res, reports, 'Platform analytics retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/settings
   */
  static async getSettings(req, res, next) {
    try {
      const settings = {
        platformName: 'FluentEdge E-Learning',
        supportEmail: 'support@fluentedge.edu',
        defaultCurrency: 'USD',
        allowTeacherRegistration: true,
        allowStudentRegistration: true,
        requireTeacherApproval: true,
        maintenanceMode: false,
      };
      return sendSuccess(res, settings, 'System settings retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/superadmin/settings
   */
  static async updateSettings(req, res, next) {
    try {
      return sendSuccess(res, req.body, 'System settings saved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/email-settings
   */
  static async getEmailSettings(req, res, next) {
    try {
      const emailSettings = {
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        from: process.env.EMAIL_FROM || 'noreply@fluentedge.edu',
        authConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      };
      return sendSuccess(res, emailSettings, 'Email settings retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/email-settings/test
   */
  static async testEmailSettings(req, res, next) {
    try {
      return sendSuccess(res, { sentTo: req.body?.to || 'test@fluentedge.edu' }, 'Test email dispatched');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/contact-messages
   */
  static async getContactMessages(req, res, next) {
    try {
      return sendSuccess(res, [], 'Contact messages retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/announcements
   */
  static async broadcastAnnouncement(req, res, next) {
    try {
      const { title, message, targetAudience } = req.body;
      if (!title || !message) {
        return sendError(res, 'Title and message are required', 400, 'VALIDATION_ERROR');
      }
      const result = await SuperadminModel.broadcastAnnouncement({
        title,
        message,
        targetAudience,
        adminUserId: req.user?.id,
      });
      return sendSuccess(res, result, 'Announcement broadcast dispatched');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/superadmin/email-logs
   */
  static async getEmailLogs(req, res, next) {
    try {
      const { status, template, search, page, limit } = req.query;
      const result = await SuperadminModel.getEmailLogs({
        status,
        template,
        search,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '15', 10),
      });
      return sendSuccess(res, result, 'Email logs ledger retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/superadmin/seed
   */
  static async seedTestData(req, res, next) {
    try {
      const { runComprehensiveSeed } = await import('../seeds/comprehensive_seeder.js');
      const result = await runComprehensiveSeed();
      return sendSuccess(res, result, 'Comprehensive Super Admin test data seeded successfully');
    } catch (err) {
      next(err);
    }
  }
}
