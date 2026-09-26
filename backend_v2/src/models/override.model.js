import { query } from '../config/database.js';

export class OverrideModel {
  /**
   * Find course override for a student
   */
  static async getStudentCourseOverride(studentId, courseId) {
    const res = await query(
      `SELECT * FROM "public"."student_course_overrides"
       WHERE "studentId" = $1 AND "courseId" = $2 LIMIT 1`,
      [studentId, courseId]
    );
    return res.rows[0] || null;
  }

  /**
   * Set course override
   */
  static async setStudentCourseOverride({ studentId, courseId, levelCourseId, status, reason, assignedBy }) {
    const res = await query(
      `INSERT INTO "public"."student_course_overrides" 
        ("studentId", "courseId", "levelCourseId", "status", "reason", "assignedBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("studentId", "courseId") 
       DO UPDATE SET 
         "status" = EXCLUDED."status",
         "reason" = EXCLUDED."reason",
         "levelCourseId" = EXCLUDED."levelCourseId",
         "assignedBy" = EXCLUDED."assignedBy",
         "updatedAt" = NOW()
       RETURNING *`,
      [studentId, courseId, levelCourseId, status, reason, assignedBy]
    );
    return res.rows[0];
  }

  /**
   * Find lesson override for a student
   */
  static async getStudentLessonOverride(studentId, lessonId) {
    const res = await query(
      `SELECT * FROM "public"."student_lesson_overrides"
       WHERE "studentId" = $1 AND "lessonId" = $2 LIMIT 1`,
      [studentId, lessonId]
    );
    return res.rows[0] || null;
  }

  /**
   * Set lesson override
   */
  static async setStudentLessonOverride({ studentId, lessonId, status, reason, assignedBy }) {
    const res = await query(
      `INSERT INTO "public"."student_lesson_overrides" 
        ("studentId", "lessonId", "status", "reason", "assignedBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("studentId", "lessonId") 
       DO UPDATE SET 
         "status" = EXCLUDED."status",
         "reason" = EXCLUDED."reason",
         "assignedBy" = EXCLUDED."assignedBy",
         "updatedAt" = NOW()
       RETURNING *`,
      [studentId, lessonId, status, reason, assignedBy]
    );
    return res.rows[0];
  }

  /**
   * Get all course overrides for a student
   */
  static async getAllStudentCourseOverrides(studentId) {
    const res = await query(
      `SELECT * FROM "public"."student_course_overrides" WHERE "studentId" = $1`,
      [studentId]
    );
    return res.rows;
  }

  /**
   * Get all lesson overrides for a student
   */
  static async getAllStudentLessonOverrides(studentId) {
    const res = await query(
      `SELECT * FROM "public"."student_lesson_overrides" WHERE "studentId" = $1`,
      [studentId]
    );
    return res.rows;
  }
}
