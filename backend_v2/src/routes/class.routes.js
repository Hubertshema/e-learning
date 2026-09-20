import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/teacher', authorize('TEACHER', 'SUPERADMIN'), ClassController.getTeacherClasses);
router.post('/teacher', authorize('TEACHER', 'SUPERADMIN'), ClassController.create);
router.get('/student', authorize('STUDENT', 'SUPERADMIN'), ClassController.getStudentClasses);
router.get('/:id', ClassController.getById);

export default router;
