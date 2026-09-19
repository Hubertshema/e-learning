import { prisma } from '../config/database.js';
import { teacherRepository } from '../repositories/teacher.repository.js';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateUnitInput,
  CreateLessonInput,
  CreateClassInput,
  GradeSubmissionInput,
  MarkAttendanceInput,
  CreateAssignmentInput,
  PaymentFilterInput,
  StudentFilterInput,
  AssignmentFilterInput,
  AttendanceFilterInput,
} from '../validators/teacher.validator.js';
import { AppError } from '../middleware/error.middleware.js';

export class TeacherService {
  async getDashboardStats(teacherId: string) {
    const [counts, recentPayments, recentSubmissions, upcomingClasses] = await Promise.all([
      teacherRepository.getDashboardCounts(teacherId),
      teacherRepository.getRecentPayments(teacherId, 5),
      teacherRepository.getRecentSubmissions(teacherId, 5),
      teacherRepository.getUpcomingClasses(teacherId, 5),
    ]);

    return {
      ...counts,
      recentPayments,
      recentSubmissions,
      upcomingClasses,
    };
  }

  // Course Management
  async getCourses(teacherId: string) {
    return teacherRepository.getCoursesByTeacher(teacherId);
  }

  async getCourseById(teacherId: string, courseId: string) {
    const course = await teacherRepository.getCourseDetails(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    return course;
  }

  async createCourse(teacherId: string, data: CreateCourseInput) {
    return teacherRepository.createCourse(teacherId, data);
  }

  async updateCourse(teacherId: string, courseId: string, data: UpdateCourseInput) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.updateCourse(courseId, data);
  }

