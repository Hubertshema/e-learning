import { LevelModel } from '../models/level.model.js';
import { LevelCourseModel } from '../models/level_course.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { query } from '../config/database.js';

export class LevelController {
  static async list(req, res) {
    try {
      const levels = await LevelModel.findAll();
      
      if (req.query.include === 'courses') {
        const enrichedLevels = [];
        for (const level of levels) {
          const courses = await LevelCourseModel.findByLevelId(level.id);
          // Also fetch student count for the level
          const studentRes = await query('SELECT COUNT(*) FROM "public"."student_profiles" WHERE "levelId" = $1', [level.id]);
          
          enrichedLevels.push({
            ...level,
            students: parseInt(studentRes.rows[0].count, 10),
            courses: courses.map(c => ({
              id: c.courseId,
              title: c.title,
              lessons: 0 // Mock for now or fetch actual lesson count if units/lessons table exists
            }))
          });
        }
        return sendSuccess(res, enrichedLevels);
      }
      
      return sendSuccess(res, levels);
    } catch (error) {
      console.error('Levels Error:', error);
      return sendError(res, 'Failed to fetch levels', 500);
    }
  }

  static async getById(req, res) {
    try {
      const level = await LevelModel.findById(req.params.id);
      if (!level) return sendError(res, 'Level not found', 404);
      return sendSuccess(res, level);
    } catch (error) {
      console.error('Level Error:', error);
      return sendError(res, 'Failed to fetch level', 500);
    }
  }

  static async getCourses(req, res) {
    try {
      const courses = await LevelCourseModel.findByLevelId(req.params.id);
      return sendSuccess(res, courses);
    } catch (error) {
      console.error('Level Courses Error:', error);
      return sendError(res, 'Failed to fetch level courses', 500);
    }
  }

  static async assignCourse(req, res) {
    try {
      const levelId = req.params.id;
      const { courseId, teacherId, maxStudents, isActive } = req.body;
      
      if (!courseId) return sendError(res, 'Course ID is required', 400);

      const assignment = await LevelCourseModel.assignCourseToLevel({
        levelId,
        courseId,
        teacherId,
        maxStudents,
        isActive
      });

      return sendSuccess(res, assignment, 'Course assigned to level successfully');
    } catch (error) {
      console.error('Assign Course Error:', error);
      return sendError(res, 'Failed to assign course to level', 500);
    }
  }

  static async updateCourseAssignment(req, res) {
    try {
      const levelCourseId = req.params.levelCourseId;
      const fields = req.body;
      
      const updated = await LevelCourseModel.updateAssignment(levelCourseId, fields);
      if (!updated) return sendError(res, 'Level-course assignment not found or no fields provided', 404);
      
      return sendSuccess(res, updated, 'Course assignment updated successfully');
    } catch (error) {
      console.error('Update Course Assignment Error:', error);
      return sendError(res, 'Failed to update course assignment', 500);
    }
  }

  static async removeCourse(req, res) {
    try {
      const levelId = req.params.id;
      const courseId = req.params.courseId;
      
      const removed = await LevelCourseModel.removeCourseFromLevel(levelId, courseId);
      if (!removed) return sendError(res, 'Course assignment not found', 404);
      
      return sendSuccess(res, null, 'Course removed from level successfully');
    } catch (error) {
      console.error('Remove Course Error:', error);
      return sendError(res, 'Failed to remove course from level', 500);
    }
  }

  /**
   * GET /api/v1/levels/:id/students
   * Get students enrolled in a level
   */
  static async getStudents(req, res) {
    try {
      const levelId = req.params.id;
      const { rows } = await query(
        `SELECT u.id, u.email, u."firstName", u."lastName", u."avatarUrl"
         FROM "public"."users" u
         JOIN "public"."student_profiles" sp ON u.id = sp."userId"
         WHERE sp."levelId" = $1
         ORDER BY u."lastName" ASC, u."firstName" ASC`,
        [levelId]
      );
      return sendSuccess(res, rows, 'Students retrieved successfully');
    } catch (error) {
      console.error('Get Level Students Error:', error);
      return sendError(res, 'Failed to get students for level', 500);
    }
  }

  /**
   * POST /api/v1/levels/:id/enroll
   * Enroll students to a level
   */
  static async enrollStudents(req, res) {
    try {
      const levelId = req.params.id;
      const { studentIds } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return sendError(res, 'studentIds array is required', 400);
      }

      // Check if level exists
      const level = await LevelModel.findById(levelId);
      if (!level) return sendError(res, 'Level not found', 404);

      // We only update users who actually have a student profile
      // In PostgreSQL we can do UPDATE ... WHERE "userId" = ANY($1)
      await query(
        `UPDATE "public"."student_profiles"
         SET "levelId" = $1, "updatedAt" = NOW()
         WHERE "userId" = ANY($2)`,
        [levelId, studentIds]
      );

      return sendSuccess(res, null, 'Students enrolled successfully');
    } catch (error) {
      console.error('Enroll Students Error:', error);
      return sendError(res, 'Failed to enroll students', 500);
    }
  }

  /**
   * DELETE /api/v1/levels/:id/students/:studentId
   * Unenroll a student from a level
   */
  static async unenrollStudent(req, res) {
    try {
      const levelId = req.params.id;
      const studentId = req.params.studentId;

      const result = await query(
        `UPDATE "public"."student_profiles"
         SET "levelId" = NULL, "updatedAt" = NOW()
         WHERE "userId" = $1 AND "levelId" = $2
         RETURNING id`,
        [studentId, levelId]
      );

      if (result.rowCount === 0) {
        return sendError(res, 'Student not found in this level', 404);
      }

      return sendSuccess(res, null, 'Student unenrolled successfully');
    } catch (error) {
      console.error('Unenroll Student Error:', error);
      return sendError(res, 'Failed to unenroll student', 500);
    }
  }
}
