import { prisma } from '../config/database.js';
import { Prisma, CEFRLevel, SkillType, EnrollmentStatus, PaymentStatus } from '@prisma/client';
import {
  SubmitPaymentProofInput,
  SubmitAssignmentInput,
  CompleteLessonInput,
  SubmitQuizInput,
  SubmitPlacementTestInput,
  UpdateStudentProfileInput,
} from '../validators/student.validator.js';
import { AppError } from '../middleware/error.middleware.js';

export class StudentRepository {
  /**
   * Helper to resolve student profile from user ID, creating one if missing.
   */
  async getOrCreateStudentProfile(userId: string) {
    let profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          userId,
          currentLevel: 'A1',
        },
        include: { user: true },
      });
    }

    return profile;
  }

  /**
   * Comprehensive Dashboard Metrics
   */
  async getDashboardData(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);
    const studentId = profile.id;

    const [enrollments, assignments, quizAttempts, attendances, placementAttempts, feedbacks] =
      await Promise.all([
        prisma.enrollment.findMany({
          where: { studentId },
          include: {
            course: {
              include: {
                teacher: { include: { user: true } },
                units: {
                  include: {
                    lessons: true,
                  },
                },
              },
            },
            class: true,
          },
          orderBy: { enrolledAt: 'desc' },
        }),
        prisma.assignmentSubmission.findMany({
          where: { studentId },
          include: {
            assignment: {
              include: {
                lesson: {
                  include: { unit: { include: { course: true } } },
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
        prisma.quizAttempt.findMany({
          where: { studentId },
          include: {
            quiz: {
              include: {
                lesson: {
                  include: { unit: { include: { course: true } } },
                },
              },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 5,
        }),
        prisma.attendance.findMany({
          where: { studentId },
          include: { class: true },
          orderBy: { date: 'desc' },
          take: 5,
        }),
        prisma.placementAttempt.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 1,
        }),
        prisma.teacherFeedback.findMany({
          where: { studentId },
          include: { teacher: { include: { user: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ]);

    // Compute progress
    const activeEnrollments = enrollments.filter(
      (e) => e.status === 'ACTIVE' && (!e.expiresAt || new Date(e.expiresAt) > new Date())
    );

    const lessonProgress = await prisma.progress.findMany({
      where: { studentId },
    });

    const completedLessonCount = lessonProgress.filter((p) => p.isCompleted).length;
    const totalStudyTimeMinutes = Math.round(
      lessonProgress.reduce((acc, curr) => acc + (curr.timeSpentSec || 0), 0) / 60
    );

    return {
      profile: {
        id: profile.id,
        currentLevel: profile.currentLevel,
        targetLevel: profile.targetLevel,
        nativeLanguage: profile.nativeLanguage,
        learningGoals: profile.learningGoals,
        user: profile.user,
      },
      stats: {
        activeCoursesCount: activeEnrollments.length,
        totalEnrolledCount: enrollments.length,
        completedLessonsCount: completedLessonCount,
        studyTimeMinutes: totalStudyTimeMinutes,
        hasTakenPlacementTest: placementAttempts.length > 0,
        latestPlacementScore: placementAttempts[0]?.score || null,
        recommendedLevel: placementAttempts[0]?.recommendedLevel || null,
      },
      activeEnrollments,
      recentAssignments: assignments,
      recentQuizzes: quizAttempts,
      recentAttendances: attendances,
      teacherFeedbacks: feedbacks,
    };
  }

  /**
   * Enrolled & Available Courses
   */
  async getStudentCourses(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const [enrolled, catalog] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: profile.id },
        include: {
          course: {
            include: {
              teacher: { include: { user: true } },
              units: {
                include: {
                  lessons: {
                    select: {
                      id: true,
                      title: true,
                      skill: true,
                      estimatedMinutes: true,
                      orderIndex: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.course.findMany({
        where: { isPublished: true },
        include: {
          teacher: { include: { user: true } },
          _count: { select: { units: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Attach student lesson progress to enrolled courses
    const progressList = await prisma.progress.findMany({
      where: { studentId: profile.id },
    });

    const enrolledWithProgress = enrolled.map((enr) => {
      const allLessonIds = enr.course.units.flatMap((u) => u.lessons.map((l) => l.id));
      const completedCount = allLessonIds.filter((lid) =>
        progressList.some((p) => p.lessonId === lid && p.isCompleted)
      ).length;
      const progressPercentage = allLessonIds.length > 0 ? Math.round((completedCount / allLessonIds.length) * 100) : 0;

      const isExpired = Boolean(enr.expiresAt && new Date(enr.expiresAt) < new Date());

      return {
        ...enr,
        isExpired,
        completedLessonCount: completedCount,
        totalLessonCount: allLessonIds.length,
        progressPercentage,
      };
    });

    return {
      enrolled: enrolledWithProgress,
      catalog,
    };
  }

  /**
   * Request Course Enrollment & Submit Payment Proof
   */
  async submitPaymentProof(userId: string, input: SubmitPaymentProofInput) {
    const profile = await this.getOrCreateStudentProfile(userId);
    const course = await prisma.course.findUnique({
      where: { id: input.courseId },
      include: { teacher: { include: { user: true } } },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find or create enrollment
      let enrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: profile.id,
            courseId: input.courseId,
          },
        },
      });

      if (!enrollment) {
        enrollment = await tx.enrollment.create({
          data: {
            studentId: profile.id,
            courseId: input.courseId,
            status: 'PENDING',
          },
        });
      }

      // Create Payment Record
      const payment = await tx.payment.create({
        data: {
          enrollmentId: enrollment.id,
          studentId: profile.id,
          teacherId: course.teacherId,
          amount: new Prisma.Decimal(input.amount),
          currency: input.currency || course.currency,
          paymentMethod: input.paymentMethod,
          transactionRef: input.transactionRef,
          receiptUrl: input.receiptUrl || null,
          notes: input.notes || null,
          status: 'PENDING',
        },
      });

      // Send in-app notification to teacher
      await tx.notification.create({
        data: {
          userId: course.teacher.userId,
          title: 'New Payment Verification Submitted',
          message: `${profile.user.firstName} ${profile.user.lastName} submitted payment proof for ${course.title} (Ref: ${input.transactionRef}).`,
          type: 'PAYMENT_PENDING',
          link: '/teacher/payments',
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_PROOF_SUBMITTED',
          entity: 'Payment',
          entityId: payment.id,
          metadata: {
            courseId: course.id,
            amount: input.amount,
            ref: input.transactionRef,
          },
        },
      });

      return { payment, enrollment };
    });
  }

  /**
   * Get Student Payment History
   */
  async getStudentPayments(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);
    return prisma.payment.findMany({
      where: { studentId: profile.id },
      include: {
        enrollment: {
          include: {
            course: {
              select: { id: true, title: true, level: true, price: true, currency: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch Course with Lessons & Access Verification
   */
  async getCourseLearningView(userId: string, courseId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: { include: { user: true } },
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                sections: { orderBy: { orderIndex: 'asc' } },
                assignments: true,
                quizzes: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check Enrollment Status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: profile.id,
          courseId,
        },
      },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const isEnrolled = !!enrollment;
    const isAccessActive =
      enrollment?.status === 'ACTIVE' && (!enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date());
    const isExpired = Boolean(enrollment?.expiresAt && new Date(enrollment.expiresAt) < new Date());

    // Fetch student progress for this course
    const progressRecords = await prisma.progress.findMany({
      where: { studentId: profile.id },
    });

    return {
      course,
      enrollment,
      access: {
        isEnrolled,
        isAccessActive,
        isExpired,
        status: enrollment?.status || 'NOT_ENROLLED',
        expiresAt: enrollment?.expiresAt || null,
        latestPayment: enrollment?.payments[0] || null,
      },
      progressRecords,
    };
  }

  /**
   * Complete Lesson & Update Study Time
   */
  async completeLesson(userId: string, lessonId: string, input: CompleteLessonInput) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { include: { course: true } } },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Verify student has active enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: profile.id,
          courseId: lesson.unit.courseId,
        },
      },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE' || (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date())) {
      throw new AppError('Active course enrollment required to complete lessons', 403);
    }

    return prisma.progress.upsert({
      where: {
        studentId_lessonId: {
          studentId: profile.id,
          lessonId,
        },
      },
      create: {
        studentId: profile.id,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSec: input.timeSpentSec || 120,
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        timeSpentSec: { increment: input.timeSpentSec || 120 },
      },
    });
  }

  /**
   * Get Student Assignments
   */
  async getStudentAssignments(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    // Get all enrolled courses
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { studentId: profile.id, status: 'ACTIVE' },
      select: { courseId: true },
    });

    const courseIds = activeEnrollments.map((e) => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          unit: {
            courseId: { in: courseIds },
          },
        },
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: { course: true },
            },
          },
        },
        submissions: {
          where: { studentId: profile.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments;
  }

  /**
   * Submit Assignment Solution
   */
  async submitAssignment(userId: string, assignmentId: string, input: SubmitAssignmentInput) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                course: {
                  include: { teacher: true },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: profile.id,
        },
      },
      create: {
        assignmentId,
        studentId: profile.id,
        content: input.content,
        attachmentUrl: input.attachmentUrl || null,
        status: 'SUBMITTED',
      },
      update: {
        content: input.content,
        attachmentUrl: input.attachmentUrl || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Notify Teacher
    await prisma.notification.create({
      data: {
        userId: assignment.lesson.unit.course.teacher.userId,
        title: 'New Student Assignment Submitted',
        message: `${profile.user.firstName} ${profile.user.lastName} submitted work for "${assignment.title}".`,
        type: 'ASSIGNMENT_SUBMITTED',
        link: `/teacher/assignments`,
      },
    });

    return submission;
  }

  /**
   * Get Quizzes with Student Attempts
   */
  async getStudentQuizzes(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const activeEnrollments = await prisma.enrollment.findMany({
      where: { studentId: profile.id, status: 'ACTIVE' },
      select: { courseId: true },
    });

    const courseIds = activeEnrollments.map((e) => e.courseId);

    const quizzes = await prisma.quiz.findMany({
      where: {
        lesson: {
          unit: {
            courseId: { in: courseIds },
          },
        },
      },
      include: {
        lesson: {
          include: { unit: { include: { course: true } } },
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
            points: true,
            orderIndex: true,
          },
        },
        attempts: {
          where: { studentId: profile.id },
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes;
  }

  /**
   * Submit Quiz Answers & Grade Instantly
   */
  async submitQuiz(userId: string, quizId: string, input: SubmitQuizInput) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    let correctCount = 0;
    const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);
    let earnedPoints = 0;

    const checkAnswerMatch = (expected: string, actual: string) => {
      if (!expected || !actual) return false;
      const expTrim = expected.trim().toLowerCase();
      const actTrim = actual.trim().toLowerCase();
      if (expTrim === actTrim) return true;

      // Matching format: "Left1::Right1|Left2::Right2"
      if (expected.includes('::')) {
        const expPairs = expected.split('|').map((p) => p.trim().toLowerCase()).sort();
        const actPairs = actual.split('|').map((p) => p.trim().toLowerCase()).sort();
        if (expPairs.length === actPairs.length && expPairs.every((p, i) => p === actPairs[i])) {
          return true;
        }
      }

      // Sentence ordering format: remove trailing period/punctuation for flexible checking
      const cleanExp = expTrim.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ');
      const cleanAct = actTrim.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s+/g, ' ');
      if (cleanExp === cleanAct) return true;

      return false;
    };

    const gradedAnswers = input.answers.map((ans) => {
      const question = quiz.questions.find((q) => q.id === ans.questionId);
      const isCorrect = question ? checkAnswerMatch(question.correctAnswer, ans.selectedAnswer) : false;
      if (isCorrect && question) {
        correctCount++;
        earnedPoints += question.points;
      }
      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
        correctAnswer: question?.correctAnswer,
        explanation: question?.explanation,
      };
    });

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= quiz.passingScore;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: profile.id,
        score: new Prisma.Decimal(scorePercentage),
        passed,
        answers: gradedAnswers as any,
        completedAt: new Date(),
      },
    });

    return {
      attempt,
      scorePercentage,
      passed,
      passingScore: quiz.passingScore,
      gradedAnswers,
    };
  }

  /**
   * Student 7-Skill Mastery & Attendance Analytics
   */
  async getStudentProgressAnalytics(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const [submissions, quizAttempts, attendances, lessonProgress] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where: { studentId: profile.id, status: 'GRADED' },
        include: {
          assignment: {
            include: {
              lesson: true,
            },
          },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: profile.id },
      }),
      prisma.attendance.findMany({
        where: { studentId: profile.id },
        include: { class: true },
        orderBy: { date: 'desc' },
      }),
      prisma.progress.findMany({
        where: { studentId: profile.id },
      }),
    ]);

    // Calculate default or derived 7-skill scores
    const skills: Record<string, { total: number; count: number; score: number }> = {
      READING: { total: 82, count: 1, score: 82 },
      LISTENING: { total: 78, count: 1, score: 78 },
      SPEAKING: { total: 74, count: 1, score: 74 },
      WRITING: { total: 85, count: 1, score: 85 },
      GRAMMAR: { total: 90, count: 1, score: 90 },
      VOCABULARY: { total: 88, count: 1, score: 88 },
      PRONUNCIATION: { total: 76, count: 1, score: 76 },
    };

    submissions.forEach((sub) => {
      const skill = sub.assignment.lesson.skill || 'WRITING';
      if (sub.score) {
        const percent = (Number(sub.score) / sub.assignment.maxScore) * 100;
        if (!skills[skill]) skills[skill] = { total: 0, count: 0, score: 0 };
        skills[skill].total += percent;
        skills[skill].count += 1;
        skills[skill].score = Math.round(skills[skill].total / skills[skill].count);
      }
    });

    const totalStudyTimeSec = lessonProgress.reduce((acc, curr) => acc + curr.timeSpentSec, 0);

    return {
      profile,
      skills,
      totalStudyTimeMinutes: Math.round(totalStudyTimeSec / 60),
      completedLessonsCount: lessonProgress.filter((p) => p.isCompleted).length,
      quizzesPassedCount: quizAttempts.filter((q) => q.passed).length,
      attendances,
    };
  }

  /**
   * Placement Test Submission & CEFR Level Determination
   */
  async submitPlacementTest(userId: string, input: SubmitPlacementTestInput) {
    const profile = await this.getOrCreateStudentProfile(userId);

    // Calculate level based on percentage correct
    let test = null;
    if (input.placementTestId) {
      test = await prisma.placementTest.findUnique({
        where: { id: input.placementTestId },
        include: { questions: true },
      });
    }

    let score = 75; // Default score if standalone diagnostic
    let recommendedLevel: CEFRLevel = 'B1';

    if (test && test.questions.length > 0) {
      let correct = 0;
      input.answers.forEach((ans) => {
        const q = test!.questions.find((item) => item.id === ans.questionId);
        if (q && q.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase()) {
          correct++;
        }
      });
      score = Math.round((correct / test.questions.length) * 100);
    } else {
      // Score based on answer count
      const totalAnswers = input.answers.length || 20;
      score = Math.min(100, Math.round((input.answers.length / 20) * 85));
    }

    if (score < 40) recommendedLevel = 'A1';
    else if (score < 60) recommendedLevel = 'A2';
    else if (score < 75) recommendedLevel = 'B1';
    else if (score < 88) recommendedLevel = 'B2';
    else if (score < 96) recommendedLevel = 'C1';
    else recommendedLevel = 'C2';

    // Update Student Profile currentLevel
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { currentLevel: recommendedLevel },
    });

    // If test exists, save PlacementAttempt
    if (test) {
      await prisma.placementAttempt.create({
        data: {
          placementTestId: test.id,
          studentId: profile.id,
          score: new Prisma.Decimal(score),
          recommendedLevel,
          answers: input.answers as any,
        },
      });
    }

    return {
      score,
      recommendedLevel,
      updatedLevel: recommendedLevel,
      message: `Diagnostic evaluated! Your recommended starting level is ${recommendedLevel}.`,
    };
  }

  /**
   * Certificates Center
   */
  async getStudentCertificates(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);
    return prisma.certificate.findMany({
      where: { studentId: profile.id, isRevoked: false },
      include: {
        course: {
          include: { teacher: { include: { user: true } } },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  /**
   * Get Student Profile Details
   */
  async getStudentProfile(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        country: true,
        city: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return {
      user,
      profile,
    };
  }

  /**
   * Update Student Profile
   */
  async updateStudentProfile(userId: string, input: any) {
    const profile = await this.getOrCreateStudentProfile(userId);

    // Update user info if provided
    if (input.firstName || input.lastName || input.phone || input.country || input.city || input.avatarUrl !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          country: input.country,
          city: input.city,
          avatarUrl: input.avatarUrl,
        },
      });
    }

    // Update profile info
    const updatedProfile = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        nativeLanguage: input.nativeLanguage,
        targetLevel: input.targetLevel,
        learningGoals: input.learningGoals,
        preferredSchedule: input.preferredSchedule,
        englishExperience: input.englishExperience,
        bio: input.bio,
      },
      include: { user: true },
    });

    return updatedProfile;
  }

  /**
   * Get Student Full Enrollment History & Lifecycle
   */
  async getStudentEnrollments(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: profile.id },
      include: {
        course: {
          include: {
            teacher: { include: { user: true } },
            units: {
              include: { lessons: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const progressList = await prisma.progress.findMany({
      where: { studentId: profile.id },
    });

    return enrollments.map((enr) => {
      const allLessons = enr.course.units.flatMap((u) => u.lessons);
      const completed = allLessons.filter((l) =>
        progressList.some((p) => p.lessonId === l.id && p.isCompleted)
      ).length;
      const progressPercent = allLessons.length > 0 ? Math.round((completed / allLessons.length) * 100) : 0;
      const isExpired = Boolean(enr.expiresAt && new Date(enr.expiresAt) < new Date());

      // Days remaining before expiration
      let daysRemaining: number | null = null;
      if (enr.expiresAt) {
        const diff = new Date(enr.expiresAt).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      return {
        ...enr,
        progressPercent,
        completedLessonsCount: completed,
        totalLessonsCount: allLessons.length,
        isExpired,
        daysRemaining,
      };
    });
  }

  /**
   * Get Student View-Only Attendance Records
   */
  async getStudentAttendance(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const records = await prisma.attendance.findMany({
      where: { studentId: profile.id },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalSessions = records.length;
    const presentSessions = records.filter((r) => r.status === 'PRESENT').length;
    const lateSessions = records.filter((r) => r.status === 'LATE').length;
    const excusedSessions = records.filter((r) => r.status === 'EXCUSED').length;
    const absentSessions = records.filter((r) => r.status === 'ABSENT').length;

    const overallRate = totalSessions > 0 ? Math.round(((presentSessions + lateSessions * 0.8) / totalSessions) * 100) : 100;

    return {
      records,
      stats: {
        totalSessions,
        presentSessions,
        lateSessions,
        excusedSessions,
        absentSessions,
        overallAttendanceRate: overallRate,
      },
    };
  }

  /**
   * Get Teacher Feedback Received by Student
   */
  async getStudentFeedback(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    return prisma.teacherFeedback.findMany({
      where: { studentId: profile.id },
      include: {
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get Comprehensive Academic Results Transcript
   */
  async getStudentResults(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const [assignmentSubmissions, quizAttempts, placementAttempts] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where: { studentId: profile.id },
        include: {
          assignment: {
            include: {
              lesson: {
                include: {
                  unit: {
                    include: { course: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: profile.id },
        include: {
          quiz: {
            include: {
              lesson: {
                include: {
                  unit: {
                    include: { course: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.placementAttempt.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Compute average scores
    const gradedAssignments = assignmentSubmissions.filter((a) => a.score !== null && a.score !== undefined);
    const avgAssignmentScore =
      gradedAssignments.length > 0
        ? Math.round(
            gradedAssignments.reduce((acc, curr) => acc + (Number(curr.score) / (curr.assignment.maxScore || 100)) * 100, 0) /
              gradedAssignments.length
          )
        : null;

    const avgQuizScore =
      quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((acc, curr) => acc + Number(curr.score), 0) / quizAttempts.length)
        : null;

    return {
      profile,
      summary: {
        avgAssignmentScore,
        avgQuizScore,
        totalQuizzesPassed: quizAttempts.filter((q) => q.passed).length,
        totalAssignmentsGraded: gradedAssignments.length,
        currentCEFRLevel: profile.currentLevel,
      },
      assignments: assignmentSubmissions,
      quizzes: quizAttempts,
      placementTests: placementAttempts,
    };
  }

  /**
   * Student Calendar & Milestone Agenda
   */
  async getStudentCalendar(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    const [activeEnrollments, assignments, quizzes] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: profile.id },
        include: {
          course: {
            include: { teacher: { include: { user: true } } },
          },
          class: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          lesson: {
            unit: {
              course: {
                enrollments: {
                  some: { studentId: profile.id, status: 'ACTIVE' },
                },
              },
            },
          },
        },
        include: {
          lesson: {
            include: { unit: { include: { course: true } } },
          },
        },
      }),
      prisma.quiz.findMany({
        where: {
          lesson: {
            unit: {
              course: {
                enrollments: {
                  some: { studentId: profile.id, status: 'ACTIVE' },
                },
              },
            },
          },
        },
        include: {
          lesson: {
            include: { unit: { include: { course: true } } },
          },
        },
      }),
    ]);

    const events: Array<{
      id: string;
      title: string;
      type: 'CLASS_SESSION' | 'ASSIGNMENT_DEADLINE' | 'QUIZ_DATE' | 'EXPIRATION_ALERT';
      date: string;
      courseTitle: string;
      description?: string;
    }> = [];

    // Expiration alerts
    activeEnrollments.forEach((enr) => {
      if (enr.expiresAt) {
        events.push({
          id: `exp-${enr.id}`,
          title: `Access Expiry: ${enr.course.title}`,
          type: 'EXPIRATION_ALERT',
          date: new Date(enr.expiresAt).toISOString().split('T')[0],
          courseTitle: enr.course.title,
          description: 'Course access expiration date. Remember to renew if eligible.',
        });
      }
    });

    // Assignments due dates
    assignments.forEach((a) => {
      if (a.dueDate) {
        events.push({
          id: `ass-${a.id}`,
          title: `Assignment Due: ${a.title}`,
          type: 'ASSIGNMENT_DEADLINE',
          date: new Date(a.dueDate).toISOString().split('T')[0],
          courseTitle: a.lesson.unit.course.title,
          description: a.description || 'Complete and submit assignment.',
        });
      }
    });

    // Quizzes
    quizzes.forEach((q) => {
      events.push({
        id: `quiz-${q.id}`,
        title: `Quiz Available: ${q.title}`,
        type: 'QUIZ_DATE',
        date: new Date(q.createdAt).toISOString().split('T')[0],
        courseTitle: q.lesson.unit.course.title,
        description: `Passing score: ${q.passingScore}%`,
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Renew Expired Course
   */
  async renewCourse(userId: string, input: any) {
    return this.submitPaymentProof(userId, {
      courseId: input.courseId,
      amount: input.amount,
      currency: input.currency || 'USD',
      paymentMethod: input.paymentMethod || 'MOBILE_MONEY',
      transactionRef: input.transactionRef,
      receiptUrl: input.receiptUrl,
      notes: input.notes || 'Course Renewal Request',
    });
  }

  /**
   * Complete Student Profile with User Details
   */
  async getStudentProfile(userId: string) {
    const profile = await this.getOrCreateStudentProfile(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        timezone: true,
        preferredLanguage: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    return {
      user: user!,
      profile,
    };
  }

  /**
   * Update Student Profile and User Details
   */
  async updateStudentProfile(userId: string, input: any) {
    const { firstName, lastName, phone, country, city, timezone, preferredLanguage, avatarUrl, ...profileData } = input;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(timezone !== undefined && { timezone }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    const updatedProfile = await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(profileData.nativeLanguage !== undefined && { nativeLanguage: profileData.nativeLanguage }),
        ...(profileData.currentLevel && { currentLevel: profileData.currentLevel }),
        ...(profileData.targetLevel !== undefined && { targetLevel: profileData.targetLevel }),
        ...(profileData.learningGoals && { learningGoals: profileData.learningGoals }),
        ...(profileData.preferredSchedule !== undefined && { preferredSchedule: profileData.preferredSchedule }),
        ...(profileData.targetSkills && { targetSkills: profileData.targetSkills }),
        ...(profileData.learningPreferences && { learningPreferences: profileData.learningPreferences }),
        ...(profileData.profileVisibility && { profileVisibility: profileData.profileVisibility }),
        ...(profileData.bio !== undefined && { bio: profileData.bio }),
      },
    });

    return this.getStudentProfile(userId);
  }

  /**
   * Submit Account Deletion Request
   */
  async requestAccountDeletion(userId: string, reason: string) {
    const profile = await this.getOrCreateStudentProfile(userId);

    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        accountDeletionRequested: true,
        deletionRequestedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETION_REQUESTED',
        entity: 'StudentProfile',
        entityId: profile.id,
        metadata: { reason },
      },
    });

    return { success: true, message: 'Account deletion request received and logged.' };
  }
}

export const studentRepository = new StudentRepository();

