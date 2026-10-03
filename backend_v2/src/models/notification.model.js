import { query } from '../config/database.js';
import crypto from 'crypto';

export class NotificationModel {
  /**
   * Find notifications for user with pagination and optional unread filter
   */
  static async findByUserId(userId, { unreadOnly = false, limit = 50, offset = 0, type = null } = {}) {
    const whereConditions = [`"userId" = $1`];
    const params = [userId];

    if (unreadOnly) {
      whereConditions.push(`"isRead" = false`);
    }

    if (type) {
      params.push(type);
      whereConditions.push(`type = $${params.length}`);
    }

    params.push(limit, offset);

    const res = await query(
      `SELECT * FROM "public"."notifications"
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await query(
      `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE "isRead" = false) AS unread
       FROM "public"."notifications" 
       WHERE "userId" = $1`,
      [userId]
    );

    return {
      notifications: res.rows,
      total: parseInt(countRes.rows[0]?.total || '0', 10),
      unreadCount: parseInt(countRes.rows[0]?.unread || '0', 10),
    };
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const res = await query(
      `SELECT COUNT(*) AS unread FROM "public"."notifications" WHERE "userId" = $1 AND "isRead" = false`,
      [userId]
    );
    return parseInt(res.rows[0]?.unread || '0', 10);
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
   * Create multiple notifications in bulk
   */
  static async createMany(notifications = []) {
    if (!notifications.length) return [];

    const values = [];
    const placeholders = [];
    let paramIdx = 1;

    for (const n of notifications) {
      const id = n.id || crypto.randomUUID();
      placeholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, false, $${paramIdx + 5}, NOW())`);
      values.push(id, n.userId, n.title, n.message, n.type || 'SYSTEM', n.link || null);
      paramIdx += 6;
    }

    const res = await query(
      `INSERT INTO "public"."notifications"
        (id, "userId", title, message, type, "isRead", link, "createdAt")
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return res.rows;
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
    const res = await query(
      `UPDATE "public"."notifications"
       SET "isRead" = true
       WHERE "userId" = $1 AND "isRead" = false
       RETURNING id`,
      [userId]
    );
    return res.rowCount || 0;
  }

  /**
   * Delete a single notification
   */
  static async delete(id, userId) {
    const res = await query(
      `DELETE FROM "public"."notifications"
       WHERE id = $1 AND "userId" = $2
       RETURNING id`,
      [id, userId]
    );
    return res.rowCount > 0;
  }

  /**
   * Clear all notifications for a user
   */
  static async clearAll(userId) {
    const res = await query(
      `DELETE FROM "public"."notifications"
       WHERE "userId" = $1
       RETURNING id`,
      [userId]
    );
    return res.rowCount || 0;
  }
}
