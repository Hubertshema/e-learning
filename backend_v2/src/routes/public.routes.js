import { Router } from 'express';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { CourseController } from '../controllers/course.controller.js';
import { CertificateModel } from '../models/certificate.model.js';
import { ContactModel } from '../models/contact.model.js';
import { emailService } from '../services/email.service.js';
import { query } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

const router = Router();

// Public Platform Statistics (Real DB Counts)
router.get('/stats', async (req, res, next) => {
  try {
    const [enrollRes, courseRes, lessonRes] = await Promise.all([
      query(`
        SELECT COUNT(DISTINCT COALESCE(e."studentId", sp."userId", sp.id)) as count
        FROM "public"."enrollments" e
        LEFT JOIN "public"."student_profiles" sp ON (sp.id = e."studentId" OR sp."userId" = e."studentId")
      `),
      query(`SELECT COUNT(*) as count FROM "public"."courses" WHERE "isPublished" = true`),
      query(`SELECT COUNT(*) as count FROM "public"."lessons"`),
    ]);

    let enrolledStudents = parseInt(enrollRes.rows[0]?.count || 0, 10);
    if (!enrolledStudents) {
      const stuRes = await query(`SELECT COUNT(*) as count FROM "public"."users" WHERE role = 'STUDENT'`);
      enrolledStudents = parseInt(stuRes.rows[0]?.count || 0, 10);
    }

    let coursesCount = parseInt(courseRes.rows[0]?.count || 0, 10);
    if (!coursesCount) {
      const allCourseRes = await query(`SELECT COUNT(*) as count FROM "public"."courses"`);
      coursesCount = parseInt(allCourseRes.rows[0]?.count || 0, 10);
    }

    const lessonsCount = parseInt(lessonRes.rows[0]?.count || 0, 10);

    return sendSuccess(res, {
      enrolledStudents,
      courses: coursesCount,
      lessons: lessonsCount,
    }, 'Public platform statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
});

// Public Diagnostic Placement Quiz & Captcha
router.get('/captcha', DiagnosticController.getCaptcha);
router.get('/diagnostic-quiz', DiagnosticController.getPublicQuestions);
router.post('/diagnostic-quiz/submit', DiagnosticController.submitPublicAttempt);

// Public Course Catalog Alias
router.get('/courses', CourseController.list);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public Contact Form
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, 'Name is required', 400, 'VALIDATION_ERROR');
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return sendError(res, 'A valid email address is required', 400, 'VALIDATION_ERROR');
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 'Message is required', 400, 'VALIDATION_ERROR');
    }

    // 1. Store message in database
    const saved = await ContactModel.createMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: message.trim(),
    });

    // 2. Dispatch notifications asynchronously (non-blocking)
    Promise.allSettled([
      emailService.sendContactNotificationToAdmin({
        name,
        email,
        phone,
        subject,
        message,
      }),
      emailService.sendContactAutoReply({
        name,
        email,
      }),
    ]).catch((err) => console.error('Error dispatching contact emails:', err));

    return sendSuccess(
      res,
      { id: saved.id, received: true },
      'Thank you for reaching out! The LinguaChris academic team will contact you shortly.',
      201
    );
  } catch (err) {
    next(err);
  }
});

// Public Newsletter Subscription
router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return sendError(res, 'A valid email address is required', 400, 'VALIDATION_ERROR');
    }

    // 1. Store subscriber in database
    const subscriber = await ContactModel.subscribeNewsletter(email);

    // 2. Dispatch welcome email
    emailService.sendNewsletterWelcome({ email }).catch((err) =>
      console.error('Error dispatching newsletter welcome email:', err)
    );

    return sendSuccess(
      res,
      { email: subscriber.email, subscribed: true },
      'Thank you for subscribing to LinguaChris Academy updates!'
    );
  } catch (err) {
    next(err);
  }
});

import crypto from 'crypto';
import { cache } from '../config/cache.js';

// Public Certificate Verification
router.get('/certificates/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code || typeof code !== 'string') {
      return sendError(res, 'Certificate verification code is required', 400, 'VALIDATION_ERROR');
    }

    const cert = await CertificateModel.verifyCertificate(code);
    if (!cert) {
      return sendError(res, `Certificate code '${code}' was not found in our official registry.`, 404, 'NOT_FOUND');
    }

    const maskedEmail = cert.studentEmail ? cert.studentEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
        return gp1 + '*'.repeat(gp2.length); 
    }) : '';

    return sendSuccess(res, {
       certificateCode: cert.certificateCode,
       studentName: cert.studentName,
       courseTitle: cert.courseTitle,
       isValid: cert.isValid,
       status: cert.status,
       maskedEmail
    }, 'Certificate verified successfully');
  } catch (err) {
    next(err);
  }
});

// Request OTP for certificate unlock
router.post('/certificates/:code/request-otp', async (req, res, next) => {
  try {
    const { code } = req.params;
    const cert = await CertificateModel.verifyCertificate(code);
    if (!cert) return sendError(res, 'Certificate not found', 404, 'NOT_FOUND');

    if (!cert.studentEmail) {
      return sendError(res, 'No email associated with this certificate owner', 400, 'VALIDATION_ERROR');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    cache.set(`cert_otp_${code.toUpperCase()}`, otp, 15 * 60);

    await emailService.sendCertificateDownloadOtp({
      email: cert.studentEmail,
      name: cert.studentName,
      otp,
      certificateCode: cert.certificateCode
    });

    return sendSuccess(res, { success: true }, 'OTP sent to the certificate owner');
  } catch (err) {
    next(err);
  }
});

// Verify OTP to get full certificate
router.post('/certificates/:code/verify-otp', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { otp } = req.body;

    if (!otp) return sendError(res, 'OTP is required', 400, 'VALIDATION_ERROR');

    const cleanOtp = String(otp).trim();
    const storedOtp = cache.get(`cert_otp_${code.toUpperCase()}`);
    
    if (!storedOtp || storedOtp !== cleanOtp) {
      return sendError(res, 'Invalid or expired OTP', 400, 'VALIDATION_ERROR');
    }

    const cert = await CertificateModel.verifyCertificate(code);
    if (!cert) return sendError(res, 'Certificate not found', 404, 'NOT_FOUND');

    cache.del(`cert_otp_${code.toUpperCase()}`);

    return sendSuccess(res, cert, 'OTP verified, certificate unlocked');
  } catch(err) {
    next(err);
  }
});

export default router;

