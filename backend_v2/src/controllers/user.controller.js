import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { query } from '../config/database.js';

export class UserController {
  /**
   * GET /api/v1/users/profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      const payload = {
        ...user,
        user,
        profile: user.studentProfile || user.teacherProfile || null,
        studentProfile: user.studentProfile || null,
      };
      return sendSuccess(res, payload, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/users/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const updated = await UserService.updateProfile(req.user.id, req.body);
      const payload = {
        ...updated,
        user: updated,
        profile: updated.studentProfile || updated.teacherProfile || null,
        studentProfile: updated.studentProfile || null,
      };
      return sendSuccess(res, payload, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/users/sessions
   */
  static async getSessions(req, res, next) {
    try {
      const resData = await query(
        `SELECT id, "createdAt", "expiresAt", revoked 
         FROM "public"."refresh_tokens" 
         WHERE "userId" = $1 AND revoked = false AND "expiresAt" > NOW() 
         ORDER BY "createdAt" DESC LIMIT 10`,
        [req.user.id]
      );
      
      const sessions = resData.rows.length > 0 
        ? resData.rows.map((row, idx) => ({
            id: row.id,
            device: idx === 0 ? 'Current Browser Session (Active)' : 'Secondary Active Session',
            isCurrent: idx === 0,
            createdAt: row.createdAt
          }))
        : [{
            id: 'current-session',
            device: 'Current Web Session (Active)',
            isCurrent: true,
            createdAt: new Date().toISOString()
          }];

      return sendSuccess(res, { sessions }, 'Active sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/users/sessions/logout-all
   */
  static async logoutAllSessions(req, res, next) {
    try {
      await query(
        `UPDATE "public"."refresh_tokens" 
         SET revoked = true 
         WHERE "userId" = $1`,
        [req.user.id]
      );
      return sendSuccess(res, null, 'All other sessions invalidated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/users/students
   * Returns a list of all students (for enrollment purposes)
   */
  static async listStudents(req, res, next) {
    try {
      const { query: searchQuery } = req.query;
      
      let sql = `
        SELECT 
          u.id, 
          u.email, 
          u."firstName", 
          u."lastName", 
          u."avatarUrl", 
          sp."levelId",
          sp."learningAccess",
          sp."applicationStatus"
        FROM "public"."users" u
        INNER JOIN "public"."student_profiles" sp ON u.id = sp."userId"
        WHERE u.role = 'STUDENT'
          AND u.status = 'ACTIVE'
          AND sp."applicationStatus" = 'ACCEPTED'
      `;
      const params = [];

      if (searchQuery) {
        sql += ` AND (LOWER(u."firstName" || ' ' || u."lastName") LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1))`;
        params.push(`%${searchQuery}%`);
      }

      sql += ` ORDER BY u."lastName" ASC, u."firstName" ASC`;
      
      const { rows } = await query(sql, params);
      return sendSuccess(res, rows, 'Students retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
