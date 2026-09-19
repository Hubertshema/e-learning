/**
 * Centralized Email Service Facade
 * ─────────────────────────────────
 * All email-sending logic lives here. Call functions from this file;
 * never create new ad-hoc email functions in other files.
 *
 * Internally routes to the rich EmailService in services/email/
 * which handles templates, queuing, and SMTP dispatch.
 */
import { emailService as richEmailService } from './email/email.service.js';

export class EmailService {
  // ─── Auth Emails ─────────────────────────────────────────
  async sendWelcomeEmail(to: string, name: string) {
    return richEmailService.sendTemplate({
      to, template: 'WelcomeEmail', data: { name },
    });
  }

  async sendEmailVerification(to: string, name: string, verificationUrl: string) {
    return richEmailService.sendTemplate({
      to, template: 'EmailVerificationEmail', data: { name, verificationUrl },
      isSecurityCritical: true,
    });
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    return richEmailService.sendTemplate({
      to, template: 'PasswordResetEmail', data: { name, resetUrl },
      isSecurityCritical: true,
    });
  }

  async sendPasswordChanged(to: string, name: string) {
    return richEmailService.sendTemplate({
      to, template: 'PasswordChangedEmail', data: { name },
      isSecurityCritical: true,
    });
  }

  // ─── Teacher Emails ──────────────────────────────────────
  async sendTeacherRegisteredEmail(to: string, name: string) {
    return richEmailService.sendTemplate({
      to, template: 'TeacherRegistrationEmail', data: { name },
    });
  }

  async sendTeacherApprovalEmail(to: string, name: string) {
    return richEmailService.sendTemplate({
      to, template: 'TeacherApprovedEmail', data: { name },
    });
  }

  async sendTeacherRejectedEmail(to: string, name: string, reason?: string) {
    return richEmailService.sendTemplate({
      to, template: 'TeacherRejectedEmail', data: { name, reason },
    });
  }

  // ─── Payment & Enrollment Emails ─────────────────────────
  async sendPaymentVerifiedEmail(to: string, studentName: string, courseTitle: string, expiresAt: string) {
    return richEmailService.sendTemplate({
      to, template: 'PaymentVerifiedEmail', data: { studentName, courseTitle, expiresAt },
    });
  }

  async sendPaymentRejectedEmail(to: string, studentName: string, reason?: string) {
    return richEmailService.sendTemplate({
      to, template: 'PaymentRejectedEmail', data: { studentName, reason },
    });
  }

  async sendEnrollmentApprovedEmail(to: string, studentName: string, courseTitle: string) {
    return richEmailService.sendTemplate({
      to, template: 'EnrollmentApprovedEmail', data: { studentName, courseTitle },
    });
  }

  // ─── Cohort Enrollment Email ─────────────────────────────
  /**
   * Sent to every student when a teacher enrolls them into a cohort.
   * @param to          Student email address
   * @param studentName Student first+last name
   * @param cohortName  Cohort/class name
   * @param teacherName Teacher full name
   * @param schedule    Formatted schedule string (e.g. "Mon, Wed from 6:00 PM to 7:30 PM")
   * @param startDate   Human-readable start date
   * @param endDate     Human-readable end date
   * @param courses     Array of course title strings in this cohort
   */
  async sendCohortEnrollmentEmail(opts: {
    to: string;
    studentName: string;
    cohortName: string;
    teacherName: string;
    schedule?: string;
    startDate?: string;
    endDate?: string;
    courses?: string[];
    userId?: string;
  }) {
    return richEmailService.sendTemplate({
      to: opts.to,
      userId: opts.userId,
      template: 'CohortEnrollmentEmail',
      data: {
        studentName: opts.studentName,
        cohortName: opts.cohortName,
        teacherName: opts.teacherName,
        schedule: opts.schedule || '',
        startDate: opts.startDate || '',
        endDate: opts.endDate || '',
        courses: opts.courses || [],
      },
    });
  }

  // ─── Assignment & Quiz Emails ────────────────────────────
  async sendAssignmentGradedEmail(to: string, studentName: string, assignmentTitle: string, score: number) {
    return richEmailService.sendTemplate({
      to, template: 'AssignmentGradedEmail', data: { studentName, assignmentTitle, score },
    });
  }

  async sendAssignmentCreatedEmail(to: string, studentName: string, assignmentTitle: string, dueDate: string) {
    return richEmailService.sendTemplate({
      to, template: 'AssignmentCreatedEmail', data: { studentName, assignmentTitle, dueDate },
    });
  }

  // ─── Course & Certificate Emails ─────────────────────────
  async sendCertificateIssuedEmail(to: string, studentName: string, courseTitle: string, certificateCode: string) {
    return richEmailService.sendTemplate({
      to, template: 'CertificateIssuedEmail', data: { studentName, courseTitle, certificateCode },
    });
  }

  async sendCourseExpiringEmail(to: string, studentName: string, courseTitle: string, daysLeft: number) {
    return richEmailService.sendTemplate({
      to, template: 'CourseExpiringEmail', data: { studentName, courseTitle, daysLeft },
    });
  }

  // ─── Admin Emails ────────────────────────────────────────
  async sendAnnouncementEmail(to: string, title: string, message: string) {
    return richEmailService.sendTemplate({
      to, template: 'AnnouncementEmail', data: { title, message },
    });
  }
}

export const emailService = new EmailService();
