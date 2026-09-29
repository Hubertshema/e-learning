import { query, pool, parsePgArray } from '../config/database.js';
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
  static async create({ title, slug, description, summary, level, category, currency = 'USD', durationDays = 30, published, isPublished, teacherId }) {
    const id = crypto.randomUUID();
    const finalPublished = published !== undefined ? Boolean(published) : (isPublished !== undefined ? Boolean(isPublished) : false);
    const finalSlug = slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-6)}`;
    
    // Resolve teacher_profile id if userId was passed
    let resolvedTeacherId = teacherId;
    if (teacherId) {
      const tpRes = await query(`SELECT id FROM "public"."teacher_profiles" WHERE id = $1 OR "userId" = $1 LIMIT 1`, [teacherId]);
      if (tpRes.rows[0]) {
        resolvedTeacherId = tpRes.rows[0].id;
      }
    }

    const res = await query(
      `INSERT INTO "public"."courses"
        (id, title, slug, description, summary, level, category, currency, "durationDays", "isPublished", featured, "teacherId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, NOW(), NOW())
       RETURNING *`,
      [id, title, finalSlug, description || '', summary || null, String(level || '1'), category || 'General English', currency, durationDays, finalPublished, resolvedTeacherId]
    );
    return res.rows[0];
  }

  /**
   * Toggle or set publish status
   */
  static async setPublishStatus(id, isPublished) {
    const res = await query(
      `UPDATE "public"."courses" 
       SET "isPublished" = $1, "updatedAt" = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [Boolean(isPublished), id]
    );
    return res.rows[0] || null;
  }

  /**
   * Update course
   */
  static async update(id, fields = {}) {
    const allowedCols = new Set([
      'title', 'slug', 'description', 'summary', 'level', 'category',
      'currency', 'durationDays', 'thumbnailUrl', 'isPublished', 'featured', 'teacherId'
    ]);

    const mapped = { ...fields };
    if (mapped.published !== undefined && mapped.isPublished === undefined) {
      mapped.isPublished = Boolean(mapped.published);
    }
    delete mapped.published;

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(mapped)) {
      if (allowedCols.has(key)) {
        setClauses.push(`"${key}" = $${idx}`);
        values.push(val);
        idx++;
      }
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

  /**
   * Cascade Delete course and all curriculum units, lessons, and dependencies
   */
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find all units and lessons for this course
      const unitsRes = await client.query(`SELECT id FROM "public"."units" WHERE "courseId" = $1`, [id]);
      const unitIds = unitsRes.rows.map(u => u.id);

      if (unitIds.length > 0) {
        const lessonsRes = await client.query(`SELECT id FROM "public"."lessons" WHERE "unitId" = ANY($1)`, [unitIds]);
        const lessonIds = lessonsRes.rows.map(l => l.id);

        if (lessonIds.length > 0) {
          const lessonTables = [
            'lesson_sections',
            'activities',
            'assignments',
            'quizzes',
            'progress',
            'student_lesson_overrides',
            'interactive_video_resources',
            'interactive_video_activities',
            'interactive_video_progress',
            'interactive_videos',
            'interactive_video_lessons'
          ];
          for (const tbl of lessonTables) {
            try {
              await client.query(`DELETE FROM "${tbl}" WHERE "lessonId" = ANY($1)`, [lessonIds]);
            } catch {}
          }
          await client.query(`DELETE FROM "public"."lessons" WHERE id = ANY($1)`, [lessonIds]);
        }
        await client.query(`DELETE FROM "public"."units" WHERE id = ANY($1)`, [unitIds]);
      }

      // 2. Delete course associations
      try {
        await client.query(`DELETE FROM "public"."enrollments" WHERE "courseId" = $1`, [id]);
        await client.query(`DELETE FROM "public"."level_courses" WHERE "courseId" = $1`, [id]);
        await client.query(`DELETE FROM "public"."classes" WHERE "courseId" = $1`, [id]);
      } catch {}

      // 3. Delete course
      const delCourse = await client.query(`DELETE FROM "public"."courses" WHERE id = $1 RETURNING *`, [id]);

      await client.query('COMMIT');
      return delCourse.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

