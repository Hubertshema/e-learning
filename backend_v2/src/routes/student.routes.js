import { Router } from 'express';
import { PlacementController } from '../controllers/placement.controller.js';
import { StudentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Student Placement Test
router.get('/placement-test', PlacementController.getStudentPlacementTest);
router.get('/placements', PlacementController.getAvailablePlacements);
router.post('/placement-test', PlacementController.submitStudentPlacementTest);

// Student Courses
router.get('/courses', (req, res, next) => {
  req.params.id = 'me';
  return StudentController.getStudentCourses(req, res, next);
});
router.get('/:id/courses', StudentController.getStudentCourses);
router.get('/:id/course-access/:courseId', StudentController.getCourseAccess);

export default router;
