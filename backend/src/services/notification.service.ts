import { prisma } from '../config/database.js';
import { emailService } from './email/email.service.js';
import { EmailTemplateType } from './email/email.types.js';

export interface NotifyUserOptions {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  emailTemplate?: EmailTemplateType;
  emailData?: Record<string, any>;
  isSecurityCritical?: boolean;
  preferenceKey?: string;
}

export class NotificationService {
  /**
   * Universal notification dispatcher: creates In-App Notification and dispatches Email
   */
  async notifyUser(options: NotifyUserOptions) {
    // 1. Fetch user email and preferences
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      include: { notificationPreference: true },
    });

    if (!user) return null;

    const pref = user.notificationPreference;

    // 2. Create In-App Notification if enabled (or security critical)
    let notification = null;
    const shouldCreateInApp = options.isSecurityCritical || !pref || pref.inAppEnabled !== false;

    if (shouldCreateInApp) {
      notification = await prisma.notification.create({
        data: {
          userId: options.userId,
          title: options.title,
          message: options.message,
          type: options.type || 'INFO',
          link: options.link,
        },
      });
    }

    // 3. Queue Email if template provided
    if (options.emailTemplate) {
      await emailService.sendTemplate({
        to: user.email,
        userId: user.id,
        template: options.emailTemplate,
        data: {
          name: `${user.firstName} ${user.lastName}`,
          studentName: `${user.firstName} ${user.lastName}`,
          teacherName: `${user.firstName} ${user.lastName}`,
          ...(options.emailData || {}),
        },
        isSecurityCritical: options.isSecurityCritical,
        preferenceKey: options.preferenceKey,
      });
    }

    return notification;
  }

  /**
   * Get user in-app notifications
   */
  async getUserNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete single notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  /**
   * Direct creation helper
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        link: data.link,
      },
    });
  }

  /**
   * Get or initialize User Notification Preferences
   */
  async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          enrollmentEmails: true,
          paymentEmails: true,
          assignmentEmails: true,
          quizEmails: true,
          feedbackEmails: true,
          courseExpirationEmails: true,
          courseCompletionEmails: true,
          announcementEmails: true,
          inAppEnabled: true,
        },
      });
    }

    return pref;
  }

  /**
   * Update User Notification Preferences
   */
  async updatePreferences(userId: string, data: Partial<{
    emailEnabled: boolean;
    enrollmentEmails: boolean;
    paymentEmails: boolean;
    assignmentEmails: boolean;
    quizEmails: boolean;
    feedbackEmails: boolean;
    courseExpirationEmails: boolean;
    courseCompletionEmails: boolean;
    announcementEmails: boolean;
    inAppEnabled: boolean;
  }>) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}

export const notificationService = new NotificationService();
