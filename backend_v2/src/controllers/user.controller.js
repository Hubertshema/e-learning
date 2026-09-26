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
      return sendSuccess(res, user, 'Profile retrieved');
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
      return sendSuccess(res, updated, 'Profile updated successfully');
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
        SELECT u.id, u.email, u."firstName", u."lastName", u."avatarUrl", sp."levelId"
        FROM "public"."users" u
        LEFT JOIN "public"."student_profiles" sp ON u.id = sp."userId"
        WHERE u.role = 'STUDENT'
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
