import { query } from '../config/database.js';

const FALLBACK_LEVELS = [
  { id: 1, name: 'Level 1', code: 'L1', description: 'Beginner Level', isActive: true },
  { id: 2, name: 'Level 2', code: 'L2', description: 'Intermediate Level', isActive: true },
  { id: 3, name: 'Level 3', code: 'L3', description: 'Advanced Level', isActive: true },
];

let cachedLevels = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class LevelModel {
  /**
   * Find all active levels (in-memory cached for instant responses)
   */
  static async findAll() {
    if (cachedLevels && (Date.now() - lastCacheTime < CACHE_TTL_MS)) {
      return cachedLevels;
    }

    try {
      const res = await query(
        `SELECT id, name, code, description, "isActive", "createdAt" 
         FROM "public"."levels" 
         WHERE "isActive" = true
         ORDER BY id ASC`
      );
      if (res.rows && res.rows.length > 0) {
        cachedLevels = res.rows;
        lastCacheTime = Date.now();
        return cachedLevels;
      }
    } catch (err) {
      console.warn('LevelModel.findAll database query error, using fallbacks:', err.message);
    }

    return cachedLevels || FALLBACK_LEVELS;
  }

  /**
   * Invalidate cache when levels change
   */
  static clearCache() {
    cachedLevels = null;
    lastCacheTime = 0;
  }

  /**
   * Find level by ID
   */
  static async findById(id) {
    if (cachedLevels) {
      const found = cachedLevels.find(l => String(l.id) === String(id));
      if (found) return found;
    }

    try {
      const res = await query(
        `SELECT id, name, code, description, "isActive", "createdAt" 
         FROM "public"."levels" 
         WHERE id = $1 LIMIT 1`,
        [id]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.warn('LevelModel.findById error:', err.message);
      return FALLBACK_LEVELS.find(l => String(l.id) === String(id)) || null;
    }
  }
}

