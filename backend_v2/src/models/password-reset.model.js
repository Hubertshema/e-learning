import crypto from 'crypto';
import { query } from '../config/database.js';

export class PasswordResetModel {
  /**
   * Create and store a cryptographically secure password reset token
   * Valid for 1 hour
   */
  static async createToken(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean up any old unused tokens for this user
    await query(
      `DELETE FROM "public"."password_resets" 
       WHERE "userId" = $1 OR email = LOWER($2)`,
      [userId, email]
    );

    const res = await query(
      `INSERT INTO "public"."password_resets" 
         ("userId", email, token, "expiresAt", "createdAt")
       VALUES ($1, LOWER($2), $3, $4, NOW())
       RETURNING id, "userId", email, token, "expiresAt"`,
      [userId, email, token, expiresAt]
    );

    return res.rows[0];
  }

  /**
   * Find a valid, unexpired token
   */
  static async findValidToken(token) {
    if (!token) return null;
    const res = await query(
      `SELECT pr.id, pr."userId", pr.email, pr.token, pr."expiresAt", pr."usedAt",
              u."firstName", u."lastName"
       FROM "public"."password_resets" pr
       JOIN "public"."users" u ON u.id = pr."userId"
       WHERE pr.token = $1 
         AND pr."usedAt" IS NULL 
         AND pr."expiresAt" > NOW()
       LIMIT 1`,
      [token]
    );
    return res.rows[0] || null;
  }

  /**
   * Mark token as used
   */
  static async markUsed(id) {
    await query(
      `UPDATE "public"."password_resets"
       SET "usedAt" = NOW()
       WHERE id = $1`,
      [id]
    );
  }
}
