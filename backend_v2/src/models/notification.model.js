import { query } from '../config/database.js';
import crypto from 'crypto';

export class NotificationModel {
  /**
   * Find notifications for user
   */
  static async findByUserId(userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) {
    const whereConditions = [`"userId" = $1`];
    const params = [userId];

    if (unreadOnly) {
      whereConditions.push(`"isRead" = false`);
    }

    params.push(limit, offset);

    const res = await query(
      `SELECT * FROM "public"."notifications"
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM "public"."notifications" WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    );

    return {
      notifications: res.rows,
      unreadCount: parseInt(countRes.rows[0].total, 10),
    };
  }

  /**
   * Create notification
   */
  static async create({ userId, title, message, type = 'SYSTEM', link = null }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."notifications"
        (id, "userId", title, message, type, "isRead", link, "createdAt")
       VALUES ($1, $2, $3, $4, $5, false, $6, NOW())
       RETURNING *`,
      [id, userId, title, message, type, link]
    );
    return res.rows[0];
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id, userId) {
    const res = await query(
      `UPDATE "public"."notifications"
       SET "isRead" = true
       WHERE id = $1 AND "userId" = $2
       RETURNING *`,
      [id, userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    await query(
      `UPDATE "public"."notifications"
       SET "isRead" = true
       WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    );
  }
}
