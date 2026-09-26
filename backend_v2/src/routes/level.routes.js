import { Router } from 'express';
import { LevelController } from '../controllers/level.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', LevelController.list);
router.get('/:id', LevelController.getById);
router.get('/:id/courses', LevelController.getCourses);

// Level-Course Assignments
// E.g., POST /api/v1/levels/1/courses
router.post('/:id/courses', authorize('TEACHER', 'SUPERADMIN'), LevelController.assignCourse);

// E.g., PUT /api/v1/levels/level-course/123
router.put('/level-course/:levelCourseId', authorize('TEACHER', 'SUPERADMIN'), LevelController.updateCourseAssignment);

// E.g., DELETE /api/v1/levels/1/courses/abc
router.delete('/:id/courses/:courseId', authorize('TEACHER', 'SUPERADMIN'), LevelController.removeCourse);

// Level-Student Enrollments
router.get('/:id/students', authorize('TEACHER', 'SUPERADMIN'), LevelController.getStudents);
router.post('/:id/enroll', authorize('TEACHER', 'SUPERADMIN'), LevelController.enrollStudents);
router.delete('/:id/students/:studentId', authorize('TEACHER', 'SUPERADMIN'), LevelController.unenrollStudent);

export default router;
