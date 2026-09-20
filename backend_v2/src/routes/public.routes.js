import { Router } from 'express';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';

const router = Router();

// Public Diagnostic Placement Quiz & Captcha
router.get('/captcha', DiagnosticController.getCaptcha);
router.get('/diagnostic-quiz', DiagnosticController.getPublicQuestions);
router.post('/diagnostic-quiz/submit', DiagnosticController.submitPublicAttempt);

export default router;
