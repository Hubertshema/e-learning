import { LevelModel } from '../models/level.model.js';
import { LevelCourseModel } from '../models/level_course.model.js';
import { AdmissionModel } from '../models/admission.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { query } from '../config/database.js';
import crypto from 'crypto';

export class LevelController {
  static async list(req, res) {
    try {
      const levels = await LevelModel.findAll();
      
      if (req.query.include === 'courses') {
        const enrichedLevels = [];
        for (const level of levels) {
          // Fetch only the courses properly assigned to this level in level_courses
          const courses = await LevelCourseModel.findByLevelId(level.id);

          // Count UNIQUE students whose profile levelId matches this level exactly.
          // Do NOT use lc.levelId or c.level — those overcounted when the same course
          // appeared under multiple levels in the old corrupted level_courses data.
          const studentRes = await query(
            `SELECT COUNT(DISTINCT sp.id)
             FROM "public"."student_profiles" sp
             WHERE sp."levelId" = $1`,
            [level.id]
          );

          const enrichedCourses = await Promise.all(
            courses.map(async (c) => {
              const lessonsRes = await query(
                `SELECT l.id, l.title, l.skill, l."estimatedMinutes", l."orderIndex", un.title as "unitTitle"
                 FROM "public"."lessons" l
                 JOIN "public"."units" un ON un.id = l."unitId"
                 WHERE un."courseId" = $1
                 ORDER BY un."orderIndex" ASC, l."orderIndex" ASC`,
                [c.courseId]
              );
              return {
                id: c.courseId,
                title: c.title,
                level: c.level,
                summary: c.summary,
                lessons: lessonsRes.rows.length,
                lessonsList: lessonsRes.rows,
              };
            })
          );

          enrichedLevels.push({
            ...level,
            students: parseInt(studentRes.rows[0].count, 10),
            courses: enrichedCourses,
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
   * Get students enrolled in a level (directly or through courses assigned to this level)
   */
  static async getStudents(req, res) {
    try {
      const levelId = req.params.id;
      const parsedLevelId = parseInt(levelId, 10);
      const { rows } = await query(
        `SELECT DISTINCT u.id, u.email, u."firstName", u."lastName", u."avatarUrl"
         FROM "public"."users" u
         JOIN "public"."student_profiles" sp ON u.id = sp."userId"
         WHERE sp."levelId" = $1
         ORDER BY u."lastName" ASC, u."firstName" ASC`,
        [isNaN(parsedLevelId) ? levelId : parsedLevelId]
      );
      return sendSuccess(res, rows, 'Students retrieved successfully');
    } catch (error) {
      console.error('Get Level Students Error:', error);
      return sendError(res, 'Failed to get students for level', 500);
    }
  }

  /**
   * POST /api/v1/levels/:id/enroll
   * Enroll students to a level and assign level curriculum courses
   */
  static async enrollStudents(req, res) {
    try {
      const levelId = req.params.id;
      const { studentIds, studentId } = req.body;

      const rawStudentIds = Array.isArray(studentIds)
        ? studentIds
        : (studentId ? [studentId] : []);

      if (rawStudentIds.length === 0) {
        return sendError(res, 'studentIds array is required', 400);
      }

      // Check if level exists
      const level = await LevelModel.findById(levelId);
      if (!level) return sendError(res, 'Level not found', 404);

      const parsedLevelId = parseInt(levelId, 10);

      // Fetch profiles matching either userId or profile id
      const profilesRes = await query(
        `SELECT id, "userId", "levelId", "learningAccess"
         FROM "public"."student_profiles" 
         WHERE "userId" = ANY($1) OR id = ANY($1)`,
        [rawStudentIds]
      );

      if (profilesRes.rows.length === 0) {
        return sendError(res, 'No student profiles found for the provided IDs', 404);
      }

      const profileIds = profilesRes.rows.map(r => r.id);

      // Update student profiles
      await query(
        `UPDATE "public"."student_profiles"
         SET "levelId" = $1, "updatedAt" = NOW()
         WHERE id = ANY($2)`,
        [parsedLevelId, profileIds]
      );

      // Enroll students in all courses belonging to this level and record status audit
      const changedBy = req.user?.id || 'SYSTEM';
      for (const profile of profilesRes.rows) {
        try {
          await AdmissionModel.enrollStudentInLevelCourses(profile.userId, parsedLevelId);
        } catch (courseErr) {
          console.warn(`Failed to enroll student ${profile.userId} in level courses:`, courseErr.message);
        }

        // Record audit if level changed
        if (profile.levelId !== parsedLevelId) {
          try {
            await AdmissionModel.recordAudit({
              studentId: profile.userId, // references users(id)
              changedBy,
              action: 'LEVEL_CHANGE',
              fromState: { levelId: profile.levelId },
              toState: { levelId: parsedLevelId },
              notes: `Student enrolled into level ${level.name || parsedLevelId}`
            });
          } catch (auditErr) {
            console.warn(`Failed to record audit for student ${profile.userId}:`, auditErr.message);
          }
        }
      }

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
      const parsedLevelId = parseInt(levelId, 10);

      const result = await query(
        `UPDATE "public"."student_profiles"
         SET "levelId" = NULL, "updatedAt" = NOW()
         WHERE ("userId" = $1 OR id = $1) AND "levelId" = $2
         RETURNING id, "userId"`,
        [studentId, parsedLevelId]
      );

      if (result.rowCount === 0) {
        return sendError(res, 'Student not found in this level', 404);
      }

      // Record level history audit
      const profile = result.rows[0];
      const changedBy = req.user?.id || 'SYSTEM';

      try {
        await AdmissionModel.recordAudit({
          studentId: profile.userId, // references users(id)
          changedBy,
          action: 'LEVEL_CHANGE',
          fromState: { levelId: parsedLevelId },
          toState: { levelId: null },
          notes: 'Student unenrolled from primary level'
        });
      } catch (auditErr) {
        console.warn(`Failed to record audit for student ${profile.userId}:`, auditErr.message);
      }

      return sendSuccess(res, null, 'Student unenrolled successfully');
    } catch (error) {
      console.error('Unenroll Student Error:', error);
      return sendError(res, 'Failed to unenroll student', 500);
    }
  }
}
