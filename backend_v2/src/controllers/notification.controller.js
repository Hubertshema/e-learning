import { NotificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async list(req, res, next) {
    try {
      const unreadOnly = req.query.unread === 'true';
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = parseInt(req.query.offset || '0', 10);

      const result = await NotificationService.getUserNotifications(req.user.id, {
        unreadOnly,
        limit,
        offset,
      });

      return sendSuccess(res, result, 'Notifications retrieved');
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
      await NotificationService.markAllRead(req.user.id);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}
