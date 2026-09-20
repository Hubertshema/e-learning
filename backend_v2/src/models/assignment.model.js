import { query, transaction } from '../config/database.js';
import crypto from 'crypto';

const VALID_SKILLS = new Set(['WRITING', 'SPEAKING', 'READING', 'LISTENING', 'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION']);

export class AssignmentModel {
  /**
   * Resolve both teacher_profile.id and users.id so ownership queries match
   * regardless of which id is stored on the course.
   */
  static async resolveTeacherIds(idOrUserId) {
    const profileRes = await query(
      `SELECT id, "userId" FROM "public"."teacher_profiles" WHERE id = $1 OR "userId" = $1 LIMIT 1`,
      [idOrUserId]
    );
    if (profileRes.rows.length > 0) {
      const p = profileRes.rows[0];
      return Array.from(new Set([idOrUserId, p.id, p.userId]));
    }
    return [idOrUserId];
  }

  /**
   * Get all assignments for a teacher (by their course ownership)
   */
  static async getByTeacherId(teacherId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);
    const res = await query(
      `SELECT
         a.id, a.title, a.description, a."dueDate", a."maxScore", a."skillType",
         a."lessonId", a."isPublished", a."createdAt",
         l.title AS "lessonTitle",
         un.title AS "unitTitle",
         c.id AS "courseId", c.title AS "courseTitle", c.level AS "courseLevel",
         (SELECT COUNT(*) FROM "public"."assignment_submissions" s WHERE s."assignmentId" = a.id) AS "submissionCount",
         (SELECT COUNT(*) FROM "public"."assignment_submissions" s WHERE s."assignmentId" = a.id AND s.status = 'GRADED') AS "gradedCount"
       FROM "public"."assignments" a
       JOIN "public"."lessons" l ON l.id = a."lessonId"
       JOIN "public"."units" un ON un.id = l."unitId"
       JOIN "public"."courses" c ON c.id = un."courseId"
       WHERE c."teacherId" = ANY($1)
       ORDER BY a."createdAt" DESC`,
      [teacherIds]
    );

    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate,
      maxScore: Number(row.maxScore),
      skillType: row.skillType || 'WRITING',
      isPublished: row.isPublished,
      lessonId: row.lessonId,
      createdAt: row.createdAt,
      lesson: { title: row.lessonTitle },
      course: {
        id: row.courseId,
        title: row.courseTitle,
        level: row.courseLevel,
      },
      _count: {
        submissions: parseInt(row.submissionCount || 0, 10),
        graded: parseInt(row.gradedCount || 0, 10),
      },
    }));
  }

  /**
   * Get single assignment by ID
   */
  static async getById(id) {
    const res = await query(
      `SELECT
         a.id, a.title, a.description, a."dueDate", a."maxScore", a."skillType",
         a."lessonId", a."isPublished", a."createdAt",
         l.title AS "lessonTitle",
         un.title AS "unitTitle",
         c.id AS "courseId", c.title AS "courseTitle", c.level AS "courseLevel"
       FROM "public"."assignments" a
       JOIN "public"."lessons" l ON l.id = a."lessonId"
       JOIN "public"."units" un ON un.id = l."unitId"
       JOIN "public"."courses" c ON c.id = un."courseId"
       WHERE a.id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      maxScore: Number(row.maxScore),
      skillType: row.skillType || 'WRITING',
      lesson: { title: row.lessonTitle },
      course: { id: row.courseId, title: row.courseTitle, level: row.courseLevel },
    };
  }

  /**
   * Create a new assignment linked to a lesson
   */
  static async create({ teacherId, lessonId, title, description, dueDate, maxScore = 100, skillType = 'WRITING' }) {
    const id = crypto.randomUUID();
    const skill = VALID_SKILLS.has(String(skillType).toUpperCase()) ? String(skillType).toUpperCase() : 'WRITING';

    const res = await query(
      `INSERT INTO "public"."assignments"
         (id, "lessonId", title, description, "dueDate", "maxScore", "skillType", "isPublished", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING *`,
      [id, lessonId, title, description || '', dueDate, Number(maxScore) || 100, skill]
    );

    return res.rows[0];
  }

  /**
   * Update an existing assignment
   */
  static async update(id, { title, description, dueDate, maxScore, skillType, isPublished }) {
    const res = await query(
      `UPDATE "public"."assignments"
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           "dueDate" = COALESCE($3, "dueDate"),
           "maxScore" = COALESCE($4, "maxScore"),
           "skillType" = COALESCE($5, "skillType"),
           "isPublished" = COALESCE($6, "isPublished"),
           "updatedAt" = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, dueDate, maxScore ? Number(maxScore) : null, skillType, isPublished, id]
    );
    if (res.rows.length === 0) throw new Error(`Assignment with ID "${id}" not found.`);
    return res.rows[0];
  }

  /**
   * Delete an assignment (cascades to submissions)
   */
  static async delete(id) {
    return await transaction(async (client) => {
      await client.query(`DELETE FROM "public"."assignment_submissions" WHERE "assignmentId" = $1`, [id]);
      const res = await client.query(`DELETE FROM "public"."assignments" WHERE id = $1 RETURNING *`, [id]);
      if (res.rows.length === 0) throw new Error(`Assignment with ID "${id}" not found.`);
      return res.rows[0];
    });
  }

  /**
   * Get all submissions for an assignment
   */
  static async getSubmissions(assignmentId) {
    const res = await query(
      `SELECT
         s.id, s.content, s."attachmentUrl", s.score, s.feedback, s.status,
         s."submittedAt", s."gradedAt",
         u.id AS "studentId", u."firstName", u."lastName", u.email, u."avatarUrl"
       FROM "public"."assignment_submissions" s
       JOIN "public"."users" u ON u.id = s."studentId"
       WHERE s."assignmentId" = $1
       ORDER BY s."submittedAt" DESC`,
      [assignmentId]
    );

    return res.rows.map((row) => ({
      id: row.id,
      content: row.content,
      fileUrl: row.attachmentUrl,   // alias for frontend compatibility
      attachmentUrl: row.attachmentUrl,
      score: row.score ? Number(row.score) : null,
      feedback: row.feedback,
      status: row.status,
      submittedAt: row.submittedAt,
      gradedAt: row.gradedAt,
      student: {
        id: row.studentId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        avatarUrl: row.avatarUrl,
      },
    }));
  }

  /**
   * Grade a student submission
   */
  static async gradeSubmission(submissionId, { score, feedback }) {
    const res = await query(
      `UPDATE "public"."assignment_submissions"
       SET score = $1,
           feedback = $2,
           status = 'GRADED',
           "gradedAt" = NOW(),
           "updatedAt" = NOW()
       WHERE id = $3
       RETURNING *`,
      [Number(score), feedback || '', submissionId]
    );
    if (res.rows.length === 0) throw new Error(`Submission with ID "${submissionId}" not found.`);
    return res.rows[0];
  }

  /**
   * Get all lessons available for a teacher (for assignment creation dropdown)
   */
  static async getTeacherLessons(teacherId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);
    const res = await query(
      `SELECT l.id, l.title, un.title AS "unitTitle", c.id AS "courseId", c.title AS "courseTitle", c.level
       FROM "public"."lessons" l
       JOIN "public"."units" un ON un.id = l."unitId"
       JOIN "public"."courses" c ON c.id = un."courseId"
       WHERE c."teacherId" = ANY($1)
       ORDER BY c.title ASC, un."orderIndex" ASC NULLS LAST, l."orderIndex" ASC NULLS LAST`,
      [teacherIds]
    );
    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      unitTitle: row.unitTitle,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      level: row.level,
    }));
  }
}
