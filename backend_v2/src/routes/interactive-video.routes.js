import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { InteractiveVideoController as C } from '../controllers/interactive-video.controller.js';

export const teacherInteractiveVideoRoutes = Router();
teacherInteractiveVideoRoutes.use(authenticate, authorize('TEACHER', 'SUPERADMIN'));
teacherInteractiveVideoRoutes.get('/lessons/:lessonId', C.getTeacherLesson);
teacherInteractiveVideoRoutes.put('/lessons/:lessonId', C.saveLesson);
teacherInteractiveVideoRoutes.post('/lessons/:lessonId/activities', C.saveActivity);
teacherInteractiveVideoRoutes.post('/lessons/:lessonId/generate-activities', C.generateActivities);
teacherInteractiveVideoRoutes.post('/lessons/:lessonId/resources', C.addResource);
teacherInteractiveVideoRoutes.patch('/resources/:resourceId', C.updateResource);
teacherInteractiveVideoRoutes.put('/resources/:resourceId', C.updateResource);
teacherInteractiveVideoRoutes.delete('/resources/:resourceId', C.deleteResource);
teacherInteractiveVideoRoutes.get('/lessons/:lessonId/analytics', C.analytics);
teacherInteractiveVideoRoutes.delete('/activities/:activityId', C.deleteActivity);

export const studentInteractiveVideoRoutes = Router();
studentInteractiveVideoRoutes.use(authenticate, authorize('STUDENT', 'TEACHER', 'SUPERADMIN'));
studentInteractiveVideoRoutes.get('/lessons/:lessonId', C.getStudentLesson);
studentInteractiveVideoRoutes.post('/lessons/:lessonId/progress', C.saveProgress);
studentInteractiveVideoRoutes.post('/activities/:activityId/attempts', C.submitAttempt);
studentInteractiveVideoRoutes.get('/resources/:resourceId/download', C.downloadResource);
