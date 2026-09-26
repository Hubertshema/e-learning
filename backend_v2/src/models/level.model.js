import { query } from '../config/database.js';

export class LevelModel {
  /**
   * Find all active levels
   */
  static async findAll() {
    const res = await query(
      `SELECT id, name, code, description, "isActive", "createdAt" 
       FROM "public"."levels" 
       WHERE "isActive" = true
       ORDER BY id ASC`
    );
    return res.rows;
  }

  /**
   * Find level by ID
   */
  static async findById(id) {
    const res = await query(
      `SELECT id, name, code, description, "isActive", "createdAt" 
       FROM "public"."levels" 
       WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }
}
