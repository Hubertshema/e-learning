import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all teacher routes
router.use(authenticate);
router.use(authorize('TEACHER', 'SUPERADMIN'));

// Dashboard & Stats
router.get('/dashboard', teacherController.getDashboard);
router.get('/reports', teacherController.getReports);
router.get('/calendar', teacherController.getCalendarEvents);
router.get('/feedback', teacherController.getFeedbackList);

// Teaching Preferences & Payout Receiving Information
router.get('/preferences', teacherController.getTeachingPreferences);
router.patch('/preferences', teacherController.updateTeachingPreferences);
router.get('/payment-settings', teacherController.getPaymentSettings);
router.patch('/payment-settings', teacherController.updatePaymentSettings);

// Courses Management & Publishing
router.get('/courses', teacherController.getCourses);
router.post('/courses', teacherController.createCourse);
router.get('/courses/:courseId', teacherController.getCourseDetails);
router.put('/courses/:courseId', teacherController.updateCourse);
router.delete('/courses/:courseId', teacherController.deleteCourse);
router.post('/courses/:courseId/publish', teacherController.publishCourse);
router.post('/courses/:courseId/unpublish', teacherController.unpublishCourse);

// Curriculum: Units & Lessons
router.post('/courses/:courseId/units', teacherController.addUnit);
router.patch('/units/:unitId', teacherController.updateUnit);
router.delete('/units/:unitId', teacherController.deleteUnit);

router.post('/courses/:courseId/units/:unitId/lessons', teacherController.addLesson);
router.get('/lessons/:lessonId', teacherController.getLessonDetails);
router.patch('/lessons/:lessonId', teacherController.updateLesson);
router.delete('/lessons/:lessonId', teacherController.deleteLesson);

// Quizzes Studio & Analytics
router.get('/quizzes', teacherController.getQuizzes);
router.post('/quizzes', teacherController.createQuiz);
router.get('/quizzes/:quizId', teacherController.getQuizDetails);
router.delete('/quizzes/:quizId', teacherController.deleteQuiz);
router.get('/quizzes/:quizId/analytics', teacherController.getQuizAnalytics);

// Diagnostic Placement Quiz CRUD & Performance Analytics
router.get('/diagnostic-quiz/questions', teacherController.getDiagnosticQuestions);
router.post('/diagnostic-quiz/questions', teacherController.createDiagnosticQuestion);
router.put('/diagnostic-quiz/questions/:id', teacherController.updateDiagnosticQuestion);
router.delete('/diagnostic-quiz/questions/:id', teacherController.deleteDiagnosticQuestion);
router.get('/diagnostic-quiz/analytics', teacherController.getDiagnosticAnalytics);

// Classes & Cohorts
router.get('/classes', teacherController.getClasses);
router.post('/classes', teacherController.createClass);
router.get('/classes/:classId', teacherController.getClassDetails);

// Enrollments & Expiring Students Watchlist
router.get('/enrollments', teacherController.getEnrollments);
router.get('/expiring-students', teacherController.getExpiringStudents);
router.post('/enrollments/:enrollmentId/extend', teacherController.extendEnrollment);
router.post('/enrollments/:enrollmentId/suspend', teacherController.suspendEnrollment);

// Payment Verification Queue
router.get('/payments', teacherController.getPayments);
router.post('/payments/:paymentId/approve', teacherController.approvePayment);
router.post('/payments/:paymentId/reject', teacherController.rejectPayment);

// Assignments & Grading
router.get('/assignments', teacherController.getAssignments);
router.post('/assignments', teacherController.createAssignment);
router.get('/assignments/:assignmentId/submissions', teacherController.getSubmissions);
router.post('/submissions/:submissionId/grade', teacherController.gradeSubmission);

// Attendance
router.get('/attendance', teacherController.getAttendance);
router.post('/attendance', teacherController.markAttendance);

// Students Directory, Progress & Coaching
router.get('/students', teacherController.getStudents);
router.get('/students/:studentId/progress', teacherController.getStudentProgress);
router.post('/students/:studentId/feedback', teacherController.createStudentFeedback);

export default router;
