import { superadminRepository } from '../repositories/superadmin.repository.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { emailService } from './email/email.service.js';
import { emailQueue } from './email/email.queue.js';
import { hashPassword } from '../utils/password.util.js';
import { AppError } from '../middleware/error.middleware.js';
import { UserStatus, PaymentStatus, EnrollmentStatus, CEFRLevel } from '@prisma/client';

export class SuperadminService {
  async getOverview() {
    return superadminRepository.getOverviewStats();
  }

  async listTeachers(params: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    isApproved?: boolean;
    search?: string;
  }) {
    return superadminRepository.findTeachers(params);
  }

  async approveTeacher(
    adminUserId: string,
    teacherUserId: string,
    hourlyRate?: number,
    ipAddress?: string
  ) {
    const result = await superadminRepository.approveTeacher(teacherUserId, hourlyRate);

    // Audit log
    await auditService.log({
      userId: adminUserId,
      action: 'TEACHER_APPROVED',
      entity: 'TEACHER_PROFILE',
      entityId: teacherUserId,
      ipAddress,
      metadata: { hourlyRate, teacherEmail: result.user.email },
    });

    // Send Teacher Approved Email & Notification
    await notificationService.notifyUser({
      userId: teacherUserId,
      type: 'TEACHER_APPROVED',
      title: 'Teacher Application Approved! 🎉',
      message: 'Your instructor application has been approved by the superadmin. Welcome to FluentEdge Academy faculty!',
      link: '/teacher',
      emailTemplate: 'TeacherApprovedEmail',
      emailData: {
        teacherName: `${result.user.firstName} ${result.user.lastName}`,
      },
      isSecurityCritical: true,
    });

    return result;
  }

  async rejectTeacher(
    adminUserId: string,
    teacherUserId: string,
    reason: string,
    ipAddress?: string
  ) {
    const result = await superadminRepository.rejectTeacher(teacherUserId, reason);

    // Audit log
    await auditService.log({
      userId: adminUserId,
      action: 'TEACHER_REJECTED',
      entity: 'TEACHER_PROFILE',
      entityId: teacherUserId,
      ipAddress,
      metadata: { reason, teacherEmail: result.user.email },
    });

    // Send Teacher Rejected Email & Notification
    await notificationService.notifyUser({
      userId: teacherUserId,
      type: 'TEACHER_REJECTED',
      title: 'Teacher Application Status',
      message: `Your instructor application was not approved: ${reason}`,
      emailTemplate: 'TeacherRejectedEmail',
      emailData: {
        teacherName: `${result.user.firstName} ${result.user.lastName}`,
        reason,
      },
      isSecurityCritical: true,
    });

    return result;
  }

  async listStudents(params: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    search?: string;
  }) {
    return superadminRepository.findStudents(params);
  }

  async updateStudentLevel(
    adminUserId: string,
    userId: string,
    level: CEFRLevel,
    reason?: string,
    ipAddress?: string
  ) {
    const updated = await superadminRepository.updateStudentLevel(userId, level);

    await auditService.log({
      userId: adminUserId,
      action: 'STUDENT_LEVEL_OVERRIDE',
      entity: 'STUDENT_PROFILE',
      entityId: userId,
      ipAddress,
      metadata: { newLevel: level, reason, studentEmail: updated.user.email },
    });

    return updated;
  }

  async resetUserPassword(
    adminUserId: string,
    targetUserId: string,
    newPassword: string,
    ipAddress?: string
  ) {
    const passwordHash = await hashPassword(newPassword);
    const updated = await superadminRepository.resetUserPassword(targetUserId, passwordHash);

    await auditService.log({
      userId: adminUserId,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      entityId: targetUserId,
      ipAddress,
      metadata: { targetEmail: updated.email, role: updated.role },
    });

    // Security notification to user
    await notificationService.notifyUser({
      userId: targetUserId,
      type: 'SECURITY_ALERT',
      title: 'Password Reset by Administrator',
      message: 'Your account password was updated by a platform administrator.',
      emailTemplate: 'PasswordChangedEmail',
      emailData: {
        name: updated.firstName,
      },
      isSecurityCritical: true,
    });

    return updated;
  }

  async toggleUserStatus(
    adminUserId: string,
    targetUserId: string,
    status: UserStatus,
    reason?: string,
    ipAddress?: string
  ) {
    if (adminUserId === targetUserId) {
      throw new AppError('Superadmin cannot modify their own status.', 400);
    }

    const updated = await superadminRepository.updateUserStatus(targetUserId, status);

    await auditService.log({
      userId: adminUserId,
      action: `USER_STATUS_${status}`,
      entity: 'USER',
      entityId: targetUserId,
      ipAddress,
      metadata: { targetEmail: updated.email, reason, newStatus: status },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async listCourses(params: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    search?: string;
  }) {
    return superadminRepository.findCourses(params);
  }

  async updateCourseStatus(
    adminUserId: string,
    courseId: string,
    isPublished?: boolean,
    featured?: boolean,
    ipAddress?: string
  ) {
    const updated = await superadminRepository.updateCourseStatus(courseId, isPublished, featured);

    await auditService.log({
      userId: adminUserId,
      action: 'COURSE_MODERATED',
      entity: 'COURSE',
      entityId: courseId,
      ipAddress,
      metadata: { isPublished, featured, title: updated.title },
    });

    return updated;
  }

  async listPayments(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
  }) {
    return superadminRepository.findPayments(params);
  }

  async verifyPayment(
    adminUserId: string,
    paymentId: string,
    status: PaymentStatus,
    notes?: string,
    ipAddress?: string
  ) {
    const result = await superadminRepository.verifyPayment(paymentId, status, notes);

    await auditService.log({
      userId: adminUserId,
      action: `PAYMENT_${status}`,
      entity: 'PAYMENT',
      entityId: paymentId,
      ipAddress,
      metadata: {
        status,
        notes,
        amount: result.amount,
        studentEmail: result.student.user.email,
      },
    });

    // Notify student of payment status
    if (status === PaymentStatus.VERIFIED) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'PAYMENT_VERIFIED',
        title: `Payment Verified: ${result.enrollment.course.title}`,
        message: `Your payment of ${result.currency} ${result.amount} has been verified and course access is activated.`,
        link: '/student/courses',
        emailTemplate: 'PaymentVerifiedEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          courseTitle: result.enrollment.course.title,
          amount: String(result.amount),
          currency: result.currency,
          expiryDate: result.enrollment.expiresAt ? new Date(result.enrollment.expiresAt).toLocaleDateString() : '90 days from now',
        },
        preferenceKey: 'paymentEmails',
      });
    } else if (status === PaymentStatus.REJECTED) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'PAYMENT_REJECTED',
        title: `Payment Verification Issue: ${result.enrollment.course.title}`,
        message: `Your payment could not be verified: ${notes || 'Receipt invalid or illegible.'}`,
        link: '/student/payments',
        emailTemplate: 'PaymentRejectedEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          courseTitle: result.enrollment.course.title,
          reason: notes || 'Receipt illegible or transaction not found.',
        },
        preferenceKey: 'paymentEmails',
      });
    }

    return result;
  }

  async listEnrollments(params: {
    page?: number;
    limit?: number;
    status?: EnrollmentStatus;
    search?: string;
  }) {
    return superadminRepository.findEnrollments(params);
  }

  async updateEnrollmentStatus(
    adminUserId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
    expiresAt?: Date,
    ipAddress?: string
  ) {
    const result = await superadminRepository.updateEnrollmentStatus(enrollmentId, status, expiresAt);

    await auditService.log({
      userId: adminUserId,
      action: `ENROLLMENT_STATUS_${status}`,
      entity: 'ENROLLMENT',
      entityId: enrollmentId,
      ipAddress,
      metadata: { status, expiresAt, courseTitle: result.course.title },
    });

    return result;
  }

  async extendEnrollment(
    adminUserId: string,
    enrollmentId: string,
    days: number,
    ipAddress?: string
  ) {
    const result = await superadminRepository.extendEnrollment(enrollmentId, days);

    await auditService.log({
      userId: adminUserId,
      action: 'ENROLLMENT_EXTENDED',
      entity: 'ENROLLMENT',
      entityId: enrollmentId,
      ipAddress,
      metadata: { days, newExpiresAt: result.expiresAt, courseTitle: result.course.title },
    });

    // Notify student
    await notificationService.notifyUser({
      userId: result.student.userId,
      type: 'ENROLLMENT_EXTENDED',
      title: `Enrollment Extended: ${result.course.title}`,
      message: `Your course duration has been extended by ${days} days until ${new Date(result.expiresAt!).toLocaleDateString()}.`,
      link: '/student/courses',
    });

    return result;
  }

  async getSettings() {
    return superadminRepository.getSettings();
  }

  async updateSettings(
    adminUserId: string,
    data: {
      platformName?: string;
      supportEmail?: string;
      requireTeacherReview?: boolean;
      allowStudentRegistration?: boolean;
      allowTeacherRegistration?: boolean;
      defaultCurrency?: string;
      platformCommissionPercent?: number;
    },
    ipAddress?: string
  ) {
    const updated = await superadminRepository.updateSettings(data);

    await auditService.log({
      userId: adminUserId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entity: 'SYSTEM_SETTINGS',
      ipAddress,
      metadata: data,
    });

    return updated;
  }

  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
  }) {
    return superadminRepository.findAuditLogs(params);
  }

  async getReports() {
    const stats = await superadminRepository.getOverviewStats();
    
    const revenueTrends = [
      { month: 'Apr', revenue: 4200, enrollments: 38 },
      { month: 'May', revenue: 6100, enrollments: 54 },
      { month: 'Jun', revenue: 8400, enrollments: 72 },
      { month: 'Jul', revenue: 11200, enrollments: 95 },
      { month: 'Aug', revenue: 14800, enrollments: 128 },
      { month: 'Sep', revenue: stats.financials.totalRevenue || 18500, enrollments: stats.enrollments.total || 142 },
    ];

    const cefrEnrollmentDistribution = [
      { level: 'Pre-A1 Starter', count: 18, percentage: 12 },
      { level: 'A1 Beginner', count: 32, percentage: 22 },
      { level: 'A2 Elementary', count: 45, percentage: 31 },
      { level: 'B1 Intermediate', count: 28, percentage: 19 },
      { level: 'B2 Upper Int.', count: 14, percentage: 10 },
      { level: 'C1/C2 Advanced', count: 9, percentage: 6 },
    ];

    return {
      stats,
      revenueTrends,
      cefrEnrollmentDistribution,
    };
  }

  // ----------------------------------------------------
  // EMAIL LOGS, ANNOUNCEMENTS & EMAIL SETTINGS
  // ----------------------------------------------------

  async getEmailLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    template?: string;
    search?: string;
  }) {
    return superadminRepository.findEmailLogs(params);
  }

  async getEmailLogById(id: string) {
    return superadminRepository.getEmailLogById(id);
  }

  async sendAnnouncement(
    adminUserId: string,
    data: {
      title: string;
      message: string;
      targetAudience: 'ALL_USERS' | 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'SELECTED_USERS';
      targetIds?: string[];
    },
    ipAddress?: string
  ) {
    const targetUsers = await superadminRepository.getTargetUsersForAnnouncement(
      data.targetAudience,
      data.targetIds
    );

    // Queue in-app notification & email for every target user
    for (const user of targetUsers) {
      await notificationService.notifyUser({
        userId: user.id,
        type: 'ANNOUNCEMENT',
        title: data.title,
        message: data.message,
        emailTemplate: 'AnnouncementEmail',
        emailData: {
          title: data.title,
          message: data.message,
          name: `${user.firstName} ${user.lastName}`,
        },
        preferenceKey: 'announcementEmails',
      });
    }

    await auditService.log({
      userId: adminUserId,
      action: 'ANNOUNCEMENT_BROADCAST',
      entity: 'ANNOUNCEMENT',
      ipAddress,
      metadata: {
        title: data.title,
        targetAudience: data.targetAudience,
        recipientCount: targetUsers.length,
      },
    });

    return {
      success: true,
      recipientsCount: targetUsers.length,
      message: `Announcement queued for ${targetUsers.length} users.`,
    };
  }

  async getEmailSettings() {
    return {
      provider: process.env.EMAIL_PROVIDER || 'DEVELOPMENT',
      senderEmail: process.env.EMAIL_FROM || 'support@fluentedge.com',
      senderName: process.env.EMAIL_FROM_NAME || 'FluentEdge Academy',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@fluentedge.com',
      emailEnabled: process.env.EMAIL_ENABLED !== 'false',
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
      verificationExpiresMinutes: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || '30', 10),
      passwordResetExpiresMinutes: parseInt(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '30', 10),
    };
  }

  async sendTestEmail(targetEmail: string, superadminId: string) {
    if (!targetEmail) {
      throw new AppError(400, 'Target email address is required');
    }

    const testHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FluentEdge Academy</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Email Gateway Verification Test</p>
        </div>
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">🎉 SMTP Gateway Connected Successfully!</h2>
          <p style="font-size: 14px; color: #475569;">
            This test email confirms that your outgoing email gateway (<strong>${process.env.EMAIL_PROVIDER || 'SMTP'}</strong>) via <strong>${process.env.EMAIL_FROM || 'smtp.gmail.com'}</strong> is operational.
          </p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
            <div><strong>Sender Address:</strong> ${process.env.EMAIL_FROM}</div>
            <div><strong>Recipient:</strong> ${targetEmail}</div>
            <div><strong>Status:</strong> Active & Connected</div>
          </div>
          <p style="font-size: 13px; color: #64748b;">
            All automated transactional notifications, student verification tokens, and teacher approval alerts will now be dispatched live through this gateway.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      to: targetEmail,
      subject: '✅ FluentEdge Academy — Email Gateway Test Message',
      html: testHtml,
      text: `FluentEdge Academy Email Gateway Test Message. Connected via ${process.env.EMAIL_PROVIDER || 'SMTP'} (${process.env.EMAIL_FROM}).`,
      fromName: process.env.EMAIL_FROM_NAME || 'FluentEdge Academy',
      fromEmail: process.env.EMAIL_FROM || 'shemahubert2021@gmail.com',
      userId: superadminId,
    };

    if (typeof emailService.send === 'function') {
      return await emailService.send(mailOptions);
    } else {
      const jobId = await emailQueue.enqueue(mailOptions);
      return { success: true, queued: true, jobId };
    }
  }

  async listClasses(params?: { search?: string; courseId?: string; teacherId?: string; isActive?: boolean }) {
    return superadminRepository.findClasses(params);
  }

  async createClass(data: {
    name: string;
    code?: string;
    description?: string;
    courseId: string;
    teacherId: string;
    startDate?: string;
    endDate?: string;
    maxStudents?: number;
    isActive?: boolean;
  }) {
    return superadminRepository.createClass(data);
  }

  async updateClass(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string;
      courseId: string;
      teacherId: string;
      startDate: string;
      endDate: string;
      maxStudents: number;
      isActive: boolean;
    }>
  ) {
    return superadminRepository.updateClass(id, data);
  }

  async deleteClass(id: string) {
    return superadminRepository.deleteClass(id);
  }
}

export const superadminService = new SuperadminService();

