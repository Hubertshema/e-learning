import { EmailTemplateType } from './email.types.js';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BASE_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PLATFORM_NAME = 'FluentEdge Academy';

/**
 * Clean responsive email container with consistent branding
 */
function wrapEmailLayout(title: string, contentHtml: string, actionButton?: { text: string; url: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 32px; margin-bottom: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; color: #334155; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 20px; text-align: center; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2); }
    .info-box { background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 14px 18px; border-radius: 6px; margin: 18px 0; font-size: 13px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    .footer a { color: #6366f1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${PLATFORM_NAME}</h1>
      <p>Professional CEFR English Mastery</p>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionButton ? `<div style="text-align: center; margin-top: 24px;"><a href="${actionButton.url}" class="btn" target="_blank">${actionButton.text}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated notification from ${PLATFORM_NAME}.</p>
      <p>&copy; ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export class EmailTemplateRegistry {
  static render(template: EmailTemplateType | string, data: Record<string, any>): RenderedEmail {
    switch (template) {
      // 1. Welcome Email
      case 'WelcomeEmail': {
        const studentName = data.studentName || data.name || 'Student';
        const verifyUrl = data.verifyUrl || `${BASE_FRONTEND_URL}/login`;
        return {
          subject: `Welcome to ${PLATFORM_NAME}!`,
          html: wrapEmailLayout(
            'Welcome to FluentEdge Academy',
            `
            <span class="badge">Welcome</span>
            <h2 style="margin-top:0; color:#0f172a;">Welcome, ${studentName}!</h2>
            <p>We're thrilled to have you join our English learning platform. You now have access to our CEFR-aligned curriculum, specialized career tracks, interactive quizzes, and certified instructors.</p>
            <div class="info-box">
              <strong>Your Learning Journey:</strong> Complete placement diagnostics, attend interactive sessions, practice 7 CEFR skills, and earn verified certificates.
            </div>
            `,
            { text: 'Explore Courses & Start Learning', url: verifyUrl }
          ),
          text: `Welcome to ${PLATFORM_NAME}, ${studentName}!\n\nExplore your courses here: ${verifyUrl}`,
        };
      }

      // 2. Email Verification Email
      case 'EmailVerificationEmail': {
        const name = data.name || 'User';
        const verifyUrl = data.verifyUrl || `${BASE_FRONTEND_URL}/verify-email?token=${data.token || ''}`;
        return {
          subject: `Verify your email address - ${PLATFORM_NAME}`,
          html: wrapEmailLayout(
            'Email Verification Required',
            `
            <span class="badge">Security & Verification</span>
            <h2 style="margin-top:0; color:#0f172a;">Hello, ${name}!</h2>
            <p>Please confirm your email address to activate all features on ${PLATFORM_NAME}. This link will expire in 30 minutes.</p>
            <div class="info-box">
              If you did not sign up for an account, please ignore this email.
            </div>
            `,
            { text: 'Verify My Email Address', url: verifyUrl }
          ),
          text: `Hello ${name},\n\nPlease verify your email by clicking: ${verifyUrl}\nThis link expires in 30 minutes.`,
        };
      }

      // 3. Teacher Registration Email
      case 'TeacherRegistrationEmail': {
        const teacherName = data.teacherName || data.name || 'Instructor';
        return {
          subject: `Teacher Application Received - ${PLATFORM_NAME}`,
          html: wrapEmailLayout(
            'Teacher Application Under Review',
            `
            <span class="badge">Instructor Admissions</span>
            <h2 style="margin-top:0; color:#0f172a;">Application Received, ${teacherName}</h2>
            <p>Thank you for applying to teach at ${PLATFORM_NAME}. Our academic administrative board is reviewing your submitted qualifications, experience, and certifications.</p>
            <div class="info-box">
              <strong>Status:</strong> PENDING SUPERADMIN APPROVAL<br/>
              You will receive an email confirmation as soon as your profile is reviewed and approved.
            </div>
            `
          ),
          text: `Hello ${teacherName},\n\nYour teacher application is under review. You will receive an email once approved.`,
        };
      }

      // 4. Teacher Approved Email
      case 'TeacherApprovedEmail': {
        const teacherName = data.teacherName || data.name || 'Instructor';
        const loginUrl = `${BASE_FRONTEND_URL}/login`;
        return {
          subject: `Congratulations! Your Teacher Application is Approved`,
          html: wrapEmailLayout(
            'Teacher Application Approved',
            `
            <span class="badge" style="background-color:#dcfce7; color:#15803d;">Application Approved</span>
            <h2 style="margin-top:0; color:#0f172a;">Welcome to the Faculty, ${teacherName}!</h2>
            <p>Your instructor application has been reviewed and approved by the Superadmin. Your Teacher Studio is now unlocked.</p>
            <div class="info-box">
              You can now create courses, construct curriculum units, manage student cohorts, grade assignments, and verify enrollment payments.
            </div>
            `,
            { text: 'Open Teacher Dashboard', url: loginUrl }
          ),
          text: `Congratulations ${teacherName}! Your teacher account is approved. Sign in here: ${loginUrl}`,
        };
      }

      // 5. Teacher Rejected Email
      case 'TeacherRejectedEmail': {
        const teacherName = data.teacherName || data.name || 'Applicant';
        const reason = data.reason || 'Credentials did not meet current CEFR faculty requirements.';
        return {
          subject: `Teacher Application Status Update - ${PLATFORM_NAME}`,
          html: wrapEmailLayout(
            'Application Update',
            `
            <span class="badge" style="background-color:#fee2e2; color:#b91c1c;">Admissions Decision</span>
            <h2 style="margin-top:0; color:#0f172a;">Application Status, ${teacherName}</h2>
            <p>Thank you for your interest in teaching at ${PLATFORM_NAME}. After reviewing your submission, we are unable to accept your application at this time.</p>
            <div class="info-box">
              <strong>Feedback:</strong> ${reason}
            </div>
            `
          ),
          text: `Hello ${teacherName},\n\nYour teacher application was not approved. Feedback: ${reason}`,
        };
      }

      // 6. Password Reset Email
      case 'PasswordResetEmail': {
        const resetUrl = data.resetUrl || `${BASE_FRONTEND_URL}/reset-password?token=${data.token || ''}`;
        const name = data.name || 'User';
        return {
          subject: `Reset your password - ${PLATFORM_NAME}`,
          html: wrapEmailLayout(
            'Password Reset Request',
            `
            <span class="badge">Account Security</span>
            <h2 style="margin-top:0; color:#0f172a;">Password Reset Request</h2>
            <p>Hello ${name}, we received a request to reset your password. Click the button below to choose a new password. This link expires in 30 minutes.</p>
            <div class="info-box">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
            `,
            { text: 'Reset Password', url: resetUrl }
          ),
          text: `Hello ${name},\n\nReset your password here: ${resetUrl}\nLink expires in 30 minutes.`,
        };
      }

      // 7. Password Changed Email
      case 'PasswordChangedEmail': {
        const name = data.name || 'User';
        const date = new Date().toUTCString();
        return {
          subject: `Security Alert: Your password was changed`,
          html: wrapEmailLayout(
            'Password Changed Successfully',
            `
            <span class="badge" style="background-color:#dcfce7; color:#15803d;">Security Notice</span>
            <h2 style="margin-top:0; color:#0f172a;">Password Updated, ${name}</h2>
            <p>The password for your ${PLATFORM_NAME} account was successfully changed on <strong>${date}</strong>.</p>
            <div class="info-box">
              If you did not authorize this change, please immediately contact our support team to secure your account.
            </div>
            `
          ),
          text: `Hello ${name},\n\nYour password was changed on ${date}. If you did not do this, please contact support.`,
        };
      }

      // 8. Payment Verified Email
      case 'PaymentVerifiedEmail': {
        const studentName = data.studentName || 'Student';
        const courseTitle = data.courseTitle || 'English Course';
        const amount = data.amount || '0.00';
        const currency = data.currency || 'USD';
        const expiryDate = data.expiryDate || '90 days from now';
        const courseUrl = data.courseUrl || `${BASE_FRONTEND_URL}/student/courses`;
        return {
          subject: `Payment Verified & Enrollment Activated: ${courseTitle}`,
          html: wrapEmailLayout(
            'Course Access Activated',
            `
            <span class="badge" style="background-color:#dcfce7; color:#15803d;">Payment Verified</span>
            <h2 style="margin-top:0; color:#0f172a;">Access Granted, ${studentName}!</h2>
            <p>Your payment for <strong>${courseTitle}</strong> has been verified. Your course enrollment is now <strong>ACTIVE</strong>.</p>
            <div class="info-box">
              <strong>Course:</strong> ${courseTitle}<br/>
              <strong>Amount Paid:</strong> ${currency} ${amount}<br/>
              <strong>Access Valid Until:</strong> ${expiryDate}
            </div>
            `,
            { text: 'Start Learning Now', url: courseUrl }
          ),
          text: `Hello ${studentName},\n\nYour payment for ${courseTitle} (${currency} ${amount}) has been verified. Access valid until ${expiryDate}. Start learning: ${courseUrl}`,
        };
      }

      // 9. Payment Rejected Email
      case 'PaymentRejectedEmail': {
        const studentName = data.studentName || 'Student';
        const courseTitle = data.courseTitle || 'Course';
        const reason = data.reason || 'Receipt image illegible or transaction not found.';
        return {
          subject: `Action Required: Payment Verification for ${courseTitle}`,
          html: wrapEmailLayout(
            'Payment Verification Issue',
            `
            <span class="badge" style="background-color:#fee2e2; color:#b91c1c;">Payment Issue</span>
            <h2 style="margin-top:0; color:#0f172a;">Payment Status Update</h2>
            <p>Hello ${studentName}, your recent payment submission for <strong>${courseTitle}</strong> could not be verified.</p>
            <div class="info-box">
              <strong>Reason:</strong> ${reason}
            </div>
            <p>Please log in and re-submit a clear payment receipt or contact your instructor.</p>
            `,
            { text: 'Review Payment Submission', url: `${BASE_FRONTEND_URL}/student/payments` }
          ),
          text: `Hello ${studentName},\n\nPayment for ${courseTitle} was rejected: ${reason}. Please update your submission.`,
        };
      }

      // 10. Assignment Graded Email
      case 'AssignmentGradedEmail': {
        const studentName = data.studentName || 'Student';
        const assignmentTitle = data.assignmentTitle || 'Assignment';
        const score = data.score ?? 100;
        const feedback = data.feedback || 'Great work!';
        const viewUrl = `${BASE_FRONTEND_URL}/student/assignments`;
        return {
          subject: `Assignment Graded: ${assignmentTitle} (Score: ${score}%)`,
          html: wrapEmailLayout(
            'Assignment Graded',
            `
            <span class="badge">Grading Update</span>
            <h2 style="margin-top:0; color:#0f172a;">Grade Available, ${studentName}</h2>
            <p>Your teacher has reviewed and graded your submission for <strong>${assignmentTitle}</strong>.</p>
            <div class="info-box">
              <strong>Score:</strong> ${score}%<br/>
              <strong>Teacher Feedback:</strong> ${feedback}
            </div>
            `,
            { text: 'View Assignment Feedback', url: viewUrl }
          ),
          text: `Hello ${studentName},\n\nYour assignment "${assignmentTitle}" was graded: ${score}%. Feedback: ${feedback}`,
        };
      }

      // 11. Quiz Result Email
      case 'QuizResultEmail': {
        const studentName = data.studentName || 'Student';
        const quizTitle = data.quizTitle || 'Quiz';
        const score = data.score ?? 0;
        const passed = data.passed ? 'PASSED' : 'NOT PASSED';
        return {
          subject: `Quiz Results: ${quizTitle} (${score}%)`,
          html: wrapEmailLayout(
            'Quiz Results',
            `
            <span class="badge">Quiz Evaluation</span>
            <h2 style="margin-top:0; color:#0f172a;">Quiz Completed, ${studentName}</h2>
            <p>Your results for <strong>${quizTitle}</strong> are ready.</p>
            <div class="info-box">
              <strong>Score:</strong> ${score}%<br/>
              <strong>Status:</strong> ${passed}
            </div>
            `,
            { text: 'Review Detailed Answers', url: `${BASE_FRONTEND_URL}/student/quizzes` }
          ),
          text: `Hello ${studentName},\n\nQuiz "${quizTitle}" score: ${score}%. Status: ${passed}.`,
        };
      }

      // 12. Teacher Feedback Email
      case 'TeacherFeedbackEmail': {
        const studentName = data.studentName || 'Student';
        const teacherName = data.teacherName || 'Instructor';
        const comment = data.comment || 'Keep up the excellent progress!';
        return {
          subject: `New Feedback from ${teacherName}`,
          html: wrapEmailLayout(
            'Teacher Feedback',
            `
            <span class="badge">Academic Feedback</span>
            <h2 style="margin-top:0; color:#0f172a;">Personalized Feedback Received</h2>
            <p>Hello ${studentName}, your instructor <strong>${teacherName}</strong> left feedback on your English progress.</p>
            <div class="info-box">
              "${comment}"
            </div>
            `,
            { text: 'View Feedback & Progress', url: `${BASE_FRONTEND_URL}/student/feedback` }
          ),
          text: `Hello ${studentName},\n\nFeedback from ${teacherName}: "${comment}"`,
        };
      }

      // 13. Course Expiring Email
      case 'CourseExpiringEmail': {
        const studentName = data.studentName || 'Student';
        const courseTitle = data.courseTitle || 'Course';
        const daysRemaining = data.daysRemaining || 7;
        const expiryDate = data.expiryDate || 'Soon';
        return {
          subject: `Reminder: Your enrollment in ${courseTitle} expires in ${daysRemaining} days`,
          html: wrapEmailLayout(
            'Enrollment Expiring Soon',
            `
            <span class="badge" style="background-color:#fef3c7; color:#b45309;">Course Expiration Notice</span>
            <h2 style="margin-top:0; color:#0f172a;">Action Recommended, ${studentName}</h2>
            <p>Your access to <strong>${courseTitle}</strong> will expire in <strong>${daysRemaining} days</strong> on <strong>${expiryDate}</strong>.</p>
            <div class="info-box">
              Please complete your remaining lessons, quizzes, and assignments before this date to earn your CEFR Certificate of Completion.
            </div>
            `,
            { text: 'Continue Coursework', url: `${BASE_FRONTEND_URL}/student/courses` }
          ),
          text: `Hello ${studentName},\n\nYour course ${courseTitle} expires in ${daysRemaining} days (${expiryDate}). Complete remaining work to get certified!`,
        };
      }

      // 14. Course Expired Email
      case 'CourseExpiredEmail': {
        const studentName = data.studentName || 'Student';
        const courseTitle = data.courseTitle || 'Course';
        return {
          subject: `Course Access Expired: ${courseTitle}`,
          html: wrapEmailLayout(
            'Course Access Expired',
            `
            <span class="badge" style="background-color:#fee2e2; color:#b91c1c;">Enrollment Expired</span>
            <h2 style="margin-top:0; color:#0f172a;">Course Expired, ${studentName}</h2>
            <p>Your active enrollment duration for <strong>${courseTitle}</strong> has ended.</p>
            <div class="info-box">
              Your historical quiz scores, grades, and profile progress remain safe in your account. To resume access to video lessons and exercises, you can renew your enrollment.
            </div>
            `,
            { text: 'Renew Enrollment', url: `${BASE_FRONTEND_URL}/courses` }
          ),
          text: `Hello ${studentName},\n\nYour enrollment for ${courseTitle} has expired. Historical progress is saved. Renew here: ${BASE_FRONTEND_URL}/courses`,
        };
      }

      // 15. Certificate Issued Email
      case 'CertificateIssuedEmail': {
        const studentName = data.studentName || 'Student';
        const courseTitle = data.courseTitle || 'English Mastery Course';
        const certificateCode = data.certificateCode || `CERT-${Date.now()}`;
        return {
          subject: `Certificate Awarded: ${courseTitle}!`,
          html: wrapEmailLayout(
            'CEFR Certificate Awarded',
            `
            <span class="badge" style="background-color:#dcfce7; color:#15803d;">Official Certificate</span>
            <h2 style="margin-top:0; color:#0f172a;">Congratulations, ${studentName}!</h2>
            <p>You have successfully completed all curriculum requirements and achieved CEFR competency in <strong>${courseTitle}</strong>.</p>
            <div class="info-box">
              <strong>Certificate Verification Code:</strong> ${certificateCode}<br/>
              <strong>Issued by:</strong> ${PLATFORM_NAME} Board of Academic Standards
            </div>
            `,
            { text: 'View & Download Certificate', url: `${BASE_FRONTEND_URL}/student/certificates` }
          ),
          text: `Congratulations ${studentName}!\n\nYou earned a certificate in ${courseTitle}. Code: ${certificateCode}. View here: ${BASE_FRONTEND_URL}/student/certificates`,
        };
      }

      // 16. Superadmin Global Announcement
      case 'AnnouncementEmail': {
        const title = data.title || 'Platform Announcement';
        const message = data.message || 'Important update from the academy administration.';
        return {
          subject: `[Announcement] ${title}`,
          html: wrapEmailLayout(
            title,
            `
            <span class="badge">Academy Announcement</span>
            <h2 style="margin-top:0; color:#0f172a;">${title}</h2>
            <div style="font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-line;">
              ${message}
            </div>
            `,
            { text: 'Go to Platform', url: `${BASE_FRONTEND_URL}/login` }
          ),
          text: `[Announcement] ${title}\n\n${message}\n\nVisit: ${BASE_FRONTEND_URL}`,
        };
      }

      // Default Generic Fallback
      default: {
        const title = data.title || 'Notification from FluentEdge Academy';
        const message = data.message || '';
        return {
          subject: title,
          html: wrapEmailLayout(title, `<p>${message}</p>`),
          text: `${title}\n\n${message}`,
        };
      }
    }
  }
}
