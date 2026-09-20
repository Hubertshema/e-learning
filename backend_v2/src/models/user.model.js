import { query } from '../config/database.js';
import crypto from 'crypto';

export class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const res = await query(
      `SELECT id, email, "passwordHash", "firstName", "lastName", role, status, "isVerified", 
              "avatarUrl", phone, country, city, timezone, "preferredLanguage", "createdAt"
       FROM "public"."users" 
       WHERE LOWER(email) = LOWER($1) 
       LIMIT 1`,
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const res = await query(
      `SELECT id, email, "firstName", "lastName", role, status, "isVerified", 
              "avatarUrl", phone, country, city, timezone, "preferredLanguage", "createdAt"
       FROM "public"."users" 
       WHERE id = $1 
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new user
   */
  static async create({ email, passwordHash, firstName, lastName, role = 'STUDENT' }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."users" 
        (id, email, "passwordHash", "firstName", "lastName", role, status, "isVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', false, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role, status, "isVerified", "createdAt"`,
      [id, email, passwordHash, firstName, lastName, role]
    );
    return res.rows[0];
  }

  /**
   * Update user details
   */
  static async update(id, fields = {}) {
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(fields)) {
      setClauses.push(`"${key}" = $${idx}`);
      values.push(val);
      idx++;
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push(`"updatedAt" = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE "public"."users"
       SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING id, email, "firstName", "lastName", role, status, "avatarUrl", "createdAt", "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }

  /**
   * Save refresh token hash
   */
  static async saveRefreshToken(userId, tokenHash, expiresAt) {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO "public"."refresh_tokens" (id, "tokenHash", "userId", "expiresAt", revoked, "createdAt")
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [id, tokenHash, userId, expiresAt]
    );
  }

  /**
   * Find refresh token
   */
  static async findRefreshToken(tokenHash) {
    const res = await query(
      `SELECT id, "tokenHash", "userId", "expiresAt", revoked 
       FROM "public"."refresh_tokens" 
       WHERE "tokenHash" = $1 AND revoked = false AND "expiresAt" > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  /**
   * Revoke/Delete refresh token
   */
  static async revokeRefreshToken(tokenHash) {
    await query(
      `UPDATE "public"."refresh_tokens" 
       SET revoked = true 
       WHERE "tokenHash" = $1`,
      [tokenHash]
    );
  }

  /**
   * Get teacher profile
   */
  static async getTeacherProfile(userId) {
    const res = await query(
      `SELECT * FROM "public"."teacher_profiles" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Get student profile
   */
  static async getStudentProfile(userId) {
    const res = await query(
      `SELECT * FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0] || null;
  }
}
