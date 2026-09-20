import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Enforce authentication + TEACHER or SUPERADMIN role across all AI endpoints
router.use(authenticate);
router.use(authorize('TEACHER', 'SUPERADMIN'));

// Chat
router.post('/chat', AIController.chat);

// Generators
router.post('/lessons/generate', AIController.generateLessonPlan);
router.post('/lessons/draft', AIController.draftLessonContent);
router.post('/activities/generate', AIController.generateActivitySet);
router.post('/assessments/blueprint', AIController.generateAssessmentBlueprint);
router.post('/assessments/generate', AIController.generateAssessment);
router.post('/rubrics/generate', AIController.generateRubric);
router.post('/feedback/generate', AIController.generateFeedback);
router.post('/performance-recommendations', AIController.generatePerformanceRecommendations);

// History & Quota Telemetry
router.get('/stats', AIController.getStats);
router.get('/history', AIController.getHistory);
router.get('/history/:id', AIController.getHistoryById);
router.put('/history/:id', AIController.updateHistory);
router.delete('/history/:id', AIController.deleteHistory);

export default router;
