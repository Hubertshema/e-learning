import { NotificationModel } from '../models/notification.model.js';
import { SocketService } from './socket.service.js';

export class NotificationService {
  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId, options = {}) {
    return NotificationModel.findByUserId(userId, options);
  }

  /**
   * Create notification and push in real-time via Socket.IO
   */
  static async createAndPushNotification({ userId, title, message, type = 'SYSTEM', link = null }) {
    const notification = await NotificationModel.create({
      userId,
      title,
      message,
      type,
      link,
    });

    // Push real-time event to user's socket room
    SocketService.emitToUser(userId, 'notification:new', notification);

    return notification;
  }

  /**
   * Mark notification as read
   */
  static async markRead(id, userId) {
    const updated = await NotificationModel.markAsRead(id, userId);
    if (!updated) {
      const error = new Error('Notification not found or access denied');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return updated;
  }

  /**
   * Mark all as read
   */
  static async markAllRead(userId) {
    await NotificationModel.markAllAsRead(userId);
    return { success: true };
  }
}
