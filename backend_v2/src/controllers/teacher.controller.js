import { TeacherModel } from '../models/teacher.model.js';
import { CourseModel } from '../models/course.model.js';
import { ClassModel } from '../models/class.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class TeacherController {
  /**
   * GET /api/v1/teacher/dashboard
   */
  static async getDashboard(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const stats = await TeacherModel.getDashboardStats(teacherId);
      return sendSuccess(res, stats, 'Teacher dashboard stats retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/courses
   */
  static async getCourses(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const courses = await TeacherModel.getCourses(teacherId);
      return sendSuccess(res, courses, 'Teacher courses retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/courses/:courseId
   */
  static async getCourseDetails(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const course = await TeacherModel.getCourseById(teacherId, req.params.courseId);
      if (!course) {
        return sendError(res, 'Course not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, course, 'Course details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses
   */
  static async createCourse(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const newCourse = await CourseModel.create({
        ...req.body,
        teacherId,
      });
      return sendSuccess(res, newCourse, 'Course created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/teacher/courses/:courseId
   */
  static async updateCourse(req, res, next) {
    try {
      const updated = await CourseModel.update(req.params.courseId, req.body);
      return sendSuccess(res, updated, 'Course updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses/:courseId/units
   */
  static async addUnit(req, res, next) {
    try {
      const unit = await TeacherModel.addUnit(req.params.courseId, req.body);
      return sendSuccess(res, unit, 'Unit created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/courses/:courseId/units/:unitId/lessons
   */
  static async addLesson(req, res, next) {
    try {
      const lesson = await TeacherModel.addLesson(req.params.unitId, req.body);
      return sendSuccess(res, lesson, 'Lesson created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/lessons/:lessonId
   */
  static async getLessonDetails(req, res, next) {
    try {
      const { lessonId } = req.params;
      const lesson = await TeacherModel.getLessonById(lessonId);
      if (!lesson) {
        return sendError(res, 'Lesson not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, lesson, 'Lesson details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH or PUT /api/v1/teacher/lessons/:lessonId
   */
  static async updateLesson(req, res, next) {
    try {
      const { lessonId } = req.params;
      const updated = await TeacherModel.updateLesson(lessonId, req.body);
      if (!updated) {
        return sendError(res, 'Lesson not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Lesson updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/lessons/:lessonId
   */
  static async deleteLesson(req, res, next) {
    try {
      const { lessonId } = req.params;
      const deleted = await TeacherModel.deleteLesson(lessonId);
      if (!deleted) {
        return sendError(res, 'Lesson not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, { id: lessonId }, 'Lesson deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH or PUT /api/v1/teacher/units/:unitId
   */
  static async updateUnit(req, res, next) {
    try {
      const { unitId } = req.params;
      const updated = await TeacherModel.updateUnit(unitId, req.body);
      if (!updated) {
        return sendError(res, 'Unit not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Unit updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/units/:unitId
   */
  static async deleteUnit(req, res, next) {
    try {
      const { unitId } = req.params;
      const deleted = await TeacherModel.deleteUnit(unitId);
      if (!deleted) {
        return sendError(res, 'Unit not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, { id: unitId }, 'Unit deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/classes
   */
  static async getClasses(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const classes = await ClassModel.findByTeacherId(teacherId);
      return sendSuccess(res, classes, 'Teacher classes retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/classes/:classId
   */
  static async getClassDetails(req, res, next) {
    try {
      const classData = await ClassModel.findById(req.params.classId);
      if (!classData) {
        return sendError(res, 'Class not found', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, classData, 'Class details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/classes
   */
  static async createClass(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const newClass = await ClassModel.create({
        ...req.body,
        teacherId,
      });
      return sendSuccess(res, newClass, 'Class created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/students
   */
  static async getStudents(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const search = req.query.search || '';
      const students = await TeacherModel.getStudents(teacherId, { search });
      return sendSuccess(res, { students }, 'Teacher students retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/students/:studentId/progress
   */
  static async getStudentProgress(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { studentId } = req.params;
      const data = await TeacherModel.getStudentProgress(teacherId, studentId);
      if (!data) {
        return sendError(res, 'Student not found or not enrolled in your courses', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, data, 'Student progress details retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/students/:studentId/feedback
   */
  static async addStudentFeedback(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { studentId } = req.params;
      const { title, content, strengths, improvements } = req.body;
      const feedback = await TeacherModel.addStudentFeedback(teacherId, studentId, {
        title,
        content,
        strengths,
        improvements,
      });
      return sendSuccess(res, feedback, 'Feedback sent successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/teacher/students/:enrollmentId
   */
  static async updateStudentEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const updated = await TeacherModel.updateStudentEnrollment(teacherId, enrollmentId, req.body);
      if (!updated) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Student enrollment updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/teacher/students/:enrollmentId
   */
  static async deleteStudentEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const deleted = await TeacherModel.deleteStudentEnrollment(teacherId, enrollmentId);
      if (!deleted) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, { id: enrollmentId }, 'Student enrollment deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/enrollments
   */
  static async getEnrollments(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { status, search } = req.query;
      const enrollments = await TeacherModel.getEnrollments(teacherId, { status, search });
      return sendSuccess(res, enrollments, 'Enrollments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/teacher/expiring-students
   */
  static async getExpiringStudents(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { days } = req.query;
      const expiring = await TeacherModel.getExpiringStudents(teacherId, { days });
      return sendSuccess(res, expiring, 'Expiring students retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/enrollments/:enrollmentId/extend
   */
  static async extendEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const { extensionDays, days, extraDays } = req.body;
      const updated = await TeacherModel.extendEnrollment(teacherId, enrollmentId, {
        extensionDays: extensionDays || days || extraDays || 30,
      });
      if (!updated) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Enrollment extended successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/teacher/enrollments/:enrollmentId/suspend
   */
  static async suspendEnrollment(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { enrollmentId } = req.params;
      const { reason } = req.body;
      const updated = await TeacherModel.suspendEnrollment(teacherId, enrollmentId, { reason });
      if (!updated) {
        return sendError(res, 'Enrollment not found or unauthorized', 404, 'NOT_FOUND');
      }
      return sendSuccess(res, updated, 'Enrollment suspended successfully');
    } catch (err) {
      next(err);
    }
  }
}

import { query } from '../config/database.js';

/**
 * Aggregates all PDF resources + video lessons owned by this teacher into one library list.
 * Added as a standalone export-friendly function because it needs the `query` import.
 */
export async function getLibraryItems(teacherId) {
  const pdfRes = await query(
    `SELECT
        r.id,
        r.title,
        r.description,
        r.url,
        r."resourceType",
        r."canDownload",
        r."canView",
        r."createdAt",
        l.title AS "lessonTitle",
        l.id    AS "lessonId",
        c.title AS "courseTitle",
        c.id    AS "courseId"
      FROM "interactive_video_resources" r
      JOIN "lessons" l ON l.id = r."lessonId"
      JOIN "units" u ON u.id = l."unitId"
      JOIN "courses" c ON c.id = u."courseId"
      WHERE (c."teacherId" = $1 OR c."teacherId" IN (
        SELECT id FROM "teacher_profiles" WHERE "userId" = $1
      ))
      ORDER BY r."createdAt" DESC`,
    [teacherId]
  );

  const videoRes = await query(
    `SELECT
        ivl."lessonId"     AS id,
        ivl."videoUrl"     AS url,
        ivl."thumbnailUrl",
        ivl."durationSeconds",
        ivl."cefrLevel",
        ivl."createdAt",
        l.title            AS "lessonTitle",
        l.id               AS "lessonId",
        c.title            AS "courseTitle",
        c.id               AS "courseId"
      FROM "interactive_video_lessons" ivl
      JOIN "lessons" l ON l.id = ivl."lessonId"
      JOIN "units" u ON u.id = l."unitId"
      JOIN "courses" c ON c.id = u."courseId"
      WHERE ivl."videoUrl" IS NOT NULL AND ivl."videoUrl" != ''
        AND (c."teacherId" = $1 OR c."teacherId" IN (
          SELECT id FROM "teacher_profiles" WHERE "userId" = $1
        ))
      ORDER BY ivl."createdAt" DESC`,
    [teacherId]
  );

  const pdfs = pdfRes.rows.map((r) => ({
    id: `pdf_${r.id}`,
    resourceId: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    fileType: 'PDF',
    resourceType: r.resourceType || 'PDF',
    canDownload: r.canDownload,
    canView: r.canView,
    lessonTitle: r.lessonTitle,
    lessonId: r.lessonId,
    courseTitle: r.courseTitle,
    courseId: r.courseId,
    createdAt: r.createdAt,
  }));

  const videos = videoRes.rows.map((v) => ({
    id: `vid_${v.id}`,
    resourceId: v.id,
    title: v.lessonTitle,
    description: null,
    url: v.url,
    fileType: 'VIDEO',
    resourceType: 'VIDEO',
    thumbnail: v.thumbnailUrl,
    durationSeconds: v.durationSeconds,
    cefrLevel: v.cefrLevel,
    canDownload: false,
    canView: true,
    lessonTitle: v.lessonTitle,
    lessonId: v.lessonId,
    courseTitle: v.courseTitle,
    courseId: v.courseId,
    createdAt: v.createdAt,
  }));

  const seenUrls = new Set([...pdfs.map((p) => p.url), ...videos.map((v) => v.url)]);

  let sectionItems = [];
  try {
    const secRes = await query(
      `SELECT
          s.id,
          s.title,
          s.content,
          s."mediaUrl" AS url,
          s."contentType",
          s."createdAt",
          l.title AS "lessonTitle",
          l.id    AS "lessonId",
          c.title AS "courseTitle",
          c.id    AS "courseId"
        FROM "lesson_sections" s
        JOIN "lessons" l ON l.id = s."lessonId"
        JOIN "units" u ON u.id = l."unitId"
        JOIN "courses" c ON c.id = u."courseId"
        WHERE s."mediaUrl" IS NOT NULL AND s."mediaUrl" != ''
          AND (c."teacherId" = $1 OR c."teacherId" IN (
            SELECT id FROM "teacher_profiles" WHERE "userId" = $1
          ))
        ORDER BY s."createdAt" DESC`,
      [teacherId]
    );

    for (const s of secRes.rows || []) {
      if (!s.url || seenUrls.has(s.url)) continue;
      seenUrls.add(s.url);

      const urlLower = s.url.toLowerCase();
      const isPdf = s.contentType === 'PDF' || urlLower.endsWith('.pdf') || urlLower.includes('/pdf') || urlLower.includes('.pdf?');
      const isVideo =
        s.contentType === 'VIDEO' ||
        urlLower.includes('youtube.com') ||
        urlLower.includes('youtu.be') ||
        urlLower.endsWith('.mp4') ||
        urlLower.endsWith('.webm') ||
        urlLower.endsWith('.mov') ||
        urlLower.includes('/video');

      if (isPdf) {
        sectionItems.push({
          id: `sec_pdf_${s.id}`,
          resourceId: s.id,
          title: s.title || `${s.lessonTitle} - Document`,
          description: s.content || null,
          url: s.url,
          fileType: 'PDF',
          resourceType: 'PDF',
          canDownload: false,
          canView: true,
          lessonTitle: s.lessonTitle,
          lessonId: s.lessonId,
          courseTitle: s.courseTitle,
          courseId: s.courseId,
          createdAt: s.createdAt,
        });
      } else if (isVideo) {
        sectionItems.push({
          id: `sec_vid_${s.id}`,
          resourceId: s.id,
          title: s.title || `${s.lessonTitle} - Video`,
          description: s.content || null,
          url: s.url,
          fileType: 'VIDEO',
          resourceType: 'VIDEO',
          thumbnail: null,
          durationSeconds: 0,
          cefrLevel: null,
          canDownload: false,
          canView: true,
          lessonTitle: s.lessonTitle,
          lessonId: s.lessonId,
          courseTitle: s.courseTitle,
          courseId: s.courseId,
          createdAt: s.createdAt,
        });
      }
    }
  } catch (err) {
    // If lesson_sections table doesn't exist or query fails, ignore silently
  }

  return [...pdfs, ...videos, ...sectionItems];
}
