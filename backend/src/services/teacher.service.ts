import { prisma } from '../config/database.js';
import { teacherRepository } from '../repositories/teacher.repository.js';
import { notificationService } from './notification.service.js';
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
    const [counts, recentPayments, recentSubmissions, upcomingClasses, skillProficiency] = await Promise.all([
      teacherRepository.getDashboardCounts(teacherId),
      teacherRepository.getRecentPayments(teacherId, 5),
      teacherRepository.getRecentSubmissions(teacherId, 5),
      teacherRepository.getUpcomingClasses(teacherId, 5),
      teacherRepository.getSkillProficiencySummary(teacherId),
    ]);

    return {
      ...counts,
      recentPayments,
      recentSubmissions,
      upcomingClasses,
      skillProficiency,
    };
  }

  async getTeacherReports(teacherId: string) {
    return teacherRepository.getTeacherReports(teacherId);
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

  async getAvailableStudents(teacherId: string) {
    return teacherRepository.getAvailableStudents(teacherId);
  }

  async enrollStudentInClass(teacherId: string, classId: string, data: { studentEmail?: string; studentId?: string; studentIds?: string[]; courseIds?: string[] }) {
    return teacherRepository.enrollStudentInClass(teacherId, classId, data);
  }

  async updateCohortCourses(teacherId: string, classId: string, courseIds: string[]) {
    return teacherRepository.updateCohortCourses(teacherId, classId, courseIds);
  }

  async updateClass(teacherId: string, classId: string, data: any) {
    return teacherRepository.updateClass(teacherId, classId, data);
  }

  async deleteClass(teacherId: string, classId: string) {
    return teacherRepository.deleteClass(teacherId, classId);
  }

  async removeStudentFromClass(teacherId: string, classId: string, studentId: string) {
    return teacherRepository.removeStudentFromClass(teacherId, classId, studentId);
  }

  // Payment Verification Queue
  async getPayments(teacherId: string, filters: PaymentFilterInput) {
    return teacherRepository.getPayments(teacherId, filters);
  }

  async approvePayment(teacherId: string, paymentId: string, notes?: string) {
    const result = (await teacherRepository.approvePayment(paymentId, teacherId, notes)) as any;

    // Notify Student
    if (result && result.student) {
      const studentName = `${result.student.user?.firstName || ''} ${result.student.user?.lastName || ''}`.trim() || 'Student';
      const courseTitle = result.course?.title || result.enrollment?.course?.title || 'Course';
      const amount = String(result.payment?.amount || result.amount || '0');
      const currency = result.payment?.currency || result.currency || 'USD';
      const expiryDate = result.enrollment?.expiresAt ? new Date(result.enrollment.expiresAt).toLocaleDateString() : '90 days from now';

      try {
        await notificationService.notifyUser({
          userId: result.student.userId,
          type: 'PAYMENT_VERIFIED',
          title: `Payment Verified: ${courseTitle}`,
          message: `Your payment of ${currency} ${amount} has been verified and course access is activated.`,
          link: '/student/courses',
          emailTemplate: 'PaymentVerifiedEmail',
          emailData: {
            studentName,
            courseTitle,
            amount,
            currency,
            expiryDate,
          },
          preferenceKey: 'paymentEmails',
        });
      } catch (notifErr) {
        console.warn('Could not dispatch payment verification email/notification:', notifErr);
      }
    }

    return result;
  }

  async rejectPayment(teacherId: string, paymentId: string, reason: string) {
    const result = (await teacherRepository.rejectPayment(paymentId, teacherId, reason)) as any;

    // Notify Student
    if (result && result.student) {
      const studentName = `${result.student.user?.firstName || ''} ${result.student.user?.lastName || ''}`.trim() || 'Student';
      const courseTitle = result.course?.title || result.enrollment?.course?.title || 'Course';

      try {
        await notificationService.notifyUser({
          userId: result.student.userId,
          type: 'PAYMENT_REJECTED',
          title: `Payment Issue: ${courseTitle}`,
          message: `Your payment could not be verified: ${reason}`,
          link: '/student/payments',
          emailTemplate: 'PaymentRejectedEmail',
          emailData: {
            studentName,
            courseTitle,
            reason,
          },
          preferenceKey: 'paymentEmails',
        });
      } catch (notifErr) {
        console.warn('Could not dispatch payment rejection email/notification:', notifErr);
      }
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
    const result = (await teacherRepository.gradeSubmission(teacherId, submissionId, data)) as any;

    if (result && result.student) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'ASSIGNMENT_GRADED',
        title: `Assignment Graded: ${result.assignment?.title || 'Assignment'}`,
        message: `Your assignment "${result.assignment?.title || 'Assignment'}" received a score of ${result.score}%.`,
        link: '/student/assignments',
        emailTemplate: 'AssignmentGradedEmail',
        emailData: {
          studentName: `${result.student.user?.firstName || ''} ${result.student.user?.lastName || ''}`.trim(),
          assignmentTitle: result.assignment?.title || 'Assignment',
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
    const result = (await teacherRepository.createStudentFeedback(teacherId, studentId, title, content, strengths, improvements)) as any;

    if (result && result.student) {
      await notificationService.notifyUser({
        userId: result.student.userId,
        type: 'TEACHER_FEEDBACK',
        title: `Instructor Feedback: ${title}`,
        message: `Your teacher left personalized feedback on your progress: "${content}"`,
        link: '/student/feedback',
        emailTemplate: 'TeacherFeedbackEmail',
        emailData: {
          studentName: `${result.student.user?.firstName || ''} ${result.student.user?.lastName || ''}`.trim(),
          teacherName: `${result.teacher?.user?.firstName || ''} ${result.teacher?.user?.lastName || ''}`.trim(),
          comment: content,
        },
        preferenceKey: 'feedbackEmails',
      });
    }

    return result;
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

  async getLessonDetails(teacherId: string, lessonId: string) {
    const lesson = await teacherRepository.getLessonDetails(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    return lesson;
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

  // Diagnostic Placement Quiz Studio & Performance Analytics
  async getDiagnosticQuestions() {
    return prisma.diagnosticQuestion.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createDiagnosticQuestion(data: any) {
    return prisma.diagnosticQuestion.create({
      data: {
        category: data.category || 'General Assessment',
        skill: data.skill || 'Grammar',
        difficulty: data.difficulty || 'B1',
        prompt: data.prompt,
        audioText: data.audioText || null,
        options: Array.isArray(data.options) ? data.options : [],
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        orderIndex: Number(data.orderIndex) || 1,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateDiagnosticQuestion(id: string, data: any) {
    return prisma.diagnosticQuestion.update({
      where: { id },
      data: {
        ...(data.category !== undefined && { category: data.category }),
        ...(data.skill !== undefined && { skill: data.skill }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.prompt !== undefined && { prompt: data.prompt }),
        ...(data.audioText !== undefined && { audioText: data.audioText }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.orderIndex !== undefined && { orderIndex: Number(data.orderIndex) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteDiagnosticQuestion(id: string) {
    return prisma.diagnosticQuestion.delete({
      where: { id },
    });
  }

  async getDiagnosticAnalytics() {
    const [allAttempts, uniqueIps, totalQuestionsCount] = await Promise.all([
      prisma.diagnosticAttempt.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diagnosticAttempt.groupBy({
        by: ['ipAddress'],
        _count: { id: true },
      }),
      prisma.diagnosticQuestion.count({ where: { isActive: true } }),
    ]);

    const totalAttempts = allAttempts.length;
    const totalUniqueParticipants = uniqueIps.length;

    // Global average percentage
    const totalPercentageSum = allAttempts.reduce((acc, curr) => acc + Number(curr.percentage), 0);
    const globalAverageScore = totalAttempts > 0 ? Number((totalPercentageSum / totalAttempts).toFixed(1)) : 0;

    // Group performance by attempt number (Try 1, Try 2, Try 3, Try 4+)
    const tryBuckets: { [key: number]: { count: number; totalPercent: number; totalScore: number } } = {
      1: { count: 0, totalPercent: 0, totalScore: 0 },
      2: { count: 0, totalPercent: 0, totalScore: 0 },
      3: { count: 0, totalPercent: 0, totalScore: 0 },
      4: { count: 0, totalPercent: 0, totalScore: 0 }, // 4 and above
    };

    allAttempts.forEach((att) => {
      const bucket = att.attemptNumber >= 4 ? 4 : att.attemptNumber;
      if (!tryBuckets[bucket]) {
        tryBuckets[bucket] = { count: 0, totalPercent: 0, totalScore: 0 };
      }
      tryBuckets[bucket].count += 1;
      tryBuckets[bucket].totalPercent += Number(att.percentage);
      tryBuckets[bucket].totalScore += att.score;
    });

    const averageScoreByTry = [
      {
        tryLabel: 'Try #1 (First Attempt)',
        tryNumber: 1,
        attemptsCount: tryBuckets[1].count,
        avgPercentage: tryBuckets[1].count > 0 ? Number((tryBuckets[1].totalPercent / tryBuckets[1].count).toFixed(1)) : 0,
        avgScore: tryBuckets[1].count > 0 ? Number((tryBuckets[1].totalScore / tryBuckets[1].count).toFixed(1)) : 0,
      },
      {
        tryLabel: 'Try #2 (Second Attempt)',
        tryNumber: 2,
        attemptsCount: tryBuckets[2].count,
        avgPercentage: tryBuckets[2].count > 0 ? Number((tryBuckets[2].totalPercent / tryBuckets[2].count).toFixed(1)) : 0,
        avgScore: tryBuckets[2].count > 0 ? Number((tryBuckets[2].totalScore / tryBuckets[2].count).toFixed(1)) : 0,
      },
      {
        tryLabel: 'Try #3 (Third Attempt)',
        tryNumber: 3,
        attemptsCount: tryBuckets[3].count,
        avgPercentage: tryBuckets[3].count > 0 ? Number((tryBuckets[3].totalPercent / tryBuckets[3].count).toFixed(1)) : 0,
        avgScore: tryBuckets[3].count > 0 ? Number((tryBuckets[3].totalScore / tryBuckets[3].count).toFixed(1)) : 0,
      },
      {
        tryLabel: 'Try #4+ (Repeated Attempts)',
        tryNumber: 4,
        attemptsCount: tryBuckets[4].count,
        avgPercentage: tryBuckets[4].count > 0 ? Number((tryBuckets[4].totalPercent / tryBuckets[4].count).toFixed(1)) : 0,
        avgScore: tryBuckets[4].count > 0 ? Number((tryBuckets[4].totalScore / tryBuckets[4].count).toFixed(1)) : 0,
      },
    ];

    // Recommended level breakdown
    const levelCounts: Record<string, number> = {};
    allAttempts.forEach((att) => {
      const lvl = att.recommendedLevel || 'A2';
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    });

    return {
      totalUniqueParticipants,
      totalAttempts,
      globalAverageScore,
      totalQuestionsCount,
      averageScoreByTry,
      levelDistribution: levelCounts,
      recentAttempts: allAttempts.slice(0, 100),
    };
  }
}

export const teacherService = new TeacherService();


