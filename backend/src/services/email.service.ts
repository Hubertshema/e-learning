/**
 * Modular Transactional Email Service Layer (Section 39 of implementation.md)
 * Isolated from core business logic to allow plugging in Resend, SendGrid, or SMTP.
 */
export class EmailService {
  async sendWelcomeEmail(to: string, name: string) {
    console.log(`[EMAIL DISPATCH] Welcome Email -> To: ${to}, Name: ${name}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  }

  async sendTeacherApprovalEmail(to: string, name: string) {
    console.log(`[EMAIL DISPATCH] Teacher Application Approved -> To: ${to}, Name: ${name}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  }

  async sendPaymentVerifiedEmail(to: string, studentName: string, courseTitle: string, expiresAt: string) {
    console.log(`[EMAIL DISPATCH] Course Access Activated -> To: ${to}, Student: ${studentName}, Course: ${courseTitle}, Expires: ${expiresAt}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  }

  async sendAssignmentGradedEmail(to: string, studentName: string, assignmentTitle: string, score: number) {
    console.log(`[EMAIL DISPATCH] Assignment Graded -> To: ${to}, Student: ${studentName}, Title: ${assignmentTitle}, Score: ${score}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  }

  async sendCertificateIssuedEmail(to: string, studentName: string, courseTitle: string, certificateCode: string) {
    console.log(`[EMAIL DISPATCH] Certificate Awarded -> To: ${to}, Student: ${studentName}, Course: ${courseTitle}, Code: ${certificateCode}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  }
}

export const emailService = new EmailService();
