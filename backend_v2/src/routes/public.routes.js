import { Router } from 'express';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { CertificateModel } from '../models/certificate.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

const router = Router();

// Public Diagnostic Placement Quiz & Captcha
router.get('/captcha', DiagnosticController.getCaptcha);
router.get('/diagnostic-quiz', DiagnosticController.getPublicQuestions);
router.post('/diagnostic-quiz/submit', DiagnosticController.submitPublicAttempt);

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

