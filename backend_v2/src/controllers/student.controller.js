import { sendSuccess, sendError } from '../utils/response.util.js';
import { UserModel } from '../models/user.model.js';
import { LevelCourseModel } from '../models/level_course.model.js';
import { OverrideModel } from '../models/override.model.js';
import { AccessService } from '../services/access.service.js';
import { query } from '../config/database.js';

export class StudentController {
  /**
   * Get all courses for a student, combined with their access status
   */
  static async getStudentCourses(req, res) {
    try {
      const studentId = req.params.id;
      
      // We can also allow 'me' instead of id
      const targetId = studentId === 'me' ? req.user.id : studentId;

      const profile = await UserModel.getStudentProfile(targetId);
      if (!profile) return sendError(res, 'Student profile not found', 404);

      // 1. Get primary level courses
      let levelCourses = [];
      if (profile.levelId) {
        levelCourses = await LevelCourseModel.findByLevelId(profile.levelId);
      }

      // 2. Get enrollments with full course details
      const enrollmentsRes = await query(
        `SELECT 
           e.id as "enrollmentId", e.status, e."enrolledAt",
           c.id as "courseId", c.title, c.description, c.price, c.currency,
           l.name as level,
           u."firstName", u."lastName"
         FROM "public"."enrollments" e
         JOIN "public"."courses" c ON e."courseId" = c.id
         LEFT JOIN "public"."level_courses" lc ON lc."courseId" = c.id
         LEFT JOIN "public"."levels" l ON lc."levelId" = l.id
         LEFT JOIN "public"."users" u ON c."teacherId" = u.id
         WHERE e."studentId" = $1`,
        [targetId]
      );
      
      const enrolled = enrollmentsRes.rows.map(row => ({
        id: row.enrollmentId,
        status: row.status,
        enrolledAt: row.enrolledAt,
        isExpired: false, // Compute if needed
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 0,
        course: {
          id: row.courseId,
          title: row.title,
          level: row.level || 'Unknown Level',
          description: row.description || '',
          price: row.price || 0,
          currency: row.currency || 'USD',
          teacher: {
            user: {
              firstName: row.firstName || 'Unknown',
              lastName: row.lastName || 'Instructor'
            }
          }
        }
      }));

      const enrolledCourseIds = new Set(enrolled.map(e => e.course.id));

      // 3. Get catalog (primary level courses + allowed overrides not enrolled)
      const catalog = [];
      
      for (const lc of levelCourses) {
        if (!enrolledCourseIds.has(lc.courseId)) {
          // get full course details
          const cRes = await query(
            `SELECT c.id, c.title, c.description, c.price, c.currency, u."firstName", u."lastName"
             FROM "public"."courses" c
             LEFT JOIN "public"."users" u ON c."teacherId" = u.id
             WHERE c.id = $1`,
            [lc.courseId]
          );
          if (cRes.rows.length > 0) {
            const row = cRes.rows[0];
            catalog.push({
              id: row.id,
              title: row.title,
              description: row.description || '',
              level: profile.level,
              currency: row.currency || 'USD',
              durationDays: 365,
              teacher: {
                user: {
                  firstName: row.firstName || 'Unknown',
                  lastName: row.lastName || 'Instructor'
                }
              },
              _count: { units: 0, enrollments: 0 }
            });
          }
        }
      }

      // Add overrides to catalog if allowed and not enrolled
      // 3. Get overrides
      const overrides = await OverrideModel.getAllStudentCourseOverrides(targetId);
      for (const o of overrides) {
        if (o.status === 'ALLOW' && !enrolledCourseIds.has(o.courseId)) {
          const cRes = await query(
            `SELECT c.id, c.title, c.description, c.price, c.currency, u."firstName", u."lastName"
             FROM "public"."courses" c
             LEFT JOIN "public"."users" u ON c."teacherId" = u.id
             WHERE c.id = $1`,
            [o.courseId]
          );
          if (cRes.rows.length > 0) {
            const row = cRes.rows[0];
            catalog.push({
              id: row.id,
              title: row.title,
              description: row.description || '',
              level: 'Special Access',
              currency: row.currency || 'USD',
              durationDays: 365,
              teacher: {
                user: {
                  firstName: row.firstName || 'Unknown',
                  lastName: row.lastName || 'Instructor'
                }
              },
              _count: { units: 0, enrollments: 0 }
            });
          }
        }
      }

      // 4. Return format matching frontend MyCourses and Catalog
      return sendSuccess(res, {
        enrolled,
        catalog,
        primaryLevel: profile.level || 'Unknown Level'
      });
    } catch (error) {
      console.error('Get Student Courses Error:', error);
      return sendError(res, 'Failed to fetch student courses', 500);
    }
  }

  /**
   * GET /api/v1/students/:id/course-access/:courseId
   * Resolves whether a student has access to a specific course
   */
  static async getCourseAccess(req, res, next) {
    try {
      const studentId = req.params.id === 'me' ? req.user.id : req.params.id;
      const courseId = req.params.courseId;
      
      const hasAccess = await AccessService.hasCourseAccess(studentId, courseId);
      
      return sendSuccess(res, { courseId, hasAccess }, 'Course access resolved');
    } catch (error) {
      next(error);
    }
  }
}
