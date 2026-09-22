import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller.js';
import { QuizController } from '../controllers/quiz.controller.js';
import { DiagnosticController } from '../controllers/diagnostic.controller.js';
import { PlacementController } from '../controllers/placement.controller.js';
import { AssignmentController } from '../controllers/assignment.controller.js';
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

// Assignments & Submissions
router.get('/assignments/lessons', AssignmentController.getTeacherLessons);
router.get('/assignments', AssignmentController.getAssignments);
router.post('/assignments', AssignmentController.createAssignment);
router.get('/assignments/:id', AssignmentController.getAssignmentById);
router.put('/assignments/:id', AssignmentController.updateAssignment);
router.delete('/assignments/:id', AssignmentController.deleteAssignment);
router.get('/assignments/:id/submissions', AssignmentController.getSubmissions);
router.post('/submissions/:submissionId/grade', AssignmentController.gradeSubmission);

// Students Directory & Progress Analytics
router.get('/students', TeacherController.getStudents);
router.get('/students/:studentId/progress', TeacherController.getStudentProgress);
router.post('/students/:studentId/feedback', TeacherController.addStudentFeedback);
router.patch('/students/:enrollmentId', TeacherController.updateStudentEnrollment);
router.delete('/students/:enrollmentId', TeacherController.deleteStudentEnrollment);

export default router;


