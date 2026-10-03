import { query } from '../config/database.js';
import crypto from 'crypto';

export class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const res = await query(
      `SELECT id, email, "passwordHash", "firstName", "lastName", role, status, "isVerified", 
              "avatarUrl", phone, country, city, timezone, "preferredLanguage", "activeSessionId", "createdAt"
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
              "avatarUrl", phone, country, city, timezone, "preferredLanguage", "activeSessionId", "createdAt"
       FROM "public"."users" 
       WHERE id = $1 
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Find user with passwordHash by ID (internal security operations)
   */
  static async findWithPasswordById(id) {
    const res = await query(
      `SELECT id, email, "passwordHash", "firstName", "lastName", role, status, "isVerified", 
              "avatarUrl", phone, country, city, timezone, "preferredLanguage", "activeSessionId", "createdAt"
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
   * Revoke ALL refresh tokens for user
   */
  static async revokeAllRefreshTokens(userId) {
    await query(
      `UPDATE "public"."refresh_tokens" 
       SET revoked = true 
       WHERE "userId" = $1`,
      [userId]
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
    let res = await query(
      `SELECT sp.*, 
              l.id AS "levelId", l.name AS "levelName", l.code AS "levelCode"
       FROM "public"."student_profiles" sp
       LEFT JOIN "public"."levels" l ON l.id = sp."levelId"
       WHERE sp."userId" = $1 LIMIT 1`,
      [userId]
    );
    
    if (!res.rows[0]) {
      try {
        const u = await query(`SELECT id FROM "public"."users" WHERE id = $1 LIMIT 1`, [userId]);
        if (u.rows[0]) {
          const newId = crypto.randomUUID ? crypto.randomUUID() : `sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          await query(
            `INSERT INTO "public"."student_profiles" (id, "userId", "createdAt", "updatedAt")
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [newId, userId]
          );
          res = await query(
            `SELECT sp.*, 
                    l.id AS "levelId", l.name AS "levelName", l.code AS "levelCode"
             FROM "public"."student_profiles" sp
             LEFT JOIN "public"."levels" l ON l.id = sp."levelId"
             WHERE sp."userId" = $1 LIMIT 1`,
            [userId]
          );
        }
      } catch (e) {
        // Fallback
      }
    }

    if (!res.rows[0]) return null;
    
    const profile = res.rows[0];
    if (profile.levelId) {
      profile.level = {
        id: profile.levelId,
        name: profile.levelName,
        code: profile.levelCode
      };
      delete profile.levelName;
      delete profile.levelCode;
    }
    return profile;
  }

  /**
   * Update student profile fields
   */
  static async updateStudentProfile(userId, fields = {}) {
    const allowed = ['nativeLanguage', 'targetLevel', 'learningGoals', 'preferredSchedule', 'bio', 'targetSkills'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === 'learningGoals' || key === 'targetSkills') {
          const arr = Array.isArray(fields[key])
            ? fields[key].filter(item => typeof item === 'string' && item.trim().length > 0)
            : (typeof fields[key] === 'string' && fields[key] ? [fields[key]] : []);
          setClauses.push(`"${key}" = $${idx}::text[]`);
          values.push(arr);
        } else if (key === 'targetLevel') {
          const validLevels = ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          if (validLevels.includes(fields[key])) {
            setClauses.push(`"${key}" = $${idx}`);
            values.push(fields[key]);
          }
        } else {
          setClauses.push(`"${key}" = $${idx}`);
          values.push(fields[key]);
        }
        idx++;
      }
    }

    // Ensure student_profiles row exists
    const check = await query(`SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1`, [userId]);
    if (check.rows.length === 0) {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO "public"."student_profiles" (id, "userId", "currentLevel", "createdAt", "updatedAt")
         VALUES ($1, $2, 'B1', NOW(), NOW())`,
        [id, userId]
      );
    }

    if (setClauses.length > 0) {
      setClauses.push(`"updatedAt" = NOW()`);
      values.push(userId);

      await query(
        `UPDATE "public"."student_profiles"
         SET ${setClauses.join(', ')}
         WHERE "userId" = $${values.length}`,
        values
      );
    }

    return this.getStudentProfile(userId);
  }

  /**
   * Update teacher profile fields
   */
  static async updateTeacherProfile(userId, fields = {}) {
    const allowed = ['whatsapp', 'supportEmail', 'bio'];
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setClauses.push(`"${key}" = $${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }

    // Ensure teacher_profiles row exists
    const check = await query(`SELECT id FROM "public"."teacher_profiles" WHERE "userId" = $1 LIMIT 1`, [userId]);
    if (check.rows.length === 0) {
      const id = crypto.randomUUID();
      await query(
        `INSERT INTO "public"."teacher_profiles" (id, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())`,
        [id, userId]
      );
    }

    if (setClauses.length > 0) {
      setClauses.push(`"updatedAt" = NOW()`);
      values.push(userId);

      await query(
        `UPDATE "public"."teacher_profiles"
         SET ${setClauses.join(', ')}
         WHERE "userId" = $${values.length}`,
        values
      );
    }

    return this.getTeacherProfile(userId);
  }
}
