export type EmailProviderType = 'DEVELOPMENT' | 'RESEND' | 'SENDGRID' | 'SMTP';

export type EmailLogStatus =
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export type EmailTemplateType =
  | 'WelcomeEmail'
  | 'EmailVerificationEmail'
  | 'TeacherRegistrationEmail'
  | 'TeacherApprovedEmail'
  | 'TeacherRejectedEmail'
  | 'PasswordResetEmail'
  | 'PasswordChangedEmail'
  | 'SecurityAlertEmail'
  | 'EnrollmentSubmittedEmail'
  | 'EnrollmentApprovedEmail'
  | 'EnrollmentRejectedEmail'
  | 'EnrollmentSuspendedEmail'
  | 'EnrollmentCompletedEmail'
  | 'PaymentSubmittedEmail'
  | 'PaymentVerifiedEmail'
  | 'PaymentRejectedEmail'
  | 'PaymentRefundedEmail'
  | 'AssignmentCreatedEmail'
  | 'AssignmentSubmittedEmail'
  | 'AssignmentGradedEmail'
  | 'QuizAvailableEmail'
  | 'QuizCompletedEmail'
  | 'QuizResultEmail'
  | 'TeacherFeedbackEmail'
  | 'CourseExpiringEmail'
  | 'CourseExpiredEmail'
  | 'CourseCompletedEmail'
  | 'CertificateIssuedEmail'
  | 'AnnouncementEmail';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  userId?: string;
  template?: EmailTemplateType | string;
  metadata?: Record<string, any>;
}

export interface EmailProviderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<EmailProviderResult>;
}

export interface EmailQueueJob {
  id: string;
  logId?: string;
  userId?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  template: EmailTemplateType | string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  metadata?: Record<string, any>;
}
