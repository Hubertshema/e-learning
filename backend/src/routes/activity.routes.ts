import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Get activities for a lesson
router.get('/lesson/:lessonId', activityController.getLessonActivities);

// Teacher creates activity for a lesson
router.post('/lesson/:lessonId', activityController.createActivity);

// Student submits activity score
router.post('/:activityId/submit', activityController.submitActivityScore);

export default router;
