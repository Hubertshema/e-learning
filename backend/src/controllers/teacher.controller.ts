import { Request, Response, NextFunction } from 'express';
import { teacherService } from '../services/teacher.service.js';
import {
  createCourseSchema,
  updateCourseSchema,
  createUnitSchema,
  createLessonSchema,
  createClassSchema,
  gradeSubmissionSchema,
  markAttendanceSchema,
  createAssignmentSchema,
  paymentFilterSchema,
  studentFilterSchema,
  assignmentFilterSchema,
  attendanceFilterSchema,
} from '../validators/teacher.validator.js';

export class TeacherController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await teacherService.getDashboardStats(req.user!.userId);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Courses
  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await teacherService.getCourses(req.user!.userId);
      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  }

  async getCourseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await teacherService.getCourseById(req.user!.userId, req.params.courseId);
      res.status(200).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createCourseSchema.parse(req.body);
      const course = await teacherService.createCourse(req.user!.userId, validated);
      res.status(201).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateCourseSchema.parse(req.body);
      const course = await teacherService.updateCourse(req.user!.userId, req.params.courseId, validated);
      res.status(200).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      await teacherService.deleteCourse(req.user!.userId, req.params.courseId);
      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Units & Lessons
  async addUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createUnitSchema.parse(req.body);
      const unit = await teacherService.addUnit(req.user!.userId, req.params.courseId, validated);
      res.status(201).json({ success: true, data: unit });
    } catch (error) {
      next(error);
    }
  }

  async addLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createLessonSchema.parse(req.body);
      const lesson = await teacherService.addLesson(req.user!.userId, req.params.unitId, req.params.courseId, validated);
      res.status(201).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  }

  // Classes
  async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const classes = await teacherService.getClasses(req.user!.userId);
      res.status(200).json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  }

  async getClassDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const cls = await teacherService.getClassDetails(req.user!.userId, req.params.classId);
      res.status(200).json({ success: true, data: cls });
    } catch (error) {
      next(error);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createClassSchema.parse(req.body);
      const newClass = await teacherService.createClass(req.user!.userId, validated);
      res.status(201).json({ success: true, data: newClass });
    } catch (error) {
      next(error);
    }
  }

  // Payments
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = paymentFilterSchema.parse(req.query);
      const result = await teacherService.getPayments(req.user!.userId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async approvePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const notes = req.body.notes;
      const result = await teacherService.approvePayment(req.user!.userId, req.params.paymentId, notes);
      res.status(200).json({ success: true, data: result, message: 'Payment approved and enrollment activated' });
    } catch (error) {
      next(error);
    }
  }

  async rejectPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const reason = req.body.reason || 'Payment verification failed';
      const result = await teacherService.rejectPayment(req.user!.userId, req.params.paymentId, reason);
      res.status(200).json({ success: true, data: result, message: 'Payment rejected' });
    } catch (error) {
      next(error);
    }
  }

  // Assignments
  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = assignmentFilterSchema.parse(req.query);
      const result = await teacherService.getAssignments(req.user!.userId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createAssignmentSchema.parse(req.body);
      const assignment = await teacherService.createAssignment(req.user!.userId, validated);
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const submissions = await teacherService.getSubmissions(req.user!.userId, req.params.assignmentId);
      res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = gradeSubmissionSchema.parse(req.body);
      const graded = await teacherService.gradeSubmission(req.user!.userId, req.params.submissionId, validated);
      res.status(200).json({ success: true, data: graded, message: 'Submission graded successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Attendance
  async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = attendanceFilterSchema.parse(req.query);
      const records = await teacherService.getAttendanceRecords(req.user!.userId, filters);
      res.status(200).json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = markAttendanceSchema.parse(req.body);
      const result = await teacherService.markAttendance(req.user!.userId, validated);
      res.status(200).json({ success: true, data: result, message: 'Attendance recorded successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Students & Progress
  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = studentFilterSchema.parse(req.query);
      const result = await teacherService.getStudents(req.user!.userId, filters);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStudentProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await teacherService.getStudentProgress(req.user!.userId, req.params.studentId);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  }

  async createStudentFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, strengths, improvements } = req.body;
      const feedback = await teacherService.createStudentFeedback(
        req.user!.userId,
        req.params.studentId,
        title || 'Instructor Coaching',
        content,
        strengths || [],
        improvements || []
      );
      res.status(201).json({ success: true, data: feedback, message: 'Coaching note sent to student' });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await teacherService.getTeacherReports(req.user!.userId);
      res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  }

  // Course Publishing
  async publishCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.publishCourse(req.user!.userId, req.params.courseId);
      res.status(200).json({ success: true, data: result, message: 'Course published successfully' });
    } catch (error) {
      next(error);
    }
  }

  async unpublishCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.unpublishCourse(req.user!.userId, req.params.courseId);
      res.status(200).json({ success: true, data: result, message: 'Course unpublished successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Units & Lessons Advanced
  async updateUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.updateUnit(req.user!.userId, req.params.unitId, req.body);
      res.status(200).json({ success: true, data: result, message: 'Unit updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteUnit(req: Request, res: Response, next: NextFunction) {
    try {
      await teacherService.deleteUnit(req.user!.userId, req.params.unitId);
      res.status(200).json({ success: true, message: 'Unit deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getLessonDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson = await teacherService.getLessonDetails(req.user!.userId, req.params.lessonId);
      res.status(200).json({ success: true, data: lesson });
    } catch (error) {
      next(error);
    }
  }

  async updateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teacherService.updateLesson(req.user!.userId, req.params.lessonId, req.body);
      res.status(200).json({ success: true, data: result, message: 'Lesson updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteLesson(req: Request, res: Response, next: NextFunction) {
    try {
      await teacherService.deleteLesson(req.user!.userId, req.params.lessonId);
      res.status(200).json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Quizzes Studio
  async getQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.query.courseId as string | undefined;
      const quizzes = await teacherService.getQuizzes(req.user!.userId, courseId);
      res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
      next(error);
    }
  }

  async getQuizDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const quiz = await teacherService.getQuizDetails(req.user!.userId, req.params.quizId);
      res.status(200).json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  }

  async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const quiz = await teacherService.createQuiz(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: quiz, message: 'Quiz created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      await teacherService.deleteQuiz(req.user!.userId, req.params.quizId);
      res.status(200).json({ success: true, message: 'Quiz deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getQuizAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await teacherService.getQuizAnalytics(req.user!.userId, req.params.quizId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // Enrollments & Expiring Watchlist
  async getEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as any;
      const enrollments = await teacherService.getEnrollments(req.user!.userId, status);
      res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
      next(error);
    }
  }

  async getExpiringStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const students = await teacherService.getExpiringStudents(req.user!.userId, days);
      res.status(200).json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  async extendEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const { extensionDays, reason } = req.body;
      const result = await teacherService.extendEnrollment(
        req.user!.userId,
        req.params.enrollmentId,
        extensionDays || 30,
        reason
      );
      res.status(200).json({ success: true, data: result, message: 'Enrollment extended successfully' });
    } catch (error) {
      next(error);
    }
  }

  async suspendEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const result = await teacherService.suspendEnrollment(req.user!.userId, req.params.enrollmentId, reason);
      res.status(200).json({ success: true, data: result, message: 'Enrollment suspended' });
    } catch (error) {
      next(error);
    }
  }

  // Calendar & Feedback
  async getCalendarEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await teacherService.getCalendarEvents(req.user!.userId);
      res.status(200).json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackList(req: Request, res: Response, next: NextFunction) {
    try {
      const feedbacks = await teacherService.getFeedbackList(req.user!.userId);
      res.status(200).json({ success: true, data: feedbacks });
    } catch (error) {
      next(error);
    }
  }

  // Preferences & Payment Settings
  async getTeachingPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await teacherService.getTeachingPreferences(req.user!.userId);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  async updateTeachingPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await teacherService.updateTeachingPreferences(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: updated, message: 'Teaching preferences updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await teacherService.getPaymentSettings(req.user!.userId);
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updatePaymentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await teacherService.updatePaymentSettings(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: updated, message: 'Payment receiving details updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Diagnostic Placement Quiz CRUD & Analytics
  async getDiagnosticQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const questions = await teacherService.getDiagnosticQuestions();
      res.status(200).json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }

  async createDiagnosticQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await teacherService.createDiagnosticQuestion(req.body);
      res.status(201).json({ success: true, data: question, message: 'Diagnostic question created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateDiagnosticQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await teacherService.updateDiagnosticQuestion(req.params.id, req.body);
      res.status(200).json({ success: true, data: question, message: 'Diagnostic question updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteDiagnosticQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      await teacherService.deleteDiagnosticQuestion(req.params.id);
      res.status(200).json({ success: true, message: 'Diagnostic question deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getDiagnosticAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await teacherService.getDiagnosticAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();


