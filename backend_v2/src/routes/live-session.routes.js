import { Router } from 'express';
import { LiveSessionController } from '../controllers/live-session.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All live session routes require authentication
router.use(authenticate);

// Teacher-specific session listings, creation, and eligible students
router.post('/', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.createSession);
router.get('/teacher', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.getTeacherSessions);
router.get('/students', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.getAvailableStudents);

// Student session listings
router.get('/student', LiveSessionController.getStudentSessions);

// Individual session operations
router.get('/:id', LiveSessionController.getSessionDetails);
router.post('/:id/start', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.startSession);
router.post('/:id/end', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.endSession);
router.post('/:id/remove-participant', authorize('TEACHER', 'SUPERADMIN'), LiveSessionController.removeParticipant);

export default router;