  async deleteCourse(teacherId: string, courseId: string) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.deleteCourse(courseId);
  }

  // Units and Lessons
  async addUnit(teacherId: string, courseId: string, data: CreateUnitInput) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.createUnit(courseId, data);
  }

  async addLesson(teacherId: string, unitId: string, courseId: string, data: CreateLessonInput) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.createLesson(unitId, data);
  }

  // Classes
  async getClasses(teacherId: string) {
    return teacherRepository.getClassesByTeacher(teacherId);
  }

  async createClass(teacherId: string, data: CreateClassInput) {
    return teacherRepository.createClass(teacherId, data);
  }

  async getClassDetails(teacherId: string, classId: string) {
    const cls = await teacherRepository.getClassDetails(classId);
    if (!cls) {
      throw new AppError('Class not found', 404);
    }
    return cls;
  }

  // Payment Verification Queue
  async getPayments(teacherId: string, filters: PaymentFilterInput) {
    return teacherRepository.getPayments(teacherId, filters);
  }

  async approvePayment(teacherId: string, paymentId: string, notes?: string) {
    const result = await teacherRepository.approvePayment(paymentId, teacherId, notes);

    // Notify Student
    if (result) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'PAYMENT_VERIFIED',
        title: `Payment Verified: ${result.enrollment.course.title}`,
        message: `Your payment of ${result.currency} ${result.amount} has been verified and course access is activated.`,
        link: '/student/courses',
        emailTemplate: 'PaymentVerifiedEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          courseTitle: result.enrollment.course.title,
          amount: String(result.amount),
          currency: result.currency,
          expiryDate: result.enrollment.expiresAt ? new Date(result.enrollment.expiresAt).toLocaleDateString() : '90 days from now',
        },
        preferenceKey: 'paymentEmails',
      });
    }

    return result;
  }

  async rejectPayment(teacherId: string, paymentId: string, reason: string) {
    const result = await teacherRepository.rejectPayment(paymentId, teacherId, reason);

    // Notify Student
    if (result) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'PAYMENT_REJECTED',
        title: `Payment Issue: ${result.enrollment.course.title}`,
        message: `Your payment could not be verified: ${reason}`,
        link: '/student/payments',
        emailTemplate: 'PaymentRejectedEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          courseTitle: result.enrollment.course.title,
          reason,
        },
        preferenceKey: 'paymentEmails',
      });
    }

    return result;
  }

  // Assignments & Grading
  async getAssignments(teacherId: string, filters: AssignmentFilterInput) {
    return teacherRepository.getAssignments(teacherId, filters);
  }

  async createAssignment(teacherId: string, data: CreateAssignmentInput) {
    return teacherRepository.createAssignment(teacherId, data);
  }

  async getSubmissions(teacherId: string, assignmentId: string) {
    return teacherRepository.getSubmissions(teacherId, assignmentId);
  }

  async gradeSubmission(teacherId: string, submissionId: string, data: GradeSubmissionInput) {
    const result = await teacherRepository.gradeSubmission(teacherId, submissionId, data);

    if (result) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'ASSIGNMENT_GRADED',
        title: `Assignment Graded: ${result.assignment.title}`,
        message: `Your assignment "${result.assignment.title}" received a score of ${result.score}%.`,
        link: '/student/assignments',
        emailTemplate: 'AssignmentGradedEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          assignmentTitle: result.assignment.title,
          score: Number(result.score),
          feedback: data.feedback,
        },
        preferenceKey: 'assignmentEmails',
      });
    }

    return result;
  }

  // Attendance
  async getAttendanceRecords(teacherId: string, filters: AttendanceFilterInput) {
    return teacherRepository.getAttendance(teacherId, filters);
  }

  async markAttendance(teacherId: string, data: MarkAttendanceInput) {
    return teacherRepository.markAttendance(teacherId, data);
  }

  // Students & Skill Analytics
  async getStudents(teacherId: string, filters: StudentFilterInput) {
    return teacherRepository.getEnrolledStudents(teacherId, filters);
  }

  async getStudentProgress(teacherId: string, studentId: string) {
    return teacherRepository.getStudentDetailedProgress(teacherId, studentId);
  }

  async createStudentFeedback(
    teacherId: string,
    studentId: string,
    title: string,
    content: string,
    strengths: string[],
    improvements: string[]
  ) {
    const result = await teacherRepository.createStudentFeedback(teacherId, studentId, title, content, strengths, improvements);

    if (result) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'TEACHER_FEEDBACK',
        title: `Instructor Feedback: ${title}`,
        message: `Your teacher left personalized feedback on your progress: "${content}"`,
        link: '/student/feedback',
        emailTemplate: 'TeacherFeedbackEmail',
        emailData: {
          studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
          teacherName: `${result.teacher.user.firstName} ${result.teacher.user.lastName}`,
          comment: content,
        },
        preferenceKey: 'feedbackEmails',
      });
    }

    return result;
  }

  async getTeacherReports(teacherId: string) {
    return teacherRepository.getTeacherReports(teacherId);
  }

  // Course Publishing
  async publishCourse(teacherId: string, courseId: string) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.publishCourse(teacherId, courseId);
  }

  async unpublishCourse(teacherId: string, courseId: string) {
    await this.getCourseById(teacherId, courseId);
    return teacherRepository.unpublishCourse(teacherId, courseId);
  }

  // Units & Lessons Advanced
  async updateUnit(teacherId: string, unitId: string, data: any) {
    return teacherRepository.updateUnit(unitId, data);
  }

  async deleteUnit(teacherId: string, unitId: string) {
    return teacherRepository.deleteUnit(unitId);
  }

  async updateLesson(teacherId: string, lessonId: string, data: any) {
    return teacherRepository.updateLesson(lessonId, data);
  }

  async deleteLesson(teacherId: string, lessonId: string) {
    return teacherRepository.deleteLesson(lessonId);
  }

  // Quizzes Studio
  async getQuizzes(teacherId: string, courseId?: string) {
    return teacherRepository.getQuizzes(teacherId, courseId);
  }

  async getQuizDetails(teacherId: string, quizId: string) {
    return teacherRepository.getQuizDetails(teacherId, quizId);
  }

  async createQuiz(teacherId: string, data: any) {
    return teacherRepository.createQuiz(teacherId, data);
  }

  async deleteQuiz(teacherId: string, quizId: string) {
    return teacherRepository.deleteQuiz(teacherId, quizId);
  }

  async getQuizAnalytics(teacherId: string, quizId: string) {
    return teacherRepository.getQuizAnalytics(teacherId, quizId);
  }

  // Enrollments & Expiring Watchlist
  async getEnrollments(teacherId: string, status?: any) {
    return teacherRepository.getEnrollments(teacherId, status);
  }

  async getExpiringStudents(teacherId: string, days = 7) {
    return teacherRepository.getExpiringStudents(teacherId, days);
  }

  async extendEnrollment(teacherId: string, enrollmentId: string, extensionDays = 30, reason?: string) {
    return teacherRepository.extendEnrollment(teacherId, enrollmentId, extensionDays, reason);
  }

  async suspendEnrollment(teacherId: string, enrollmentId: string, reason: string) {
    return teacherRepository.suspendEnrollment(teacherId, enrollmentId, reason);
  }

  // Calendar & Feedback
  async getCalendarEvents(teacherId: string) {
    return teacherRepository.getCalendarEvents(teacherId);
  }

  async getFeedbackList(teacherId: string) {
    return teacherRepository.getFeedbackList(teacherId);
  }

  // Preferences & Payment Settings
  async getTeachingPreferences(userId: string) {
    return prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        headline: true,
        bio: true,
        experienceYears: true,
        hourlyRate: true,
        levelsTaught: true,
        specialties: true,
        languagesSpoken: true,
        profileVisibility: true,
        teachingPreferences: true,
      },
    });
  }

  async updateTeachingPreferences(userId: string, data: any) {
    return prisma.teacherProfile.update({
      where: { userId },
      data: {
        ...(data.levelsTaught && { levelsTaught: data.levelsTaught }),
        ...(data.specialties && { specialties: data.specialties }),
        ...(data.languagesSpoken && { languagesSpoken: data.languagesSpoken }),
        teachingPreferences: data,
      },
    });
  }

  async getPaymentSettings(userId: string) {
    return prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        paymentInfo: true,
        hourlyRate: true,
      },
    });
  }

  async updatePaymentSettings(userId: string, data: any) {
    return prisma.teacherProfile.update({
      where: { userId },
      data: {
        paymentInfo: data,
        ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
      },
    });
  }
}

export const teacherService = new TeacherService();

