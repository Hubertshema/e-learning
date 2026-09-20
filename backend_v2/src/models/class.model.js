import { query } from '../config/database.js';
import crypto from 'crypto';

export class ClassModel {
  /**
   * Find classes by Teacher ID
   */
  static async findByTeacherId(teacherId) {
    const res = await query(
      `SELECT cl.*,
              c.title AS "courseTitle",
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."classId" = cl.id) AS "enrolledCount"
       FROM "public"."classes" cl
       LEFT JOIN "public"."courses" c ON c.id = cl."courseId"
       WHERE cl."teacherId" = $1
       ORDER BY cl."createdAt" DESC`,
      [teacherId]
    );
    return res.rows;
  }

  /**
   * Find class by ID with enrolled students
   */
  static async findById(id) {
    const classRes = await query(
      `SELECT cl.*,
              c.title AS "courseTitle",
              u."firstName" AS "teacherFirstName",
              u."lastName" AS "teacherLastName"
       FROM "public"."classes" cl
       LEFT JOIN "public"."courses" c ON c.id = cl."courseId"
       LEFT JOIN "public"."users" u ON u.id = cl."teacherId"
       WHERE cl.id = $1
       LIMIT 1`,
      [id]
    );

    if (classRes.rows.length === 0) return null;
    const classData = classRes.rows[0];

    const enrollmentsRes = await query(
      `SELECT e.*,
              s."firstName" AS "studentFirstName",
              s."lastName" AS "studentLastName",
              s.email AS "studentEmail",
              s."avatarUrl" AS "studentAvatar"
       FROM "public"."enrollments" e
       JOIN "public"."users" s ON s.id = e."studentId"
       WHERE e."classId" = $1
       ORDER BY e."enrolledAt" DESC`,
      [id]
    );

    classData.students = enrollmentsRes.rows;
    return classData;
  }

  /**
   * Create a new class
   */
  static async create({ name, code, description, courseId, teacherId, startDate, endDate, maxStudents = 30 }) {
    const id = crypto.randomUUID();
    const classCode = code || `NS${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await query(
      `INSERT INTO "public"."classes"
        (id, name, code, description, "courseId", "teacherId", "startDate", "endDate", "maxStudents", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
       RETURNING *`,
      [id, name, classCode, description, courseId, teacherId, startDate, endDate, maxStudents]
    );
    return res.rows[0];
  }

  /**
   * Find classes where student is enrolled
   */
  static async findByStudentId(studentId) {
    const res = await query(
      `SELECT cl.*,
              c.title AS "courseTitle",
              t."firstName" AS "teacherFirstName",
              t."lastName" AS "teacherLastName",
              e.status AS "enrollmentStatus",
              e."expiresAt" AS "enrollmentExpiresAt"
       FROM "public"."enrollments" e
       JOIN "public"."classes" cl ON cl.id = e."classId"
       JOIN "public"."courses" c ON c.id = cl."courseId"
       JOIN "public"."users" t ON t.id = cl."teacherId"
       WHERE e."studentId" = $1
       ORDER BY cl."startDate" DESC`,
      [studentId]
    );
    return res.rows;
  }
}
