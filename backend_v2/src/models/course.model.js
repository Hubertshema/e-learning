import { query, parsePgArray } from '../config/database.js';
import crypto from 'crypto';

export class CourseModel {
  /**
   * Find published courses with filters
   */
  static async findPublishedCourses({ level, category, limit = 10, offset = 0 } = {}) {
    let whereConditions = [`c."isPublished" = true`];
    const params = [];
    let idx = 1;

    if (level) {
      whereConditions.push(`c.level = $${idx++}`);
      params.push(level);
    }
    if (category) {
      whereConditions.push(`c.category = $${idx++}`);
      params.push(category);
    }

    params.push(limit, offset);

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM "public"."courses" c WHERE ${whereConditions.join(' AND ')}`,
      params.slice(0, -2)
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const sql = `
      SELECT c.*, 
             u."firstName" AS "teacherFirstName", 
             u."lastName" AS "teacherLastName", 
             u."avatarUrl" AS "teacherAvatar",
             (SELECT COUNT(*) FROM "public"."units" un WHERE un."courseId" = c.id) AS "unitCount",
             (SELECT COUNT(*) FROM "public"."lessons" l JOIN "public"."units" un ON un.id = l."unitId" WHERE un."courseId" = c.id) AS "lessonCount",
             (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."courseId" = c.id) AS "enrollmentCount"
      FROM "public"."courses" c
      LEFT JOIN "public"."users" u ON u.id = c."teacherId"
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c."createdAt" DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const coursesRes = await query(sql, params);
    return { courses: coursesRes.rows, total };
  }

  /**
   * Find course by ID with detailed curriculum
   */
  static async findById(id) {
    const courseRes = await query(
      `SELECT c.*, 
              u."firstName" AS "teacherFirstName", 
              u."lastName" AS "teacherLastName", 
              u."avatarUrl" AS "teacherAvatar"
       FROM "public"."courses" c
       LEFT JOIN "public"."users" u ON u.id = c."teacherId"
       WHERE c.id = $1 
       LIMIT 1`,
      [id]
    );

    if (courseRes.rows.length === 0) return null;

    const course = courseRes.rows[0];

    // Fetch units and lessons
    const unitsRes = await query(
      `SELECT * FROM "public"."units" WHERE "courseId" = $1 ORDER BY "orderIndex" ASC`,
      [id]
    );

    const unitIds = unitsRes.rows.map((u) => u.id);
    let lessons = [];

    if (unitIds.length > 0) {
      const lessonsRes = await query(
        `SELECT * FROM "public"."lessons" WHERE "unitId" = ANY($1) ORDER BY "orderIndex" ASC`,
        [unitIds]
      );
      lessons = lessonsRes.rows;
    }

    course.units = unitsRes.rows.map((unit) => ({
      ...unit,
      lessons: lessons
        .filter((l) => l.unitId === unit.id)
        .map((lesson) => ({
          ...lesson,
          skills: parsePgArray(lesson.skills),
        })),
    }));

    return course;
  }

  /**
   * Find all courses for a teacher
   */
  static async findByTeacherId(teacherId) {
    const profileRes = await query(
      `SELECT id FROM "public"."teacher_profiles" WHERE id = $1 OR "userId" = $1 LIMIT 1`,
      [teacherId]
    );
    const teacherIds = profileRes.rows.length > 0 ? [teacherId, profileRes.rows[0].id] : [teacherId];

    const res = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM "public"."units" un WHERE un."courseId" = c.id) AS "unitCount",
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."courseId" = c.id) AS "enrollmentCount",
              (SELECT COUNT(*) FROM "public"."classes" cl WHERE cl."courseId" = c.id) AS "classCount"
       FROM "public"."courses" c
       WHERE c."teacherId" = ANY($1)
       ORDER BY c."createdAt" DESC`,
      [teacherIds]
    );
    return res.rows;
  }

  /**
   * Create course
   */
  static async create({ title, slug, description, summary, level, category, currency = 'USD', durationDays = 30, teacherId }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."courses"
        (id, title, slug, description, summary, level, category, currency, "durationDays", "isPublished", featured, "teacherId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, $10, NOW(), NOW())
       RETURNING *`,
      [id, title, slug, description, summary, level, category, currency, durationDays, teacherId]
    );
    return res.rows[0];
  }

  /**
   * Update course
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
      `UPDATE "public"."courses"
       SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }
}
