import { prisma } from '../config/database.js';
import {
  Role,
  UserStatus,
  PaymentStatus,
  EnrollmentStatus,
  SubmissionStatus,
  AttendanceStatus,
  CEFRLevel,
  SkillType,
  Prisma,
} from '@prisma/client';

const SubscriptionStatus = {
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;
type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateUnitInput,
  CreateLessonInput,
  CreateClassInput,
  CreateAssignmentInput,
  GradeSubmissionInput,
  MarkAttendanceInput,
  PaymentFilterInput,
  StudentFilterInput,
  AssignmentFilterInput,
  AttendanceFilterInput,
} from '../validators/teacher.validator.js';
import { AppError } from '../middleware/error.middleware.js';
import { emailService } from '../services/email.service.js';

export class TeacherRepository {
  async getOrCreateTeacherProfile(userId: string) {
    let profile = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      profile = await prisma.teacherProfile.create({
        data: {
          userId,
          headline: 'Certified English Instructor',
          isApproved: true,
        },
        include: { user: true },
      });
    }
    return profile;
  }

  async getDashboardCounts(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const teacherId = profile.id;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      totalCourses,
      totalClasses,
      pendingPaymentsCount,
      pendingSubmissionsCount,
      activeEnrollments,
      expiringEnrollments,
    ] = await Promise.all([
      prisma.course.count({ where: { teacherId } }),
      prisma.class.count({ where: { teacherId } }),
      prisma.payment.count({ where: { teacherId, status: PaymentStatus.PENDING } }),
      prisma.assignmentSubmission.count({
        where: {
          status: SubmissionStatus.SUBMITTED,
          assignment: { lesson: { unit: { course: { teacherId } } } },
        },
      }),
      prisma.enrollment.findMany({
        where: {
          course: { teacherId },
          status: EnrollmentStatus.ACTIVE,
        },
        distinct: ['studentId'],
      }),
      prisma.enrollment.count({
        where: {
          course: { teacherId },
          status: EnrollmentStatus.ACTIVE,
          expiresAt: {
            gte: new Date(),
            lte: sevenDaysFromNow,
          },
        },
      }),
    ]);

    return {
      totalCourses,
      totalClasses,
      totalStudents: activeEnrollments.length,
      pendingPaymentsCount,
      pendingSubmissionsCount,
      expiringStudentsCount: expiringEnrollments,
    };
  }

  async getRecentPayments(userId: string, limit = 5) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const payments = await prisma.payment.findMany({
      where: { teacherId: profile.id, status: PaymentStatus.PENDING },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        enrollment: {
          include: { course: { select: { title: true, level: true } } },
        },
      },
    });

    return payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.transactionRef || 'N/A',
      proofUrl: p.receiptUrl || undefined,
      notes: p.notes || undefined,
      createdAt: p.createdAt.toISOString(),
      user: {
        firstName: p.student.user.firstName,
        lastName: p.student.user.lastName,
        email: p.student.user.email,
      },
      course: p.enrollment?.course ? {
        title: p.enrollment.course.title,
        level: p.enrollment.course.level,
      } : undefined,
    }));
  }

  async getRecentSubmissions(userId: string, limit = 5) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        status: SubmissionStatus.SUBMITTED,
        assignment: { lesson: { unit: { course: { teacherId: profile.id } } } },
      },
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        assignment: {
          select: { title: true, maxScore: true },
        },
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
      assignment: {
        title: s.assignment.title,
        maxScore: s.assignment.maxScore,
      },
      student: {
        firstName: s.student.user.firstName,
        lastName: s.student.user.lastName,
      },
    }));
  }

  async getUpcomingClasses(userId: string, limit = 5) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classes = await prisma.class.findMany({
      where: { teacherId: profile.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.description || 'Mon, Wed, Fri at 6:00 PM GMT',
      _count: {
        enrollments: c._count.enrollments,
      },
    }));
  }

  // ----------------------------------------------------
  // COURSE MANAGEMENT
  // ----------------------------------------------------

  async getCoursesByTeacher(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.course.findMany({
      where: { teacherId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                sections: true,
                assignments: true,
                quizzes: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true, classes: true } },
      },
    });
  }

  async getCourseDetails(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: { sections: true, assignments: true, quizzes: true },
            },
          },
        },
        _count: { select: { enrollments: true, classes: true } },
      },
    });
  }

  async createCourse(userId: string, data: CreateCourseInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    return prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        summary: data.summary,
        level: data.level as CEFRLevel,
        category: data.category || 'General English',
        currency: data.currency || 'USD',
        durationDays: data.durationDays || 90,
        thumbnailUrl: data.thumbnailUrl,
        isPublished: (data as any).published ?? data.isPublished ?? true,
        teacherId: profile.id,
      },
    });
  }

  async updateCourse(courseId: string, data: UpdateCourseInput) {
    return prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.summary && { summary: data.summary }),
        ...(data.level && { level: data.level as CEFRLevel }),
        ...(data.currency && { currency: data.currency }),
        ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });
  }

  async deleteCourse(courseId: string) {
    return prisma.course.delete({ where: { id: courseId } });
  }

  // ----------------------------------------------------
  // UNITS & LESSONS
  // ----------------------------------------------------

  async createUnit(courseId: string, data: CreateUnitInput) {
    return prisma.unit.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        orderIndex: (data as any).order ?? data.orderIndex ?? 1,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async createLesson(unitId: string, data: CreateLessonInput) {
    const rawSkills = (data as any).skills;
    const resolvedSkills: SkillType[] =
      Array.isArray(rawSkills) && rawSkills.length > 0
        ? (rawSkills as SkillType[])
        : [((data as any).skillType || data.skill || 'GRAMMAR') as SkillType];

    const lessonData: any = {
      unitId,
      title: data.title,
      description: data.description,
      skill: resolvedSkills[0],
      skills: resolvedSkills,
      orderIndex: (data as any).order ?? data.orderIndex ?? 1,
      estimatedMinutes: (data as any).durationMinutes ?? data.estimatedMinutes ?? 30,
      isPublished: data.isPublished ?? true,
    };

    return prisma.lesson.create({
      data: {
        ...lessonData,
        sections: {
          create: data.sections && data.sections.length > 0
            ? data.sections.map((s, idx) => ({
                title: s.title,
                contentType: s.contentType || 'MARKDOWN',
                content: s.content,
                mediaUrl: s.mediaUrl || null,
                orderIndex: s.orderIndex ?? idx + 1,
              }))
            : [
                ...((data as any).content ? [{
                  title: 'Lesson Text & Grammar Rules',
                  contentType: 'MARKDOWN',
                  content: (data as any).content,
                  orderIndex: 1,
                }] : []),
                ...((data as any).videoUrl ? [{
                  title: 'Video Lecture Stream',
                  contentType: 'VIDEO',
                  content: 'Watch the video overview and practice following the speaker.',
                  mediaUrl: (data as any).videoUrl,
                  orderIndex: 2,
                }] : []),
                ...((data as any).audioUrl ? [{
                  title: 'Audio Listening Practice',
                  contentType: 'AUDIO',
                  content: 'Listen attentively to native pronunciation and repeat key phrases.',
                  mediaUrl: (data as any).audioUrl,
                  orderIndex: 3,
                }] : []),
              ],
        },
      },
      include: { sections: true },
    });
  }

  // ----------------------------------------------------
  // CLASSES & COHORT INVITATIONS
  // ----------------------------------------------------

  async getClassesByTeacher(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.class.findMany({
      where: { teacherId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, level: true } },
        courses: {
          include: {
            course: { select: { id: true, title: true, level: true, durationDays: true } },
          },
        },
        enrollments: {
          include: {
            student: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
          },
        },
        _count: { select: { enrollments: true, attendances: true } },
      } as any,
    });
  }

  async getClassDetails(classId: string) {
    return prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: { select: { id: true, title: true, level: true } },
        courses: {
          include: {
            course: { select: { id: true, title: true, level: true, durationDays: true } },
          },
        },
        enrollments: {
          include: {
            student: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
          },
        },
        _count: { select: { enrollments: true, attendances: true } },
      } as any,
    });
  }

  private async generateUniqueClassCode(): Promise<string> {
    const yy = new Date().getFullYear().toString().slice(-2);
    for (let i = 0; i < 30; i++) {
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const code = `NS${yy}${randomNum}`;
      const existing = await prisma.class.findUnique({ where: { code } });
      if (!existing) {
        return code;
      }
    }
    const fallbackNum = Math.floor(1000 + Math.random() * 9000).toString();
    return `NS${yy}${fallbackNum}`;
  }

  async getAvailableStudents(userId: string) {
    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentProfile: {
          select: {
            id: true,
            currentLevel: true,
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
          },
        },
      } as any,
    });

    return (students as any[]).map((s) => ({
      id: s.id,
      studentProfileId: s.studentProfile?.id || s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      currentLevel: s.studentProfile?.currentLevel || 'PRE_A1',
      subscriptionStatus: s.studentProfile?.subscriptionStatus || 'INACTIVE',
      subscriptionExpiresAt: s.studentProfile?.subscriptionExpiresAt ? new Date(s.studentProfile.subscriptionExpiresAt).toISOString() : null,
    }));
  }

  async createClass(userId: string, data: CreateClassInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const code = await this.generateUniqueClassCode();

    const courseIds: string[] = (data as any).courseIds && Array.isArray((data as any).courseIds) && (data as any).courseIds.length > 0
      ? (data as any).courseIds
      : data.courseId ? [data.courseId] : [];

    const primaryCourseId = courseIds[0] || data.courseId || undefined;

    const newClass = await prisma.class.create({
      data: {
        teacherId: profile.id,
        courseId: primaryCourseId,
        name: data.name,
        code,
        description: (data as any).schedule || data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxStudents: (data as any).capacity || data.maxStudents || 30,
        ...(courseIds.length > 0 && {
          courses: {
            create: courseIds.map((cid: string) => ({
              courseId: cid,
            })),
          },
        }),
      } as any,
      include: {
        course: true,
        courses: { include: { course: true } },
      } as any,
    });

    // If studentIds were selected during creation, enroll them automatically
    const studentIds: string[] = (data as any).studentIds && Array.isArray((data as any).studentIds)
      ? (data as any).studentIds
      : [];

    if (studentIds.length > 0) {
      for (const sId of studentIds) {
        try {
          await this.enrollStudentInClass(userId, newClass.id, { studentId: sId });
        } catch (err) {
          console.warn(`Failed to auto-enroll student ${sId} into new cohort:`, err);
        }
      }
    }

    return this.getClassDetails(newClass.id);
  }

  async updateCohortCourses(userId: string, classId: string, courseIds: string[]) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classItem = await prisma.class.findFirst({
      where: { id: classId, teacherId: profile.id },
    });
    if (!classItem) throw new AppError('Cohort not found or access denied', 404);

    // Replace all linked courses in a transaction
    await prisma.$transaction([
      // Remove all existing ClassCourse links for this cohort
      (prisma as any).classCourse.deleteMany({ where: { classId } }),
      // Re-create with new set
      ...(courseIds.length > 0
        ? courseIds.map((cid) =>
            (prisma as any).classCourse.create({ data: { classId, courseId: cid } })
          )
        : []),
      // Also update the primary courseId on the class row
      prisma.class.update({
        where: { id: classId },
        data: { courseId: courseIds[0] || null } as any,
      }),
    ]);

    return this.getClassDetails(classId);
  }

  async updateClass(userId: string, classId: string, data: any) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classItem = await prisma.class.findFirst({
      where: { id: classId, teacherId: profile.id },
    });
    if (!classItem) throw new AppError('Cohort not found or access denied', 404);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.code !== undefined) updateData.code = data.code.trim();
    if (data.schedule !== undefined || data.description !== undefined) {
      updateData.description = data.schedule || data.description;
    }
    if (data.capacity !== undefined || data.maxStudents !== undefined) {
      updateData.maxStudents = Number(data.capacity) || Number(data.maxStudents) || 30;
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.meetingLink !== undefined) {
      updateData.meetingLink = data.meetingLink;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    const courseIds: string[] | undefined = Array.isArray(data.courseIds)
      ? data.courseIds
      : data.courseId
      ? [data.courseId]
      : undefined;

    if (courseIds !== undefined) {
      updateData.courseId = courseIds[0] || null;
    }

    await prisma.class.update({
      where: { id: classId },
      data: updateData as any,
    });

    if (courseIds !== undefined) {
      await prisma.$transaction([
        (prisma as any).classCourse.deleteMany({ where: { classId } }),
        ...(courseIds.length > 0
          ? courseIds.map((cid: string) =>
              (prisma as any).classCourse.create({ data: { classId, courseId: cid } })
            )
          : []),
      ]);
    }

    return this.getClassDetails(classId);
  }

  async deleteClass(userId: string, classId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classItem = await prisma.class.findFirst({
      where: { id: classId, teacherId: profile.id },
    });
    if (!classItem) throw new AppError('Cohort not found or access denied', 404);

    // Detach enrollments from this cohort
    await prisma.enrollment.updateMany({
      where: { classId },
      data: { classId: null },
    });

    // Delete the cohort (ClassCourse & Attendance cascade delete)
    await prisma.class.delete({
      where: { id: classId },
    });

    return { success: true, message: `Cohort "${classItem.name}" deleted successfully` };
  }

  async removeStudentFromClass(userId: string, classId: string, studentId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classItem = await prisma.class.findFirst({
      where: { id: classId, teacherId: profile.id },
    });
    if (!classItem) throw new AppError('Cohort not found or access denied', 404);

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });
    if (!studentProfile) throw new AppError('Student not found', 404);

    const updated = await prisma.enrollment.updateMany({
      where: { classId, studentId: studentProfile.id },
      data: { classId: null },
    });

    return {
      success: true,
      message: 'Student removed from cohort successfully',
      count: updated.count,
    };
  }

  async enrollStudentInClass(userId: string, classId: string, data: { studentEmail?: string; studentId?: string; studentIds?: string[]; courseIds?: string[] }) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: true,
        courses: { include: { course: true } },
      } as any,
    });

    if (!classItem) {
      throw new AppError('Class cohort not found', 404);
    }

    // Determine target students
    const targetStudentIds: string[] = [];
    if (data.studentIds && Array.isArray(data.studentIds) && data.studentIds.length > 0) {
      targetStudentIds.push(...data.studentIds);
    } else if (data.studentId) {
      targetStudentIds.push(data.studentId);
    } else if (data.studentEmail) {
      const email = data.studentEmail.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
        include: { studentProfile: true } as any,
      });
      if (!user) {
        throw new AppError(`No registered student account found with email: ${data.studentEmail}`, 404);
      }
      let studentProfile = (user as any).studentProfile;
      if (!studentProfile) {
        studentProfile = await prisma.studentProfile.create({
          data: { userId: user.id },
        });
      }
      targetStudentIds.push(studentProfile.id);
    }

    if (targetStudentIds.length === 0) {
      throw new AppError('Please select at least one student to enroll', 400);
    }

    // Determine target courses for this cohort
    const coursesToEnroll: Array<{ id: string; title: string; durationDays?: number }> = [];
    const classItemAny = classItem as any;
    if (classItemAny.courses && classItemAny.courses.length > 0) {
      coursesToEnroll.push(...classItemAny.courses.map((cc: any) => cc.course));
    } else if (classItemAny.course) {
      coursesToEnroll.push(classItemAny.course);
    }

    const durationDays = 90;
    const activatedAt = new Date();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const enrollments = [];

    for (const sid of targetStudentIds) {
      let studentProfile = await prisma.studentProfile.findFirst({
        where: {
          OR: [{ id: sid }, { userId: sid }],
        },
        include: { user: true },
      });

      if (!studentProfile) {
        const user = await prisma.user.findUnique({
          where: { id: sid },
          include: { studentProfile: true } as any,
        });
        if (user) {
          const userAny = user as any;
          if (userAny.studentProfile) {
            studentProfile = await prisma.studentProfile.findUnique({
              where: { id: userAny.studentProfile.id },
              include: { user: true },
            });
          } else {
            studentProfile = await prisma.studentProfile.create({
              data: { userId: user.id },
              include: { user: true },
            });
          }
        }
      }

      if (!studentProfile) continue;

      // Update student subscription to ACTIVE
      await prisma.studentProfile.update({
        where: { id: studentProfile.id },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: `Cohort Access: ${classItem.name}`,
          subscriptionMonths: 3,
          subscriptionStartedAt: (studentProfile as any).subscriptionStartedAt || activatedAt,
          subscriptionExpiresAt: expiresAt,
        } as any,
      });

      // Enroll in all cohort courses
      if (coursesToEnroll.length > 0) {
        for (const course of coursesToEnroll) {
          const enr = await prisma.enrollment.upsert({
            where: {
              studentId_courseId: {
                studentId: studentProfile.id,
                courseId: course.id,
              },
            },
            create: {
              studentId: studentProfile.id,
              courseId: course.id,
              classId: classItem.id,
              status: 'ACTIVE',
              enrolledAt: new Date(),
              activatedAt,
              expiresAt,
            },
            update: {
              classId: classItem.id,
              status: 'ACTIVE',
              activatedAt,
              expiresAt,
            },
          });
          enrollments.push(enr);
        }
      } else if (classItem.courseId) {
        const enr = await prisma.enrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: studentProfile.id,
              courseId: classItem.courseId,
            },
          },
          create: {
            studentId: studentProfile.id,
            courseId: classItem.courseId,
            classId: classItem.id,
            status: 'ACTIVE',
            enrolledAt: new Date(),
            activatedAt,
            expiresAt,
          },
          update: {
            classId: classItem.id,
            status: 'ACTIVE',
            activatedAt,
            expiresAt,
          },
        });
        enrollments.push(enr);
      }

      // Create verified direct payment record
      await prisma.payment.create({
        data: {
          studentId: studentProfile.id,
          teacherId: profile.id,
          amount: 0,
          currency: 'USD',
          status: PaymentStatus.VERIFIED,
          paymentMethod: 'DIRECT_ENROLLMENT',
          planName: `Cohort: ${classItem.name}`,
          planMonths: 3,
          notes: `Enrolled directly by instructor into cohort: ${classItem.name}`,
          verifiedAt: activatedAt,
        } as any,
      });

      // Notify student (in-app + email)
      if (studentProfile.userId) {
        try {
          await prisma.notification.create({
            data: {
              userId: studentProfile.userId,
              title: `Enrolled in Cohort: ${classItem.name} 🎓`,
              message: `You have been added to ${classItem.name}. All courses, lessons, and live sessions are unlocked!`,
              type: 'ENROLLMENT_CONFIRMED',
              link: '/student/courses',
            },
          });
        } catch (err) {
          console.warn('Failed to send enrollment notification:', err);
        }

        // Send enrollment email (fire-and-forget — never blocks enrollment)
        try {
          const studentUser = (studentProfile as any).user;
          const teacherUser = profile.user;
          const studentEmail = studentUser?.email;
          const studentFullName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Student';
          const teacherFullName = teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : 'Your Teacher';
          const cohortCourses = coursesToEnroll.map((c) => c.title);
          const startDateStr = classItem.startDate
            ? classItem.startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : '';
          const endDateStr = classItem.endDate
            ? classItem.endDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : '';

          if (studentEmail) {
            emailService.sendCohortEnrollmentEmail({
              to: studentEmail,
              studentName: studentFullName,
              cohortName: classItem.name,
              teacherName: teacherFullName,
              schedule: classItem.description || '',
              startDate: startDateStr,
              endDate: endDateStr,
              courses: cohortCourses,
              userId: studentProfile.userId,
            }).catch(err => console.warn('[EMAIL] Cohort enrollment email failed (non-blocking):', err));
          }
        } catch (err) {
          console.warn('[EMAIL] Failed to prepare enrollment email:', err);
        }
      }
    }

    return {
      success: true,
      enrolledCount: targetStudentIds.length,
      enrollments,
    };
  }

  // ----------------------------------------------------
  // PAYMENTS & VERIFICATION QUEUE
  // ----------------------------------------------------

  async getPayments(userId: string, filters: PaymentFilterInput) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const profile = user?.teacherProfile || (await this.getOrCreateTeacherProfile(userId));

    const where: Prisma.PaymentWhereInput = {
      ...(isSuperAdmin ? {} : { teacherId: profile.id }),
      ...(filters.status && (filters.status as any) !== 'ALL' && { status: filters.status as PaymentStatus }),
    };

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        enrollment: {
          include: {
            course: { select: { id: true, title: true, level: true, durationDays: true } },
          },
        },
      },
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      status: p.status,
      referenceNumber: p.transactionRef || 'N/A',
      proofUrl: p.receiptUrl || undefined,
      notes: p.notes || undefined,
      createdAt: p.createdAt.toISOString(),
      user: {
        id: p.student?.user?.id || p.studentId,
        firstName: p.student?.user?.firstName || 'Student',
        lastName: p.student?.user?.lastName || '',
        email: p.student?.user?.email || '',
      },
      course: p.enrollment?.course ? {
        id: p.enrollment.course.id,
        title: p.enrollment.course.title,
        level: p.enrollment.course.level,
      } : undefined,
    }));

    return { payments: formatted };
  }

  async approvePayment(paymentId: string, userId: string, notes?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const profile = user?.teacherProfile || (await this.getOrCreateTeacherProfile(userId));

    const payment = await prisma.payment.findFirst({
      where: isSuperAdmin ? { id: paymentId } : { id: paymentId, teacherId: profile.id },
      include: {
        enrollment: { include: { course: true } },
        student: { include: { user: true } },
      },
    });

    if (!payment) {
      throw new AppError('Payment record not found or unauthorized', 404);
    }

    const activatedAt = new Date();
    const paymentAny = payment as any;
    const studentAny = payment.student as any;
    const planMonths = paymentAny.planMonths || 1;
    const durationDays = planMonths * 30;

    let baseDate = activatedAt;
    if (studentAny?.subscriptionExpiresAt && studentAny.subscriptionExpiresAt > activatedAt) {
      baseDate = new Date(studentAny.subscriptionExpiresAt);
    }
    const expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.VERIFIED,
        verifiedAt: activatedAt,
        notes: notes || payment.notes,
      },
    });

    if (payment.studentId) {
      await prisma.studentProfile.update({
        where: { id: payment.studentId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionPlan: paymentAny.planName || `${planMonths} Month Access`,
          subscriptionMonths: planMonths,
          subscriptionStartedAt: studentAny?.subscriptionStartedAt || activatedAt,
          subscriptionExpiresAt: expiresAt,
        } as any,
      });
    }

    let updatedEnrollment = null;
    if (payment.enrollmentId) {
      try {
        updatedEnrollment = await prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: {
            status: EnrollmentStatus.ACTIVE,
            activatedAt,
            expiresAt,
          },
        });
      } catch (enrollErr) {
        console.error('Failed to update enrollment status:', enrollErr);
      }
    }

    const planTitle = paymentAny.planName || `${planMonths} Month Platform Access`;

    if (payment.student?.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: payment.student.userId,
            title: 'Learning Subscription Activated! 🎓',
            message: `Your payment for "${planTitle}" was verified by your instructor. Platform access is unlocked until ${expiresAt.toLocaleDateString()}.`,
            type: 'PAYMENT_VERIFIED',
            link: '/student/courses',
          },
        });
      } catch (notifErr) {
        console.warn('Failed to create notification:', notifErr);
      }
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'TEACHER_APPROVED_PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          metadata: { enrollmentId: payment.enrollmentId, amount: Number(payment.amount) },
        },
      });
    } catch (auditErr) {
      console.warn('Failed to create audit log:', auditErr);
    }

    return {
      payment: updatedPayment,
      enrollment: updatedEnrollment || payment.enrollment,
      student: payment.student,
      course: payment.enrollment?.course,
    };
  }

  async rejectPayment(paymentId: string, userId: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const profile = user?.teacherProfile || (await this.getOrCreateTeacherProfile(userId));

    const payment = await prisma.payment.findFirst({
      where: isSuperAdmin ? { id: paymentId } : { id: paymentId, teacherId: profile.id },
      include: { student: { include: { user: true } }, enrollment: { include: { course: true } } },
    });

    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REJECTED,
        notes: reason,
      },
    });

    const courseTitle = payment.enrollment?.course?.title || 'Course';

    if (payment.student?.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: payment.student.userId,
            title: 'Payment Verification Update',
            message: `Your payment submission for "${courseTitle}" was rejected: ${reason}`,
            type: 'PAYMENT_REJECTED',
            link: `/student/payments`,
          },
        });
      } catch (notifErr) {
        console.warn('Failed to create notification:', notifErr);
      }
    }

    return {
      payment: updated,
      enrollment: payment.enrollment,
      student: payment.student,
      course: payment.enrollment?.course,
    };
  }

  // ----------------------------------------------------
  // ASSIGNMENTS & GRADING
  // ----------------------------------------------------

  async getAssignments(userId: string, filters: AssignmentFilterInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: { unit: { course: { teacherId: profile.id } } },
        ...(filters.courseId && { lesson: { unit: { courseId: filters.courseId } } }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: {
          include: { unit: { include: { course: { select: { id: true, title: true, level: true } } } } },
        },
        _count: { select: { submissions: true } },
      },
    });

    const formatted = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      maxScore: a.maxScore,
      dueDate: a.dueDate?.toISOString() || new Date().toISOString(),
      skillType: a.lesson.skill,
      course: {
        id: a.lesson.unit.course.id,
        title: a.lesson.unit.course.title,
        level: a.lesson.unit.course.level,
      },
      _count: {
        submissions: a._count.submissions,
      },
    }));

    return { assignments: formatted };
  }

  async createAssignment(userId: string, data: CreateAssignmentInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    // Find first lesson of course if courseId provided
    let targetLessonId = data.lessonId;
    if (!targetLessonId && (data as any).courseId) {
      const course = await prisma.course.findUnique({
        where: { id: (data as any).courseId },
        include: { units: { include: { lessons: true } } },
      });
      targetLessonId = course?.units?.[0]?.lessons?.[0]?.id || '';
    }

    if (!targetLessonId) {
      throw new AppError('Course must have at least one lesson to attach an assignment', 400);
    }

    return prisma.assignment.create({
      data: {
        lessonId: targetLessonId,
        title: data.title,
        description: data.description,
        maxScore: data.maxScore || 100,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        isPublished: true,
      },
    });
  }

  async getSubmissions(userId: string, assignmentId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
        assignment: { lesson: { unit: { course: { teacherId: profile.id } } } },
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      content: s.content,
      fileUrl: s.attachmentUrl || undefined,
      score: s.score ? Number(s.score) : undefined,
      feedback: s.feedback || undefined,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      student: {
        id: s.student.user.id,
        firstName: s.student.user.firstName,
        lastName: s.student.user.lastName,
        email: s.student.user.email,
      },
    }));
  }

  async gradeSubmission(userId: string, submissionId: string, data: GradeSubmissionInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const submission = await tx.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          student: { include: { user: true } },
          assignment: { include: { lesson: { include: { unit: { include: { course: true } } } } } },
        },
      });

      if (!submission || submission.assignment.lesson.unit.course.teacherId !== profile.id) {
        throw new AppError('Submission not found or unauthorized', 404);
      }

      const updated = await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          score: new Prisma.Decimal(data.score),
          feedback: data.feedback,
          status: SubmissionStatus.GRADED,
          gradedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: submission.student.userId,
          title: `Assignment Graded: ${submission.assignment.title}`,
          message: `Your instructor evaluated your work: ${data.score}/${submission.assignment.maxScore}.`,
          type: 'ASSIGNMENT_GRADED',
          link: `/student/assignments`,
        },
      });

      return updated;
    });
  }

  // ----------------------------------------------------
  // ATTENDANCE
  // ----------------------------------------------------

  async getAttendance(userId: string, filters: AttendanceFilterInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const date = filters.date ? new Date(filters.date) : new Date();

    return prisma.attendance.findMany({
      where: {
        classId: filters.classId,
        date,
        class: { teacherId: profile.id },
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async markAttendance(userId: string, data: MarkAttendanceInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const sessionDate = new Date(data.date);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const cls = await tx.class.findFirst({
        where: { id: data.classId, teacherId: profile.id },
      });

      if (!cls) {
        throw new AppError('Class cohort not found or unauthorized', 404);
      }

      const results = [];
      for (const record of data.records) {
        // Resolve studentProfile
        let studentProfile = await tx.studentProfile.findFirst({
          where: {
            OR: [
              { id: record.studentId },
              { userId: record.studentId },
            ],
          },
        });

        if (!studentProfile) {
          studentProfile = await tx.studentProfile.create({
            data: { userId: record.studentId, currentLevel: 'A1' },
          });
        }

        const entry = await tx.attendance.upsert({
          where: {
            classId_studentId_date: {
              classId: data.classId,
              studentId: studentProfile.id,
              date: sessionDate,
            },
          },
          update: {
            status: record.status as AttendanceStatus,
            note: (record as any).remarks || record.note,
          },
          create: {
            classId: data.classId,
            studentId: studentProfile.id,
            date: sessionDate,
            status: record.status as AttendanceStatus,
            note: (record as any).remarks || record.note,
          },
        });
        results.push(entry);
      }
      return results;
    });
  }

  // ----------------------------------------------------
  // STUDENTS & DIAGNOSTIC PROGRESS
  // ----------------------------------------------------

  async getEnrolledStudents(userId: string, filters: StudentFilterInput) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const where: Prisma.EnrollmentWhereInput = {
      course: { teacherId: profile.id },
      ...(filters.courseId && { courseId: filters.courseId }),
      ...(filters.classId && { classId: filters.classId }),
      ...((filters as any).status && (filters as any).status !== 'ALL' && { status: (filters as any).status as EnrollmentStatus }),
      ...(filters.search && {
        student: {
          user: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      }),
    };

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        course: { select: { id: true, title: true, level: true } },
        class: { select: { id: true, name: true } },
      },
    });

    const formatted = enrollments.map((enr) => ({
      id: enr.id,
      userId: enr.student.user.id,
      courseId: enr.courseId,
      classId: enr.classId || undefined,
      status: enr.status,
      enrolledAt: enr.enrolledAt.toISOString(),
      expiresAt: enr.expiresAt?.toISOString() || undefined,
      user: {
        id: enr.student.user.id,
        firstName: enr.student.user.firstName,
        lastName: enr.student.user.lastName,
        email: enr.student.user.email,
        studentProfile: {
          currentLevel: enr.student.currentLevel,
          targetLevel: enr.student.targetLevel || 'B2 Fluent',
        },
      },
      course: {
        id: enr.course.id,
        title: enr.course.title,
        level: enr.course.level,
      },
      class: enr.class ? {
        id: enr.class.id,
        name: enr.class.name,
      } : undefined,
    }));

    return { students: formatted };
  }

  async getStudentDetailedProgress(userId: string, studentUserId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { userId: studentUserId },
          { id: studentUserId },
        ],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollments: {
          where: { course: { teacherId: profile.id } },
          include: {
            course: {
              include: {
                units: {
                  include: { lessons: true },
                },
              },
            },
          },
        },
        submissions: {
          where: { assignment: { lesson: { unit: { course: { teacherId: profile.id } } } } },
          include: { assignment: { select: { title: true, maxScore: true, lesson: true } } },
        },
        quizAttempts: {
          where: { quiz: { lesson: { unit: { course: { teacherId: profile.id } } } } },
          include: { quiz: { select: { title: true, passingScore: true } } },
        },
        progress: {
          include: { lesson: true },
        },
      },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    return {
      id: studentProfile.user.id,
      firstName: studentProfile.user.firstName,
      lastName: studentProfile.user.lastName,
      email: studentProfile.user.email,
      studentProfile: {
        currentLevel: studentProfile.currentLevel,
        targetLevel: studentProfile.targetLevel,
      },
      enrollments: studentProfile.enrollments,
      lessonProgress: studentProfile.progress.map((lp) => ({
        id: lp.id,
        completed: lp.isCompleted,
        timeSpentSeconds: lp.timeSpentSec,
        lesson: {
          title: lp.lesson.title,
          skillType: lp.lesson.skill,
        },
      })),
      quizAttempts: studentProfile.quizAttempts.map((qa) => ({
        id: qa.id,
        score: Number(qa.score),
        passed: qa.passed,
        completedAt: qa.completedAt?.toISOString() || qa.startedAt.toISOString(),
        quiz: {
          title: qa.quiz.title,
          passingScore: qa.quiz.passingScore,
        },
      })),
      assignmentSubmissions: studentProfile.submissions.map((sub) => ({
        id: sub.id,
        score: sub.score ? Number(sub.score) : undefined,
        status: sub.status,
        submittedAt: sub.submittedAt.toISOString(),
        assignment: {
          title: sub.assignment.title,
          maxScore: sub.assignment.maxScore,
          skillType: sub.assignment.lesson.skill,
        },
      })),
    };
  }

  // ----------------------------------------------------
  // REPORTS & COACHING FEEDBACK
  // ----------------------------------------------------

  async createStudentFeedback(
    userId: string,
    studentUserId: string,
    title: string,
    content: string,
    strengths: string[],
    improvements: string[]
  ) {
    const profile = await this.getOrCreateTeacherProfile(userId);

    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { userId: studentUserId },
          { id: studentUserId },
        ],
      },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    return prisma.teacherFeedback.create({
      data: {
        teacherId: profile.id,
        studentId: studentProfile.id,
        title,
        content,
        strengths,
        improvements,
      },
    });
  }

  async getTeacherReports(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const teacherId = profile.id;

    const [payments, courses, enrollments, attendances] = await Promise.all([
      prisma.payment.findMany({
        where: { teacherId, status: PaymentStatus.VERIFIED },
      }),
      prisma.course.findMany({
        where: { teacherId },
        include: { _count: { select: { enrollments: true } } },
      }),
      prisma.enrollment.findMany({
        where: { course: { teacherId } },
        include: { student: true, course: true },
      }),
      prisma.attendance.findMany({
        where: { class: { teacherId } },
      }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const attendanceRate =
      attendances.length > 0
        ? Math.round((attendances.filter((a) => a.status === 'PRESENT').length / attendances.length) * 100)
        : 95;

    return {
      totalRevenue,
      totalStudentsEnrolled: enrollments.length,
      activeCoursesCount: courses.length,
      overallAttendanceRate: attendanceRate,
      courseBreakdown: courses.map((c) => ({
        id: c.id,
        title: c.title,
        level: c.level,
        enrollmentCount: c._count.enrollments,
        revenue: 0,
      })),
    };
  }

  // --- Course Publishing Lifecycle ---
  async publishCourse(userId: string, courseId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.course.update({
      where: { id: courseId, teacherId: profile.id },
      data: { isPublished: true },
    });
  }

  async unpublishCourse(userId: string, courseId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.course.update({
      where: { id: courseId, teacherId: profile.id },
      data: { isPublished: false },
    });
  }

  // --- Units & Lessons Advanced ---
  async updateUnit(unitId: string, data: { title?: string; description?: string; orderIndex?: number; isPublished?: boolean }) {
    return prisma.unit.update({
      where: { id: unitId },
      data,
    });
  }

  async deleteUnit(unitId: string) {
    return prisma.unit.delete({
      where: { id: unitId },
    });
  }

  async updateLesson(lessonId: string, data: any) {
    const { sections, ...lessonData } = data;

    const updatePayload: any = {};

    if (lessonData.title !== undefined) updatePayload.title = lessonData.title;
    if (lessonData.description !== undefined) updatePayload.description = lessonData.description;
    
    if (lessonData.skills !== undefined && Array.isArray(lessonData.skills) && lessonData.skills.length > 0) {
      updatePayload.skills = lessonData.skills as SkillType[];
      updatePayload.skill = lessonData.skills[0] as SkillType;
    } else if (lessonData.skill !== undefined) {
      updatePayload.skill = lessonData.skill as SkillType;
      updatePayload.skills = [lessonData.skill as SkillType];
    } else if (lessonData.skillType !== undefined) {
      updatePayload.skill = lessonData.skillType as SkillType;
      updatePayload.skills = [lessonData.skillType as SkillType];
    }

    if (lessonData.estimatedMinutes !== undefined) {
      updatePayload.estimatedMinutes = Number(lessonData.estimatedMinutes);
    } else if (lessonData.durationMinutes !== undefined) {
      updatePayload.estimatedMinutes = Number(lessonData.durationMinutes);
    }

    if (lessonData.orderIndex !== undefined) {
      updatePayload.orderIndex = Number(lessonData.orderIndex);
    } else if (lessonData.order !== undefined) {
      updatePayload.orderIndex = Number(lessonData.order);
    }

    if (lessonData.isPublished !== undefined) updatePayload.isPublished = Boolean(lessonData.isPublished);
    if (lessonData.isFreePreview !== undefined) updatePayload.isFreePreview = Boolean(lessonData.isFreePreview);

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: updatePayload,
    });

    if (sections && Array.isArray(sections)) {
      await prisma.lessonSection.deleteMany({ where: { lessonId } });
      await prisma.lessonSection.createMany({
        data: sections.map((s: any, idx: number) => ({
          lessonId,
          title: s.title,
          contentType: s.contentType || 'MARKDOWN',
          content: s.content || '',
          mediaUrl: s.mediaUrl,
          orderIndex: s.orderIndex || idx + 1,
        })),
      });
    }

    return updated;
  }

  async getLessonDetails(lessonId: string) {
    return prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
        },
        activities: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        unit: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async deleteLesson(lessonId: string) {
    return prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  // --- Quizzes Studio & Analytics ---
  async getQuizzes(userId: string, courseId?: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.quiz.findMany({
      where: {
        lesson: {
          unit: {
            course: {
              teacherId: profile.id,
              ...(courseId && { id: courseId }),
            },
          },
        },
      },
      include: {
        lesson: { include: { unit: { include: { course: true } } } },
        questions: true,
        attempts: {
          include: { student: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuizDetails(userId: string, quizId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        lesson: { unit: { course: { teacherId: profile.id } } },
      },
      include: {
        lesson: { include: { unit: { include: { course: true } } } },
        questions: { orderBy: { orderIndex: 'asc' } },
        attempts: {
          include: { student: { include: { user: true } } },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!quiz) throw new AppError('Quiz not found', 404);
    return quiz;
  }

  async createQuiz(userId: string, data: any) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const { questions, ...quizData } = data;

    return prisma.quiz.create({
      data: {
        ...quizData,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            prompt: q.prompt,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points || 10,
            orderIndex: q.orderIndex || idx + 1,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async deleteQuiz(userId: string, quizId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.quiz.deleteMany({
      where: {
        id: quizId,
        lesson: { unit: { course: { teacherId: profile.id } } },
      },
    });
  }

  async getQuizAnalytics(userId: string, quizId: string) {
    const quiz = await this.getQuizDetails(userId, quizId);
    const attempts = quiz.attempts;
    const totalAttempts = attempts.length;
    const scores = attempts.map((a: any) => Number(a.scorePercentage || a.score || 0));
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passedAttempts = attempts.filter((a: any) => a.isPassed || a.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        courseTitle: quiz.lesson.unit.course.title,
      },
      totalAttempts,
      avgScore,
      maxScore,
      minScore,
      passRate,
      recentAttempts: attempts.slice(0, 10),
    };
  }

  // --- Enrollment Lifecycle & Expiring Watchlist ---
  async getEnrollments(userId: string, status?: EnrollmentStatus) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.enrollment.findMany({
      where: {
        course: { teacherId: profile.id },
        ...(status && { status }),
      },
      include: {
        student: { include: { user: true } },
        course: true,
        class: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async getExpiringStudents(userId: string, days = 7) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return prisma.enrollment.findMany({
      where: {
        course: { teacherId: profile.id },
        status: EnrollmentStatus.ACTIVE,
        expiresAt: {
          gte: new Date(),
          lte: targetDate,
        },
      },
      include: {
        student: { include: { user: true } },
        course: true,
        class: true,
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async extendEnrollment(userId: string, enrollmentId: string, extensionDays = 30, reason?: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, course: { teacherId: profile.id } },
    });

    if (!enrollment) throw new AppError('Enrollment not found', 404);

    const currentExpiry = enrollment.expiresAt && enrollment.expiresAt > new Date() ? enrollment.expiresAt : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + extensionDays);

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        expiresAt: newExpiry,
        status: EnrollmentStatus.ACTIVE,
      },
      include: { student: { include: { user: true } }, course: true },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ENROLLMENT_EXTENDED',
        entity: 'ENROLLMENT',
        entityId: enrollmentId,
        metadata: {
          extensionDays,
          previousExpiry: enrollment.expiresAt,
          newExpiry,
          reason: reason || 'Teacher manual extension',
        },
      },
    });

    return updated;
  }

  async suspendEnrollment(userId: string, enrollmentId: string, reason: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.enrollment.updateMany({
      where: { id: enrollmentId, course: { teacherId: profile.id } },
      data: { status: EnrollmentStatus.SUSPENDED },
    });
  }

  // --- Calendar Schedule ---
  async getCalendarEvents(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const teacherId = profile.id;

    const [classes, assignments, quizzes, expiringEnrollments] = await Promise.all([
      prisma.class.findMany({
        where: { teacherId },
        include: { course: true },
      }),
      prisma.assignment.findMany({
        where: { lesson: { unit: { course: { teacherId } } } },
        include: { lesson: { include: { unit: { include: { course: true } } } } },
      }),
      prisma.quiz.findMany({
        where: { lesson: { unit: { course: { teacherId } } } },
        include: { lesson: { include: { unit: { include: { course: true } } } } },
      }),
      prisma.enrollment.findMany({
        where: {
          course: { teacherId },
          status: EnrollmentStatus.ACTIVE,
          expiresAt: { not: null },
        },
        include: { student: { include: { user: true } }, course: true },
        take: 20,
      }),
    ]);

    const events: any[] = [];

    classes.forEach((c) => {
      if (c.startDate) {
        events.push({
          id: `class-${c.id}`,
          title: `Cohort Session: ${c.name}`,
          type: 'CLASS',
          date: c.startDate.toISOString(),
          courseTitle: c.course?.title || 'Cohort',
        });
      }
    });

    assignments.forEach((a) => {
      if (a.dueDate) {
        events.push({
          id: `asg-${a.id}`,
          title: `Deadline: ${a.title}`,
          type: 'ASSIGNMENT_DUE',
          date: a.dueDate.toISOString(),
          courseTitle: a.lesson.unit.course.title,
        });
      }
    });

    expiringEnrollments.forEach((e) => {
      if (e.expiresAt) {
        events.push({
          id: `exp-${e.id}`,
          title: `Access Expiry: ${e.student.user.firstName} ${e.student.user.lastName}`,
          type: 'EXPIRY',
          date: e.expiresAt.toISOString(),
          courseTitle: e.course.title,
        });
      }
    });

    return events;
  }

  // --- Feedback List ---
  async getFeedbackList(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    return prisma.teacherFeedback.findMany({
      where: { teacherId: profile.id },
      include: {
        student: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Skill Proficiency & Reports ---
  async getSkillProficiencySummary(userId: string) {
    const profile = await this.getOrCreateTeacherProfile(userId);
    const enrollments = await prisma.enrollment.findMany({
      where: { course: { teacherId: profile.id } },
      select: { studentId: true },
    });

    const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
    if (studentIds.length === 0) {
      return [
        { skill: 'Grammar', score: 0 },
        { skill: 'Vocabulary', score: 0 },
        { skill: 'Reading', score: 0 },
        { skill: 'Listening', score: 0 },
        { skill: 'Writing', score: 0 },
        { skill: 'Speaking', score: 0 },
        { skill: 'Pronunciation', score: 0 },
      ];
    }

    const aggregated = await prisma.skillProgress.groupBy({
      by: ['skill'],
      where: { studentId: { in: studentIds } },
      _avg: { scorePercentage: true },
    });

    const skillMap = new Map(aggregated.map((a) => [a.skill, Math.round(Number(a._avg.scorePercentage || 0))]));
    const allSkills: SkillType[] = [
      SkillType.GRAMMAR,
      SkillType.VOCABULARY,
      SkillType.READING,
      SkillType.LISTENING,
      SkillType.WRITING,
      SkillType.SPEAKING,
      SkillType.PRONUNCIATION,
    ];

    return allSkills.map((sk) => ({
      skill: sk.charAt(0) + sk.slice(1).toLowerCase().replace('_', ' '),
      score: skillMap.get(sk) ?? 0,
    }));
  }
}

export const teacherRepository = new TeacherRepository();


