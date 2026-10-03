import { NotificationModel } from '../models/notification.model.js';
import { SocketService } from './socket.service.js';
import { query } from '../config/database.js';

export class NotificationService {
  /**
   * Get notifications for a user with pagination
   */
  static async getUserNotifications(userId, options = {}) {
    return NotificationModel.findByUserId(userId, options);
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    return NotificationModel.getUnreadCount(userId);
  }

  /**
   * Create notification and push in real-time via Socket.IO
   */
  static async createAndPushNotification({ userId, title, message, type = 'SYSTEM', link = null }) {
    if (!userId || !title || !message) {
      throw new Error('userId, title, and message are required for notification');
    }

    const notification = await NotificationModel.create({
      userId,
      title,
      message,
      type,
      link,
    });

    // Push real-time event to user's socket room
    try {
      SocketService.emitToUser(userId, 'notification:new', notification);
    } catch (sockErr) {
      console.warn('Socket notification push failed (user may be offline):', sockErr.message);
    }

    return notification;
  }

  /**
   * Batch create and push notification to multiple users
   */
  static async pushToUsers(userIds, { title, message, type = 'SYSTEM', link = null }) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];

    const items = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      link,
    }));

    const created = await NotificationModel.createMany(items);

    // Emit socket event to each user
    for (const notif of created) {
      try {
        SocketService.emitToUser(notif.userId, 'notification:new', notif);
      } catch (err) {
        // Continue
      }
    }

    return created;
  }

  /**
   * Broadcast notification to all users or by role
   */
  static async broadcast({ title, message, targetRole = 'ALL', link = null }) {
    let roleFilter = '';
    const params = [];
    if (targetRole && targetRole !== 'ALL' && targetRole !== 'ALL_USERS') {
      const cleanRole = targetRole.replace('ALL_', '');
      params.push(cleanRole);
      roleFilter = ` AND role = $1`;
    }

    const usersRes = await query(
      `SELECT id FROM "public"."users" WHERE status = 'ACTIVE' ${roleFilter}`,
      params
    );

    const userIds = usersRes.rows.map((u) => u.id);
    return this.pushToUsers(userIds, {
      title,
      message,
      type: 'PLATFORM_ANNOUNCEMENT',
      link,
    });
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
    const count = await NotificationModel.markAllAsRead(userId);
    return { success: true, count };
  }

  /**
   * Delete a single notification
   */
  static async deleteNotification(id, userId) {
    const deleted = await NotificationModel.delete(id, userId);
    if (!deleted) {
      const error = new Error('Notification not found or access denied');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return { success: true, id };
  }

  /**
   * Clear all notifications for user
   */
  static async clearAll(userId) {
    const count = await NotificationModel.clearAll(userId);
    return { success: true, count };
  }
}
