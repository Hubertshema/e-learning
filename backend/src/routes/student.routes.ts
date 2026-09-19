import { Router } from 'express';
import { studentController } from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all student routes
router.use(authenticate);
router.use(authorize('STUDENT', 'SUPERADMIN'));

// Profile & Settings
router.get('/me', studentController.getProfile);
router.patch('/me', studentController.updateProfile);

// Dashboard Overview
router.get('/dashboard', studentController.getDashboard);

// Courses & Learning Views
router.get('/courses', studentController.getCourses);
router.get('/courses/:courseId', studentController.getCourseDetails);
router.post('/courses/:courseId/renew', studentController.renewCourse);

// Enrollments Lifecycle
router.get('/enrollments', studentController.getEnrollments);

// Enrollment & Payment Proof Checkout & Subscriptions
router.get('/subscription', studentController.getSubscription);
router.post('/payments/submit', studentController.submitPaymentProof);
router.get('/payments', studentController.getPayments);

// Lessons Progress & Study Time
router.post('/lessons/:lessonId/complete', studentController.completeLesson);

// Assignments & Submission Workspace
router.get('/assignments', studentController.getAssignments);
router.post('/assignments/:assignmentId/submit', studentController.submitAssignment);

// Quizzes & Auto-evaluation
router.get('/quizzes', studentController.getQuizzes);
router.post('/quizzes/:quizId/submit', studentController.submitQuiz);

// Progress, 7-Skill Matrix & Academic Results
router.get('/progress', studentController.getProgress);
router.get('/results', studentController.getResults);

// Attendance & Coaching Feedback
router.get('/attendance', studentController.getAttendance);
router.get('/feedback', studentController.getFeedback);

// Calendar & Schedule
router.get('/calendar', studentController.getCalendar);

// Placement Test
router.post('/placement-test', studentController.submitPlacementTest);

// Certificates
router.get('/certificates', studentController.getCertificates);

// Danger Zone
router.post('/danger/request-deletion', studentController.requestAccountDeletion);

export default router;
