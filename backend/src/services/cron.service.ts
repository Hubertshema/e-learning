import { prisma } from '../config/database.js';
import { notificationService } from './notification.service.js';
import { EnrollmentStatus } from '@prisma/client';

export class CronService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start scheduled background jobs (runs every hour)
   */
  startScheduledJobs() {
    console.log('[CRON SERVICE] Initializing Course Expiration & Reminder workers...');

    // Run initial scan after 5 seconds
    setTimeout(() => {
      this.checkCourseExpirations();
    }, 5000);

    // Schedule hourly scan
    this.intervalId = setInterval(() => {
      this.checkCourseExpirations();
    }, 60 * 60 * 1000);
  }

  stopScheduledJobs() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Scan active enrollments for 7-day, 3-day, and 1-day expiration warnings & auto-expire past-due enrollments
   */
  async checkCourseExpirations() {
    try {
      const now = new Date();

      // 1. Find enrollments that have passed their expiresAt date -> Mark EXPIRED
      const expiredEnrollments = await prisma.enrollment.findMany({
        where: {
          status: EnrollmentStatus.ACTIVE,
          expiresAt: { lt: now },
        },
        include: {
          student: { include: { user: true } },
          course: true,
        },
      });

      for (const enr of expiredEnrollments) {
        await prisma.enrollment.update({
          where: { id: enr.id },
          data: { status: EnrollmentStatus.EXPIRED },
        });

        await notificationService.notifyUser({
          userId: enr.student.userId,
          type: 'COURSE_EXPIRED',
          title: `Course Access Expired: ${enr.course.title}`,
          message: `Your active enrollment duration for ${enr.course.title} has ended. Your historical progress is saved.`,
          link: `/courses/${enr.course.slug}`,
          emailTemplate: 'CourseExpiredEmail',
          emailData: {
            studentName: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
            courseTitle: enr.course.title,
          },
          preferenceKey: 'courseExpirationEmails',
        });
      }

      // 2. Reminder Windows (7 days, 3 days, 1 day)
      const reminderThresholds = [
        { days: 7, startHours: 7 * 24 - 12, endHours: 7 * 24 + 12 },
        { days: 3, startHours: 3 * 24 - 12, endHours: 3 * 24 + 12 },
        { days: 1, startHours: 1 * 24 - 12, endHours: 1 * 24 + 12 },
      ];

      for (const thresh of reminderThresholds) {
        const windowStart = new Date(now.getTime() + thresh.startHours * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + thresh.endHours * 60 * 60 * 1000);

        const expiringSoon = await prisma.enrollment.findMany({
          where: {
            status: EnrollmentStatus.ACTIVE,
            expiresAt: {
              gte: windowStart,
              lte: windowEnd,
            },
          },
          include: {
            student: { include: { user: true } },
            course: true,
          },
        });

        for (const enr of expiringSoon) {
          if (!enr.expiresAt) continue;

          // Check deduplication in notifications
          const reminderTitle = `Reminder: Your enrollment in ${enr.course.title} expires in ${thresh.days} days`;
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: enr.student.userId,
              title: reminderTitle,
              createdAt: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24h
              },
            },
          });

          if (!existingNotification) {
            await notificationService.notifyUser({
              userId: enr.student.userId,
              type: 'COURSE_EXPIRING',
              title: reminderTitle,
              message: `Your access to ${enr.course.title} expires on ${enr.expiresAt.toLocaleDateString()}. Complete remaining lessons to earn your certificate!`,
              link: '/student/courses',
              emailTemplate: 'CourseExpiringEmail',
              emailData: {
                studentName: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
                courseTitle: enr.course.title,
                daysRemaining: thresh.days,
                expiryDate: enr.expiresAt.toLocaleDateString(),
              },
              preferenceKey: 'courseExpirationEmails',
            });
          }
        }
      }
    } catch (err) {
      console.error('[CRON SERVICE ERROR] Course expiration check failed:', err);
    }
  }
}

export const cronService = new CronService();
