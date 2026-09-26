import { Router } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public course catalog
router.get('/', CourseController.list);
router.get('/:id', CourseController.getById);

// Teacher course management
router.get('/teacher/my-courses', authenticate, authorize('TEACHER', 'SUPERADMIN'), CourseController.getTeacherCourses);
router.post('/teacher/create', authenticate, authorize('TEACHER', 'SUPERADMIN'), CourseController.create);
router.get('/:id/students', authenticate, authorize('TEACHER', 'SUPERADMIN'), CourseController.getStudents);

// Student enrollments
router.post('/:id/enroll', authenticate, authorize('STUDENT'), CourseController.enroll);
router.delete('/:id/enroll', authenticate, authorize('STUDENT'), CourseController.unenroll);

export default router;
