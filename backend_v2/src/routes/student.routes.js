import { Router } from 'express';
import { PlacementController } from '../controllers/placement.controller.js';
import { StudentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

import { AdmissionController } from '../controllers/admission.controller.js';

const router = Router();

// Public Student Application route
router.post('/apply', AdmissionController.submitApplication);

router.use(authenticate);

// Student Admission, Payment & Learning Access Status
router.get('/admission-status', AdmissionController.getStudentStatus);
router.post('/payment-proof', AdmissionController.submitPaymentProof);

// Student Placement Test
router.get('/placement-test', PlacementController.getStudentPlacementTest);
router.get('/placements', PlacementController.getAvailablePlacements);
router.post('/placement-test', PlacementController.submitStudentPlacementTest);

// Student Dashboard
router.get('/dashboard', StudentController.getDashboard);

// Student Courses & Learning Room
router.get('/courses', (req, res, next) => {
  req.params.id = 'me';
  return StudentController.getStudentCourses(req, res, next);
});
router.get('/courses/:courseId', StudentController.getCourseLearningData);
router.get('/courses/:courseId/learn', StudentController.getCourseLearningData);
router.get('/:id/courses', StudentController.getStudentCourses);
router.get('/:id/course-access/:courseId', StudentController.getCourseAccess);

// Lesson Progress & Completion
router.post('/lessons/:lessonId/complete', StudentController.completeLesson);
router.get('/lessons/:lessonId/activities', StudentController.getLessonActivities);

export default router;
