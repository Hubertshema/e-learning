import { query } from '../config/database.js';
import crypto from 'crypto';

export class ContactModel {
  /**
   * Save a new public contact message
   */
  static async createMessage({ name, email, phone = null, subject = null, message }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."contact_messages" 
         (id, name, email, phone, subject, message, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'UNREAD', NOW(), NOW())
       RETURNING id, name, email, phone, subject, message, status, "createdAt"`,
      [id, name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, subject ? subject.trim() : null, message.trim()]
    );
    return res.rows[0];
  }

  /**
   * List contact messages with optional status filter and pagination
   */
  static async listMessages({ status, limit = 50, offset = 0 } = {}) {
    const whereClauses = [];
    const params = [];
    let idx = 1;

    const VALID_STATUSES = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'];
    if (status && status !== 'ALL') {
      const upperStatus = String(status).toUpperCase().trim();
      if (VALID_STATUSES.includes(upperStatus)) {
        whereClauses.push(`status = $${idx}`);
        params.push(upperStatus);
        idx++;
      } else {
        whereClauses.push(`1 = 0`);
      }
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM "public"."contact_messages" ${whereStr}`,
      params
    );

    params.push(limit, offset);
    const dataRes = await query(
      `SELECT id, name, email, phone, subject, message, status, "replyMessage", "repliedAt", "createdAt", "updatedAt"
       FROM "public"."contact_messages"
       ${whereStr}
       ORDER BY "createdAt" DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return {
      total: countRes.rows[0]?.total || 0,
      messages: dataRes.rows,
      limit,
      offset,
    };
  }

  /**
   * Update message status (e.g. mark READ, REPLIED, ARCHIVED)
   */
  static async updateStatus(id, { status, replyMessage = null, repliedBy = null }) {
    const res = await query(
      `UPDATE "public"."contact_messages"
       SET status = COALESCE($1, status),
           "replyMessage" = COALESCE($2, "replyMessage"),
           "repliedBy" = COALESCE($3, "repliedBy"),
           "repliedAt" = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE "repliedAt" END,
           "updatedAt" = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, subject, message, status, "replyMessage", "repliedAt", "updatedAt"`,
      [status, replyMessage, repliedBy, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Subscribe an email address to the newsletter (Idempotent)
   */
  static async subscribeNewsletter(email) {
    const id = crypto.randomUUID();
    const cleanEmail = email.trim().toLowerCase();
    const res = await query(
      `INSERT INTO "public"."newsletter_subscribers" (id, email, "isActive", "subscribedAt", "updatedAt")
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE
       SET "isActive" = true, "updatedAt" = NOW()
       RETURNING id, email, "isActive", "subscribedAt"`,
      [id, cleanEmail]
    );
    return res.rows[0];
  }

  /**
   * Unsubscribe email
   */
  static async unsubscribeNewsletter(email) {
    const cleanEmail = email.trim().toLowerCase();
    const res = await query(
      `UPDATE "public"."newsletter_subscribers"
       SET "isActive" = false, "updatedAt" = NOW()
       WHERE email = $1
       RETURNING id, email, "isActive", "updatedAt"`,
      [cleanEmail]
    );
    return res.rows[0] || null;
  }
}
