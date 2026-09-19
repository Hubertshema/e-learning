import { Router } from 'express';
import { publicController } from '../controllers/public.controller.js';

const router = Router();

// Certificates verification (Public)
router.get('/certificates/:code', publicController.verifyCertificate);

// Platform stats (Public)
router.get('/stats', publicController.getPlatformStats);

// Real-time published courses catalog (Public)
router.get('/courses', publicController.listPublishedCourses);

// Newsletter subscription (Public)
router.post('/newsletter/subscribe', publicController.subscribeNewsletter);

// Contact Us message submission (Public)
router.post('/contact', publicController.submitContactMessage);

// Public CEFR Diagnostic Placement Assessment
router.get('/diagnostic-quiz', publicController.getDiagnosticQuiz);
router.post('/diagnostic-quiz/submit', publicController.submitDiagnosticQuiz);

export default router;

