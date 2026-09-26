import { query } from '../config/database.js';

export class LevelCourseModel {
  /**
   * Find all courses for a specific level
   */
  static async findByLevelId(levelId) {
    const res = await query(
      `SELECT lc.id AS "levelCourseId", lc."levelId", lc."maxStudents", lc."isActive", 
              c.id AS "courseId", c.title, c.slug, c.summary, c.category, c."durationDays",
              u."firstName" AS "teacherFirstName", u."lastName" AS "teacherLastName",
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."levelCourseId" = lc.id) AS "enrolledCount"
       FROM "public"."level_courses" lc
       JOIN "public"."courses" c ON c.id = lc."courseId"
       LEFT JOIN "public"."users" u ON u.id = lc."teacherId"
       WHERE lc."levelId" = $1 AND lc."isActive" = true
       ORDER BY c.title ASC`,
      [levelId]
    );
    return res.rows;
  }

  /**
   * Find specific level course offering by courseId and levelId
   */
  static async findByLevelAndCourse(levelId, courseId) {
    const res = await query(
      `SELECT lc.*,
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."levelCourseId" = lc.id) AS "enrolledCount"
       FROM "public"."level_courses" lc
       WHERE lc."levelId" = $1 AND lc."courseId" = $2 LIMIT 1`,
      [levelId, courseId]
    );
    return res.rows[0] || null;
  }

  /**
   * Assign a course to a level
   */
  static async assignCourseToLevel({ levelId, courseId, teacherId = null, maxStudents = 30, isActive = true }) {
    const res = await query(
      `INSERT INTO "public"."level_courses" 
        ("levelId", "courseId", "teacherId", "maxStudents", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("levelId", "courseId") 
       DO UPDATE SET 
         "teacherId" = EXCLUDED."teacherId",
         "maxStudents" = EXCLUDED."maxStudents",
         "isActive" = EXCLUDED."isActive",
         "updatedAt" = NOW()
       RETURNING *`,
      [levelId, courseId, teacherId, maxStudents, isActive]
    );
    return res.rows[0];
  }

  /**
   * Update a level_course assignment
   */
  static async updateAssignment(levelCourseId, fields = {}) {
    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(fields)) {
      setClauses.push(`"${key}" = $${idx}`);
      values.push(val);
      idx++;
    }

    if (setClauses.length === 0) return null;

    setClauses.push(`"updatedAt" = NOW()`);
    values.push(levelCourseId);

    const res = await query(
      `UPDATE "public"."level_courses"
       SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  /**
   * Remove a course from a level
   */
  static async removeCourseFromLevel(levelId, courseId) {
    const res = await query(
      `DELETE FROM "public"."level_courses"
       WHERE "levelId" = $1 AND "courseId" = $2
       RETURNING id`,
      [levelId, courseId]
    );
    return res.rows.length > 0;
  }
}

