import { query } from '../config/database.js';

export class AccessService {
  /**
   * Determine if a student can access a course.
   * 
   * Logic:
   * 1. Check if there's a specific RESTRICT override -> Deny.
   * 2. Check if there's a specific ALLOW override -> Allow.
   * 3. Check if the student is explicitly enrolled in the course.
   *    (If enrolled, they have access).
   * 4. Otherwise, Deny.
   * 
   * @param {string} studentId 
   * @param {string} courseId 
   */
  static async getStudentCourseAccess(studentId, courseId) {
    // 1. Check Overrides
    const overrideRes = await query(
      `SELECT status, reason FROM "public"."student_course_overrides" 
       WHERE "studentId" = $1 AND "courseId" = $2 LIMIT 1`,
      [studentId, courseId]
    );
    
    if (overrideRes.rows.length > 0) {
      const override = overrideRes.rows[0];
      if (override.status === 'RESTRICT') {
        return { isAccessible: false, accessType: 'RESTRICTED', reason: override.reason };
      }
      if (override.status === 'ALLOW') {
        return { isAccessible: true, accessType: 'ADDITIONAL', reason: override.reason };
      }
    }

    // 2. Check Enrollment
    const enrollRes = await query(
      `SELECT status FROM "public"."enrollments" 
       WHERE "studentId" = $1 AND "courseId" = $2 LIMIT 1`,
      [studentId, courseId]
    );

    if (enrollRes.rows.length > 0) {
      const enrollment = enrollRes.rows[0];
      if (enrollment.status === 'ACTIVE') {
        // Technically it's DEFAULT if it's in their level, but we just call it ENROLLED here.
        return { isAccessible: true, accessType: 'DEFAULT', reason: 'Enrolled in course' };
      }
    }

    return { isAccessible: false, accessType: 'NONE', reason: 'Not enrolled and no access override provided' };
  }

  /**
   * Determine if a student can access a lesson.
   * 
   * Logic:
   * 1. Check parent course access. If denied -> Deny.
   * 2. Check if there's a specific lesson RESTRICT override -> Deny.
   * 3. Check if there's a specific lesson ALLOW override -> Allow.
   * 4. Otherwise, inherit course access -> Allow.
   * 
   * @param {string} studentId 
   * @param {string} lessonId 
   * @param {string} courseId 
   */
  static async getStudentLessonAccess(studentId, lessonId, courseId) {
    // 1. If courseId is not provided, we need to find it from the lesson -> unit -> course hierarchy
    if (!courseId) {
      const lessonRes = await query(
        `SELECT u."courseId" 
         FROM "public"."lessons" l
         JOIN "public"."units" u ON u.id = l."unitId"
         WHERE l.id = $1 LIMIT 1`,
        [lessonId]
      );
      if (lessonRes.rows.length === 0) {
        return { isAccessible: false, accessStatus: 'NOT_FOUND', reason: 'Lesson does not exist' };
      }
      courseId = lessonRes.rows[0].courseId;
    }

    // 2. Check Course Access
    const courseAccess = await this.getStudentCourseAccess(studentId, courseId);
    if (!courseAccess.isAccessible) {
      return { isAccessible: false, accessStatus: 'RESTRICTED_BY_COURSE', reason: 'No access to parent course' };
    }

    // 3. Check Lesson Overrides
    const overrideRes = await query(
      `SELECT status, reason FROM "public"."student_lesson_overrides" 
       WHERE "studentId" = $1 AND "lessonId" = $2 LIMIT 1`,
      [studentId, lessonId]
    );

    if (overrideRes.rows.length > 0) {
      const override = overrideRes.rows[0];
      if (override.status === 'RESTRICT') {
        return { isAccessible: false, accessStatus: 'RESTRICTED', reason: override.reason || 'Individually restricted' };
      }
      if (override.status === 'ALLOW') {
        return { isAccessible: true, accessStatus: 'ALLOWED', reason: override.reason || 'Individually allowed' };
      }
    }

    // 4. Inherit Course Access
    return { isAccessible: true, accessStatus: 'INHERITED', reason: 'Access inherited from course' };
  }
}
