import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'SUPERADMIN'));

// Dashboard & Stats
router.get('/dashboard', TeacherController.getDashboard);

// Courses
router.get('/courses', TeacherController.getCourses);
router.post('/courses', TeacherController.createCourse);
router.get('/courses/:courseId', TeacherController.getCourseDetails);
router.put('/courses/:courseId', TeacherController.updateCourse);

// Curriculum: Units & Lessons
router.post('/courses/:courseId/units', TeacherController.addUnit);
router.post('/courses/:courseId/units/:unitId/lessons', TeacherController.addLesson);

// Classes
router.get('/classes', TeacherController.getClasses);
router.post('/classes', TeacherController.createClass);
router.get('/classes/:classId', TeacherController.getClassDetails);

export default router;
