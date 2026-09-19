import { prisma } from '../config/database.js';
import { User, Role, UserStatus, CEFRLevel, Prisma } from '@prisma/client';
import { RegisterInput } from '../validators/auth.validator.js';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        studentProfile: true,
        notificationPreference: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        teacherProfile: true,
        studentProfile: true,
        notificationPreference: true,
      },
    });
  }

  async createUserWithProfile(
    data: RegisterInput,
    passwordHash: string,
    initialStatus: UserStatus = 'ACTIVE',
    isTeacherApproved = false
  ): Promise<User> {
    const role = data.role as Role;

    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        status: initialStatus,
        phone: data.phone,
        country: 'Rwanda',
        city: 'Kigali',
        timezone: 'Africa/Kigali',
        preferredLanguage: 'en',
        notificationPreference: {
          create: {},
        },
        ...(role === 'TEACHER' && {
          teacherProfile: {
            create: {
              headline: data.headline || 'English Instructor',
              bio: data.bio || '',
              specialties: data.specialties || ['General English'],
              experienceYears: data.experienceYears || 0,
              isApproved: isTeacherApproved,
              languagesSpoken: ['English'],
              levelsTaught: [CEFRLevel.A1, CEFRLevel.A2, CEFRLevel.B1, CEFRLevel.B2],
              profileVisibility: 'PUBLIC',
            },
          },
        }),
        ...(role === 'STUDENT' && {
          studentProfile: {
            create: {
              nativeLanguage: data.nativeLanguage || 'English',
              currentLevel: (data.currentLevel as CEFRLevel) || 'PRE_A1',
              targetLevel: (data.targetLevel as CEFRLevel) || 'B2',
              learningGoals: data.learningGoals || ['Improve Fluency'],
              profileVisibility: 'TEACHER_ONLY',
            },
          },
        }),
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
        notificationPreference: true,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        teacherProfile: true,
        studentProfile: true,
        notificationPreference: true,
      },
    });
  }

  async updateTeacherProfile(userId: string, data: Prisma.TeacherProfileUpdateInput) {
    return prisma.teacherProfile.update({
      where: { userId },
      data,
    });
  }

  async updateStudentProfile(userId: string, data: Prisma.StudentProfileUpdateInput) {
    return prisma.studentProfile.update({
      where: { userId },
      data,
    });
  }

  async getActiveSessions(userId: string) {
    const [tokens, recentLogins] = await Promise.all([
      prisma.refreshToken.findMany({
        where: { userId, revoked: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { userId, action: { in: ['LOGIN_SUCCESS', 'PASSWORD_CHANGED', 'PROFILE_UPDATED'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      activeTokensCount: tokens.length,
      sessions: tokens.map((t, idx) => ({
        id: t.id,
        device: idx === 0 ? 'Current Device (Active Session)' : `Browser Session #${idx + 1}`,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        isCurrent: idx === 0,
      })),
      recentActivity: recentLogins,
    };
  }

  async revokeAllSessions(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}

export const userRepository = new UserRepository();
