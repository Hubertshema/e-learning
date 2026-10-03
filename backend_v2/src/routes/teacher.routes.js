import { Router } from 'express';
import { TeacherController, getLibraryItems } from '../controllers/teacher.controller.js';
import { QuizController } from '../controllers/quiz.controller.js';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { PlacementController } from '../controllers/placement.controller.js';
import { AdmissionController } from '../controllers/admission.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';


const router = Router();

router.use(authenticate);
router.use(authorize('TEACHER', 'SUPERADMIN'));

// Dashboard & Stats
router.get('/dashboard', TeacherController.getDashboard);

// Resource Library (all PDFs + videos owned by this teacher)
router.get('/library', async (req, res, next) => {
  try {
    const teacherId = req.user.id || req.user.userId;
    const items = await getLibraryItems(teacherId);
    return res.json({ success: true, data: { items, total: items.length } });
  } catch (err) {
    next(err);
  }
});

// Courses
router.get('/courses', TeacherController.getCourses);
router.post('/courses', TeacherController.createCourse);
router.get('/courses/:courseId', TeacherController.getCourseDetails);
router.put('/courses/:courseId', TeacherController.updateCourse);
router.delete('/courses/:courseId', TeacherController.deleteCourse);
router.post('/courses/:courseId/publish', TeacherController.publishCourse);
router.post('/courses/:courseId/unpublish', TeacherController.unpublishCourse);

// Curriculum: Units & Lessons
router.post('/courses/:courseId/units', TeacherController.addUnit);
router.patch('/units/:unitId', TeacherController.updateUnit);
router.put('/units/:unitId', TeacherController.updateUnit);
router.delete('/units/:unitId', TeacherController.deleteUnit);

router.post('/courses/:courseId/units/:unitId/lessons', TeacherController.addLesson);
router.get('/lessons/:lessonId', TeacherController.getLessonDetails);
router.patch('/lessons/:lessonId', TeacherController.updateLesson);
router.put('/lessons/:lessonId', TeacherController.updateLesson);
router.delete('/lessons/:lessonId', TeacherController.deleteLesson);

// Classes
router.get('/classes', TeacherController.getClasses);
router.post('/classes', TeacherController.createClass);
router.get('/classes/:classId', TeacherController.getClassDetails);

// Quizzes & Assessments
router.get('/quizzes', QuizController.getQuizzes);
router.get('/quizzes/:quizId/analytics', QuizController.getQuizAnalytics);
router.get('/quizzes/:quizId', QuizController.getQuizById);
router.post('/quizzes', QuizController.createQuiz);
router.delete('/quizzes/:quizId', QuizController.deleteQuiz);

// Diagnostic Quiz & Placement Studio
router.get('/diagnostic-quiz/questions', DiagnosticController.getTeacherQuestions);
router.post('/diagnostic-quiz/questions', DiagnosticController.createQuestion);
router.post('/diagnostic-quiz/questions/bulk', DiagnosticController.bulkCreateQuestions);
router.put('/diagnostic-quiz/questions/:id', DiagnosticController.updateQuestion);
router.delete('/diagnostic-quiz/questions/:id', DiagnosticController.deleteQuestion);
router.get('/diagnostic-quiz/analytics', DiagnosticController.getTeacherAnalytics);

// Placements Management (Batches & Questions)
router.get('/placements', PlacementController.getPlacements);
router.post('/placements', PlacementController.createPlacement);
router.get('/placements/analytics', PlacementController.getPlacementAnalytics);
router.get('/placements/:id', PlacementController.getPlacementById);
router.put('/placements/:id', PlacementController.updatePlacement);
router.delete('/placements/:id', PlacementController.deletePlacement);
router.post('/placements/:id/questions', PlacementController.addQuestion);
router.post('/placements/:id/questions/bulk', PlacementController.bulkAddQuestions);
router.put('/placements/:id/reorder', PlacementController.reorderQuestions);
router.put('/placements/questions/:questionId', PlacementController.updateQuestion);
router.delete('/placements/questions/:questionId', PlacementController.deleteQuestion);

// Students Directory & Progress Analytics
router.get('/students', TeacherController.getStudents);
router.get('/students/:studentId/progress', TeacherController.getStudentProgress);
router.post('/students/:studentId/feedback', TeacherController.addStudentFeedback);
router.patch('/students/:enrollmentId', TeacherController.updateStudentEnrollment);
router.delete('/students/:enrollmentId', TeacherController.deleteStudentEnrollment);

// Enrollments & Expiring Students
router.get('/enrollments', TeacherController.getEnrollments);
router.post('/enrollments/:enrollmentId/extend', TeacherController.extendEnrollment);
router.post('/enrollments/:enrollmentId/suspend', TeacherController.suspendEnrollment);
router.get('/expiring-students', TeacherController.getExpiringStudents);

// Student Applications & Direct Admissions
router.get('/applications', AdmissionController.listApplications);
router.get('/applications/:studentId', AdmissionController.getApplicationDetails);
router.post('/applications/:studentId/review', AdmissionController.reviewApplication);
router.post('/students/direct', AdmissionController.createDirectStudent);
router.patch('/students/:studentId/payment-requirement', AdmissionController.changePaymentRequirement);
router.post('/students/:studentId/verify-payment', AdmissionController.verifyPaymentProof);
router.post('/students/:studentId/reject-payment', AdmissionController.rejectPaymentProof);
router.post('/students/:studentId/enroll-level', AdmissionController.enrollStudentInLevel);

// Payment Channels & Instructions Configuration
router.get('/payment-settings', AdmissionController.getPaymentSettings);
router.patch('/payment-settings', AdmissionController.updatePaymentSettings);

export default router;


