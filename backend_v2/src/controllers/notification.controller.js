import { NotificationService } from '../services/notification.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async list(req, res, next) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const type = req.query.type || null;

      const result = await NotificationService.getUserNotifications(req.user.id, {
        unreadOnly,
        limit,
        offset,
        type,
      });

      return sendSuccess(res, result, 'Notifications retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const unreadCount = await NotificationService.getUnreadCount(req.user.id);
      return sendSuccess(res, { unreadCount }, 'Unread count retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  static async markRead(req, res, next) {
    try {
      const updated = await NotificationService.markRead(req.params.id, req.user.id);
      return sendSuccess(res, updated, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  static async markAllRead(req, res, next) {
    try {
      const result = await NotificationService.markAllRead(req.user.id);
      return sendSuccess(res, result, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  static async delete(req, res, next) {
    try {
      const result = await NotificationService.deleteNotification(req.params.id, req.user.id);
      return sendSuccess(res, result, 'Notification deleted');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications/clear-all
   */
  static async clearAll(req, res, next) {
    try {
      const result = await NotificationService.clearAll(req.user.id);
      return sendSuccess(res, result, 'All notifications cleared');
    } catch (err) {
      next(err);
    }
  }
}
