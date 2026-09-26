import { CourseModel } from '../models/course.model.js';

export class CourseService {
  /**
   * List published courses
   */
  static async listCourses(query = {}) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(query.limit || '12', 10)));
    const offset = (page - 1) * limit;

    const { courses, total } = await CourseModel.findPublishedCourses({
      level: query.level,
      category: query.category,
      limit,
      offset,
    });

    return { courses, total, page, limit };
  }

  /**
   * Get single course details
   */
  static async getCourseDetails(courseId) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      const error = new Error('Course not found');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }
    return course;
  }

  /**
   * Get courses taught by teacher
   */
  static async getTeacherCourses(teacherId) {
    return CourseModel.findByTeacherId(teacherId);
  }

  /**
   * Create course
   */
  static async createCourse(teacherId, data) {
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    return CourseModel.create({
      ...data,
      slug,
      teacherId,
    });
  }

  /**
   * Enroll a student in a course (transactional)
   */
  static async enrollStudent(studentId, courseId) {
    const { transaction } = await import('../config/database.js');
    
    return transaction(async (client) => {
      // 1. Check if already enrolled
      const existing = await client.query(
        `SELECT id FROM "public"."enrollments" WHERE "studentId" = $1 AND "courseId" = $2`,
        [studentId, courseId]
      );
      if (existing.rows.length > 0) {
        const error = new Error('Already enrolled in this course');
        error.statusCode = 400;
        throw error;
      }

      // 2. We need to find the level_courses record to check capacity.
      // If a course is offered in multiple levels, we assume they enroll in the one matching their primary level,
      // or we just pick the primary one. If levelCourseId is needed, we should look it up.
      // For now, let's just find ANY active level_course offering for this course to check capacity.
      // Better: check against all offerings or a specific one. We'll pick the first active one.
      const offeringRes = await client.query(
        `SELECT id, "maxStudents" FROM "public"."level_courses" 
         WHERE "courseId" = $1 AND "isActive" = true LIMIT 1 FOR UPDATE`,
        [courseId]
      );

      let levelCourseId = null;
      if (offeringRes.rows.length > 0) {
        const offering = offeringRes.rows[0];
        levelCourseId = offering.id;
        
        // 3. Check capacity
        if (offering.maxStudents) {
          const countRes = await client.query(
            `SELECT COUNT(*) FROM "public"."enrollments" WHERE "levelCourseId" = $1`,
            [levelCourseId]
          );
          const currentCount = parseInt(countRes.rows[0].count, 10);
          if (currentCount >= offering.maxStudents) {
            const error = new Error('Course enrollment is full');
            error.statusCode = 400;
            throw error;
          }
        }
      }

      // 4. Enroll
      const enrollId = crypto.randomUUID();
      const res = await client.query(
        `INSERT INTO "public"."enrollments" 
         (id, "studentId", "courseId", "levelCourseId", "status", "enrolledAt")
         VALUES ($1, $2, $3, $4, 'ACTIVE', NOW())
         RETURNING *`,
        [enrollId, studentId, courseId, levelCourseId]
      );

      return res.rows[0];
    });
  }

  /**
   * Unenroll a student from a course
   */
  static async unenrollStudent(studentId, courseId) {
    const { query } = await import('../config/database.js');
    await query(
      `DELETE FROM "public"."enrollments" WHERE "studentId" = $1 AND "courseId" = $2`,
      [studentId, courseId]
    );
  }

  /**
   * Get all students enrolled in a course
   */
  static async getCourseStudents(courseId) {
    const { query } = await import('../config/database.js');
    const res = await query(
      `SELECT u.id, u.name, u.email, u.role, e."enrolledAt", e.status
       FROM "public"."enrollments" e
       JOIN "public"."users" u ON e."studentId" = u.id
       WHERE e."courseId" = $1
       ORDER BY e."enrolledAt" DESC`,
      [courseId]
    );
    return res.rows;
  }
}
