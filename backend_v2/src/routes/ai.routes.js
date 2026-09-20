import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'SUPERADMIN'));

router.post('/lessons/draft', AIController.draftLessonContent);
router.post('/quizzes/generate', AIController.generateQuizQuestions);
router.post('/quizzes/generate-advanced', AIController.generateAdvancedQuiz);
router.post('/quizzes/transform-question', AIController.transformQuestion);
router.post('/diagnostic/generate', AIController.generateDiagnosticQuiz);
router.post('/chat', AIController.chat);
router.get('/stats', AIController.getStats);

export default router;
