import { prisma } from '../config/database.js';
import { Role, UserStatus, PaymentStatus, EnrollmentStatus, CEFRLevel, Prisma } from '@prisma/client';

export class SuperadminRepository {
  async getOverviewStats() {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      approvedTeachers,
      pendingTeachers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      totalPayments,
      verifiedRevenue,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.STUDENT, status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { role: Role.TEACHER } }),
      prisma.teacherProfile.count({ where: { isApproved: true } }),
      prisma.teacherProfile.count({ where: { isApproved: false } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
      prisma.payment.count(),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.VERIFIED },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true, role: true } } },
      }),
    ]);

    return {
      students: { total: totalStudents, active: activeStudents },
      teachers: { total: totalTeachers, approved: approvedTeachers, pending: pendingTeachers },
      courses: { total: totalCourses, published: publishedCourses },
      enrollments: { total: totalEnrollments, active: activeEnrollments },
      financials: {
        totalPayments,
        totalRevenue: Number(verifiedRevenue._sum.amount || 0),
        currency: 'USD',
      },
      recentAuditLogs,
    };
  }

  async findTeachers(params: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    isApproved?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.TEACHER,
      ...(params.status && { status: params.status }),
      ...(params.isApproved !== undefined && {
        teacherProfile: { isApproved: params.isApproved },
      }),
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, teachers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacherProfile: {
            include: {
              _count: { select: { courses: true, classes: true, payments: true } },
            },
          },
        },
      }),
    ]);

    return {
      teachers: teachers.map((item) => {
        const { passwordHash, ...user } = item;
        return user;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findStudents(params: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.STUDENT,
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, students] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: {
            include: {
              _count: { select: { enrollments: true, payments: true, certificates: true } },
            },
          },
        },
      }),
    ]);

    return {
      students: students.map((item) => {
        const { passwordHash, ...user } = item;
        return user;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCourses(params: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { category: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, courses] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          _count: { select: { units: true, enrollments: true, classes: true } },
        },
      }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPayments(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { transactionRef: { contains: params.search, mode: 'insensitive' } },
          { student: { user: { firstName: { contains: params.search, mode: 'insensitive' } } } },
          { student: { user: { lastName: { contains: params.search, mode: 'insensitive' } } } },
          { student: { user: { email: { contains: params.search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          teacher: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          enrollment: {
            include: { course: { select: { id: true, title: true, level: true, price: true } } },
          },
        },
      }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findEnrollments(params: {
    page?: number;
    limit?: number;
    status?: EnrollmentStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { course: { title: { contains: params.search, mode: 'insensitive' } } },
          { student: { user: { firstName: { contains: params.search, mode: 'insensitive' } } } },
          { student: { user: { lastName: { contains: params.search, mode: 'insensitive' } } } },
          { student: { user: { email: { contains: params.search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const [total, enrollments] = await Promise.all([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          course: {
            include: {
              teacher: {
                include: { user: { select: { firstName: true, lastName: true, email: true } } },
              },
            },
          },
          class: { select: { id: true, name: true, code: true } },
          payments: {
            select: { id: true, amount: true, status: true, paymentMethod: true, transactionRef: true },
          },
        },
      }),
    ]);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus, expiresAt?: Date) {
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        ...(status === EnrollmentStatus.ACTIVE && { activatedAt: new Date() }),
        ...(expiresAt && { expiresAt }),
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
    });
  }

  async extendEnrollment(enrollmentId: string, days: number) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new Error('Enrollment record not found');
    }

    const currentBase = enrollment.expiresAt && enrollment.expiresAt > new Date()
      ? new Date(enrollment.expiresAt)
      : new Date();

    const newExpiresAt = new Date(currentBase.getTime() + days * 24 * 60 * 60 * 1000);

    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        expiresAt: newExpiresAt,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
    });
  }

  async verifyPayment(paymentId: string, status: PaymentStatus, notes?: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status,
          ...(notes && { notes }),
          verifiedAt: new Date(),
        },
        include: {
          student: { include: { user: true } },
          enrollment: true,
        },
      });

      if (status === PaymentStatus.VERIFIED && payment.enrollmentId) {
        await tx.enrollment.update({
          where: { id: payment.enrollmentId },
          data: {
            status: EnrollmentStatus.ACTIVE,
            activatedAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days validity
          },
        });

        await tx.notification.create({
          data: {
            userId: payment.student.userId,
            title: 'Payment Verified & Access Granted! 🚀',
            message: `Your payment of ${payment.currency} ${payment.amount} was verified by administration. Course access is now active.`,
            type: 'PAYMENT_VERIFIED',
            link: '/student/my-courses',
          },
        });
      }

      return payment;
    });
  }

  async updateStudentLevel(userId: string, level: CEFRLevel) {
    return prisma.studentProfile.update({
      where: { userId },
      data: { currentLevel: level },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async resetUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
  }

  async getSettings() {
    let settings = await (prisma as any).platformSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await (prisma as any).platformSetting.create({
        data: {
          id: 'default',
          platformName: 'FluentEdge Academy',
          supportEmail: 'support@fluentedge.com',
          defaultCurrency: 'USD',
          defaultTimezone: 'Africa/Kigali',
          defaultLanguage: 'en',
          requireTeacherReview: true,
          allowStudentRegistration: true,
          allowTeacherRegistration: true,
          platformCommissionPercent: 15,
        },
      });
    }

    return settings;
  }

  async updateSettings(data: any) {
    return (prisma as any).platformSetting.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        ...data,
      },
    });
  }

  async findAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(params.action && { action: { contains: params.action, mode: 'insensitive' } }),
      ...(params.entity && { entity: { contains: params.entity, mode: 'insensitive' } }),
    };

    const [total, auditLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        },
      }),
    ]);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveTeacher(teacherUserId: string, hourlyRate?: number) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update teacher profile
      const profile = await tx.teacherProfile.update({
        where: { userId: teacherUserId },
        data: {
          isApproved: true,
          approvalDate: new Date(),
          ...(hourlyRate && { hourlyRate }),
        },
      });

      // 2. Activate user status
      const user = await tx.user.update({
        where: { id: teacherUserId },
        data: { status: UserStatus.ACTIVE },
      });

      // 3. Create notification for teacher
      await tx.notification.create({
        data: {
          userId: teacherUserId,
          title: 'Teaching Application Approved! 🎉',
          message: 'Your instructor application has been approved. You can now create courses, classes, and receive student enrollments.',
          type: 'APPROVAL',
          link: '/teacher',
        },
      });

      return { user, profile };
    });
  }

  async rejectTeacher(teacherUserId: string, reason: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const profile = await tx.teacherProfile.update({
        where: { userId: teacherUserId },
        data: { isApproved: false },
      });

      const user = await tx.user.update({
        where: { id: teacherUserId },
        data: { status: UserStatus.SUSPENDED },
      });

      await tx.notification.create({
        data: {
          userId: teacherUserId,
          title: 'Teaching Application Update',
          message: `Your instructor application was not approved at this time: ${reason}`,
          type: 'REJECTION',
        },
      });

      return { user, profile };
    });
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      include: { teacherProfile: true, studentProfile: true },
    });
  }

  async updateCourseStatus(courseId: string, isPublished?: boolean, featured?: boolean) {
    return prisma.course.update({
      where: { id: courseId },
      data: {
        ...(isPublished !== undefined && { isPublished }),
        ...(featured !== undefined && { featured }),
      },
    });
  }

  // ----------------------------------------------------
  // EMAIL LOGS & ANNOUNCEMENTS
  // ----------------------------------------------------

  async findEmailLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    template?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.status && { status: params.status }),
      ...(params.template && { template: params.template }),
      ...(params.search && {
        OR: [
          { recipient: { contains: params.search, mode: 'insensitive' } },
          { subject: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, logs, stats] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      this.getEmailOverviewStats(),
    ]);

    return {
      data: logs,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmailLogById(id: string) {
    return prisma.emailLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getEmailOverviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalSent, totalQueued, totalFailed, totalToday, totalThisWeek] = await Promise.all([
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: { in: ['QUEUED', 'SENDING', 'RETRYING'] } } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { createdAt: { gte: today } } }),
      prisma.emailLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
      sent: totalSent,
      queued: totalQueued,
      failed: totalFailed,
      today: totalToday,
      thisWeek: totalThisWeek,
    };
  }

  async getTargetUsersForAnnouncement(audience: 'ALL_USERS' | 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'SELECTED_USERS', targetIds?: string[]) {
    if (audience === 'SELECTED_USERS' && targetIds && targetIds.length > 0) {
      return prisma.user.findMany({
        where: { id: { in: targetIds }, status: UserStatus.ACTIVE },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
    }

    if (audience === 'ALL_STUDENTS') {
      return prisma.user.findMany({
        where: { role: Role.STUDENT, status: UserStatus.ACTIVE },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
    }

    if (audience === 'ALL_TEACHERS') {
      return prisma.user.findMany({
        where: { role: Role.TEACHER, status: UserStatus.ACTIVE },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
    }

    // ALL_USERS
    return prisma.user.findMany({
      where: { status: UserStatus.ACTIVE },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
  }
}

export const superadminRepository = new SuperadminRepository();

