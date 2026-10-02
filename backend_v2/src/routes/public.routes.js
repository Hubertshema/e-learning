import { Router } from 'express';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { CourseController } from '../controllers/course.controller.js';
import { CertificateModel } from '../models/certificate.model.js';
import { ContactModel } from '../models/contact.model.js';
import { emailService } from '../services/email.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

const router = Router();

// Public Diagnostic Placement Quiz & Captcha
router.get('/captcha', DiagnosticController.getCaptcha);
router.get('/diagnostic-quiz', DiagnosticController.getPublicQuestions);
router.post('/diagnostic-quiz/submit', DiagnosticController.submitPublicAttempt);

// Public Course Catalog Alias
router.get('/courses', CourseController.list);

// Public Contact Form
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return sendError(res, 'Name, email, and message are required', 400, 'VALIDATION_ERROR');
    }

    // 1. Store message in database
    const saved = await ContactModel.createMessage({
      name,
      email,
      phone,
      subject,
      message,
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
      'Thank you for reaching out! The LinguaChris academic team will contact you shortly.'
    );
  } catch (err) {
    next(err);
  }
});

// Public Newsletter Subscription
router.post('/newsletter/subscribe', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
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

    return sendSuccess(res, cert, 'Certificate verified successfully');
  } catch (err) {
    next(err);
  }
});

export default router;

