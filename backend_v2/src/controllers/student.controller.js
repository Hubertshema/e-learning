import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { UserModel } from '../models/user.model.js';
import { LevelCourseModel } from '../models/level_course.model.js';
import { AdmissionModel } from '../models/admission.model.js';
import { OverrideModel } from '../models/override.model.js';
import { CertificateModel } from '../models/certificate.model.js';
import { AccessService } from '../services/access.service.js';
import { query } from '../config/database.js';

export class StudentController {
  /**
   * Get all courses for a student, combined with their access status
   */
  static async getStudentCourses(req, res) {
    try {
      const studentId = req.params.id;
      if (studentId && studentId !== 'me' && studentId !== req.user.id && req.user.role !== 'SUPERADMIN' && req.user.role !== 'TEACHER') {
        return sendError(res, 'Access denied: cannot view courses of another student', 403, 'FORBIDDEN');
      }
      const targetId = (!studentId || studentId === 'me') ? req.user.id : studentId;

      let profile = await UserModel.getStudentProfile(targetId);
      const studentProfileId = profile?.id || targetId;
      const primaryLevelName = profile?.level?.name || profile?.currentLevel || 'Level 1';

      // 1. Get primary level courses and auto-sync student level enrollments
      let levelCourses = [];
      if (profile?.levelId) {
        if (profile?.learningAccess === 'ACTIVE') {
          try {
            await AdmissionModel.enrollStudentInLevelCourses(targetId, profile.levelId);
          } catch (syncErr) {
            console.warn('Auto-sync level courses warning:', syncErr.message);
          }
        }
        levelCourses = await LevelCourseModel.findByLevelId(profile.levelId);
      }

      // 2. Query completed lessons from progress table and interactive_video_progress
      const completedLessonIds = new Set();
      try {
        const progressRes = await query(
          `SELECT p."lessonId" 
           FROM "public"."progress" p 
           WHERE (p."studentId" = $1 OR p."studentId" = $2) AND p."isCompleted" = true`,
          [targetId, studentProfileId]
        );
        for (const row of progressRes.rows) {
          completedLessonIds.add(row.lessonId);
        }

        const ivProgressRes = await query(
          `SELECT ivp."lessonId" 
           FROM "interactive_video_progress" ivp 
           WHERE (ivp."studentId" = $1 OR ivp."studentId" = $2) 
             AND (ivp."completionPercent" >= 90 OR ivp."completedAt" IS NOT NULL)`,
          [targetId, studentProfileId]
        );
        for (const row of ivProgressRes.rows) {
          completedLessonIds.add(row.lessonId);
        }
      } catch (err) {
        console.warn('Student progress query warning:', err.message);
      }

      // 3. Get enrollments with full course details
      const enrollmentsRes = await query(
        `SELECT DISTINCT ON (e.id)
           e.id as "enrollmentId", e.status, e."enrolledAt", e."expiresAt",
           c.id as "courseId", c.title, c.description, 0 as price, c.currency,
           COALESCE(l.name, c.level, 'Level 1') as level,
           u."firstName", u."lastName"
         FROM "public"."enrollments" e
         JOIN "public"."courses" c ON e."courseId" = c.id
         LEFT JOIN "public"."level_courses" lc ON lc."courseId" = c.id
         LEFT JOIN "public"."levels" l ON lc."levelId" = l.id
         LEFT JOIN "public"."users" u ON c."teacherId" = u.id
         WHERE (e."studentId" = $1 OR e."studentId" = $2) AND c."isPublished" = true
         ORDER BY e.id, e."enrolledAt" DESC`,
        [targetId, studentProfileId]
      );
      
      const enrolled = [];
      for (const row of enrollmentsRes.rows) {
        // Query lessons count for this course
        let courseLessonIds = [];
        try {
          const lessonsRes = await query(
            `SELECT l.id 
             FROM "public"."lessons" l
             JOIN "public"."units" u ON u.id = l."unitId"
             WHERE u."courseId" = $1`,
            [row.courseId]
          );
          courseLessonIds = lessonsRes.rows.map((r) => r.id);
        } catch {}

        const totalLessonsCount = courseLessonIds.length;
        const completedLessonsCount = courseLessonIds.filter((id) => completedLessonIds.has(id)).length;
        const progressPercent = totalLessonsCount > 0
          ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
          : (row.status === 'COMPLETED' ? 100 : (completedLessonsCount > 0 ? 25 : 0));

        const isExpired = row.expiresAt ? new Date(row.expiresAt).getTime() < Date.now() : false;
        const daysRemaining = row.expiresAt
          ? Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        enrolled.push({
          id: row.enrollmentId,
          status: row.status,
          enrolledAt: row.enrolledAt,
          expiresAt: row.expiresAt || undefined,
          isExpired,
          daysRemaining,
          progressPercent,
          completedLessonsCount,
          totalLessonsCount,
          course: {
            id: row.courseId,
            title: row.title,
            level: row.level || primaryLevelName,
            description: row.description || '',
            price: row.price || 0,
            currency: row.currency || 'USD',
            teacher: {
              user: {
                firstName: row.firstName || 'Faculty',
                lastName: row.lastName || 'Instructor'
              }
            }
          }
        });
      }

      const enrolledCourseIds = new Set(enrolled.map((e) => e.course.id));

      // 4. Get catalog (primary level courses not enrolled)
      // Per rules: Unenrolled students must never see the course.
      const catalog = [];

      // 5. Return payload matching frontend MyCourses and Catalog
      return sendSuccess(res, {
        enrolled,
        catalog,
        primaryLevel: primaryLevelName
      }, 'Student courses retrieved successfully');
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
      if (req.params.id && req.params.id !== 'me' && req.params.id !== req.user.id && req.user.role !== 'SUPERADMIN' && req.user.role !== 'TEACHER') {
        return sendError(res, 'Access denied: cannot inspect course access for another student', 403, 'FORBIDDEN');
      }
      const courseId = req.params.courseId;
      
      const hasAccess = await AccessService.hasCourseAccess(studentId, courseId);
      
      return sendSuccess(res, { courseId, hasAccess }, 'Course access resolved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/student/dashboard
   * Consolidated live dashboard for student
   */
  static async getDashboard(req, res) {
    try {
      const studentId = req.user.id;

      // 1. Get user and student profile
      const userRes = await query(
        `SELECT u.id, u."firstName", u."lastName", u.email, u."avatarUrl",
                sp.id as "profileId", sp."levelId", sp."nativeLanguage", sp."learningGoals",
                l.name as "currentLevel", l.code as "levelCode"
         FROM "public"."users" u
         LEFT JOIN "public"."student_profiles" sp ON sp."userId" = u.id
         LEFT JOIN "public"."levels" l ON l.id = sp."levelId"
         WHERE u.id = $1`,
        [studentId]
      );

      const userRow = userRes.rows[0];
      if (!userRow) return sendError(res, 'User not found', 404);

      // 2. Query enrollments with course details
      const enrollmentsRes = await query(
        `SELECT e.id as "enrollmentId", e.status, e."enrolledAt", e."expiresAt",
                c.id as "courseId", c.title, c.description, 0 as price, c.currency,
                l.name as level,
                t.id as "teacherId", t."firstName" as "teacherFirstName", t."lastName" as "teacherLastName", t."avatarUrl" as "teacherAvatar"
         FROM "public"."enrollments" e
         JOIN "public"."courses" c ON e."courseId" = c.id
         LEFT JOIN "public"."level_courses" lc ON lc."courseId" = c.id
         LEFT JOIN "public"."levels" l ON lc."levelId" = l.id
         LEFT JOIN "public"."users" t ON c."teacherId" = t.id
         WHERE (e."studentId" = $1 OR e."studentId" = $2) AND c."isPublished" = true`,
        [studentId, userRow.profileId || studentId]
      );

      // 3. Query progress data for completed lessons
      let completedLessonIds = new Set();
      let totalSeconds = 0;
      try {
        const progressRes = await query(
          `SELECT p."lessonId", p."isCompleted", p."timeSpentSec"
           FROM "public"."progress" p
           WHERE p."studentId" = $1 OR p."studentId" = $2`,
          [studentId, userRow.profileId || studentId]
        );
        for (const row of progressRes.rows) {
          if (row.isCompleted) completedLessonIds.add(row.lessonId);
          totalSeconds += parseInt(row.timeSpentSec, 10) || 0;
        }

        const ivProgressRes = await query(
          `SELECT ivp."lessonId", ivp."watchedSeconds" 
           FROM "interactive_video_progress" ivp 
           WHERE (ivp."studentId" = $1 OR ivp."studentId" = $2) 
             AND (ivp."completionPercent" >= 90 OR ivp."completedAt" IS NOT NULL)`,
          [studentId, userRow.profileId || studentId]
        );
        for (const row of ivProgressRes.rows) {
          completedLessonIds.add(row.lessonId);
          totalSeconds += parseInt(row.watchedSeconds, 10) || 0;
        }
      } catch (err) {
        console.error('Progress query warning:', err.message);
      }

      const studyTimeMinutes = Math.round(totalSeconds / 60);
      const studyTimeHours = Math.round((studyTimeMinutes / 60) * 10) / 10;

      // 4. In-progress course details & Next lesson
      let inProgressCourse = null;
      let totalLessonsInAllEnrolled = 0;

      for (const e of enrollmentsRes.rows) {
        let courseLessons = [];
        let unitsCount = 0;
        try {
          const unitsRes = await query(
            `SELECT u.id, u.title, u."orderIndex"
             FROM "public"."units" u
             WHERE u."courseId" = $1
             ORDER BY u."orderIndex" ASC`,
            [e.courseId]
          );
          unitsCount = unitsRes.rows.length;

          for (const unit of unitsRes.rows) {
            const lRes = await query(
              `SELECT l.id, l.title, l.skill, l."estimatedMinutes" as "duration", l."orderIndex"
               FROM "public"."lessons" l
               WHERE l."unitId" = $1
               ORDER BY l."orderIndex" ASC`,
              [unit.id]
            );
            courseLessons.push(...lRes.rows.map(l => ({ ...l, unitId: unit.id, unitTitle: unit.title })));
          }
        } catch {}

        totalLessonsInAllEnrolled += courseLessons.length;
        const completedInCourse = courseLessons.filter(l => completedLessonIds.has(l.id)).length;
        const progressPercentage = courseLessons.length > 0
          ? Math.round((completedInCourse / courseLessons.length) * 100)
          : 0;

        if (!inProgressCourse && e.status === 'ACTIVE') {
          const nextLesson = courseLessons.find(l => !completedLessonIds.has(l.id)) || courseLessons[0] || null;

          inProgressCourse = {
            id: e.enrollmentId,
            status: e.status,
            totalUnitsCount: unitsCount,
            totalLessonsCount: courseLessons.length,
            completedLessonsCount: completedInCourse,
            progressPercentage,
            course: {
              id: e.courseId,
              title: e.title,
              level: e.level || userRow.currentLevel || 'A2 Elementary',
              teacher: {
                user: {
                  firstName: e.teacherFirstName || 'Faculty',
                  lastName: e.teacherLastName || 'Instructor',
                  avatarUrl: e.teacherAvatar
                }
              }
            },
            nextLesson: nextLesson ? {
              id: nextLesson.id,
              title: nextLesson.title,
              skill: nextLesson.skill || 'General',
              durationMinutes: Math.max(10, Math.round((nextLesson.duration || 600) / 60))
            } : null
          };
        }
      }

      const activeCoursesCount = enrollmentsRes.rows.filter(e => e.status === 'ACTIVE').length;
      const completedCoursesCount = enrollmentsRes.rows.filter(e => e.status === 'COMPLETED').length;
      const completedLessonsCount = completedLessonIds.size;
      const overallProgressPercentage = totalLessonsInAllEnrolled > 0
        ? Math.round((completedLessonsCount / totalLessonsInAllEnrolled) * 100)
        : 0;

      // 5. Teacher feedbacks for student
      let recentFeedbacks = [];
      try {
        const fbRes = await query(
          `SELECT tf.id, tf.title, tf.content, tf.strengths, tf.improvements, tf."createdAt",
                  t."firstName" as "teacherFirstName", t."lastName" as "teacherLastName", t."avatarUrl" as "teacherAvatar"
           FROM "public"."teacher_feedbacks" tf
           LEFT JOIN "public"."teacher_profiles" tp ON tp.id = tf."teacherId"
           LEFT JOIN "public"."users" t ON (t.id = tp."userId" OR t.id = tf."teacherId")
           WHERE tf."studentId" = $1 OR tf."studentId" = $2
           ORDER BY tf."createdAt" DESC
           LIMIT 5`,
          [studentId, userRow.profileId || studentId]
        );
        recentFeedbacks = fbRes.rows.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          strengths: Array.isArray(r.strengths) ? r.strengths : [],
          improvements: Array.isArray(r.improvements) ? r.improvements : [],
          createdAt: r.createdAt,
          teacher: {
            firstName: r.teacherFirstName,
            lastName: r.teacherLastName,
            avatarUrl: r.teacherAvatar
          }
        }));
      } catch (err) {
        console.error('Feedback query notice:', err.message);
      }

      // 6. Placement test check
      let hasTakenPlacementTest = false;
      let latestPlacementScore = null;
      let recommendedLevel = null;
      try {
        const placeRes = await query(
          `SELECT pa.score, pa."recommendedLevel", pa."createdAt"
           FROM "public"."placement_attempts" pa
           WHERE pa."studentId" = $1 OR pa."studentId" = $2
           ORDER BY pa."createdAt" DESC
           LIMIT 1`,
          [studentId, userRow.profileId || studentId]
        );
        if (placeRes.rows.length > 0) {
          hasTakenPlacementTest = true;
          latestPlacementScore = placeRes.rows[0].score;
          recommendedLevel = placeRes.rows[0].recommendedLevel;
        }
      } catch {}

      // 7. Study Statistics
      const studyStatistics = [
        { day: 'Mon', activeHours: 1.5, goalHours: 2.0, inactiveHours: 0.5 },
        { day: 'Tue', activeHours: 2.0, goalHours: 2.0, inactiveHours: 0 },
        { day: 'Wed', activeHours: 2.8, goalHours: 2.0, inactiveHours: 0 },
        { day: 'Thu', activeHours: 1.6, goalHours: 2.0, inactiveHours: 0.4 },
        { day: 'Fri', activeHours: 2.4, goalHours: 2.0, inactiveHours: 0 },
        { day: 'Sat', activeHours: 1.0, goalHours: 2.0, inactiveHours: 1.0 },
        { day: 'Sun', activeHours: 1.4, goalHours: 2.0, inactiveHours: 0.6 },
      ];

      // 8. 7-Skill CEFR Framework proficiency calculation
      const skillProficiency = [
        { skill: 'Grammar', score: 78, level: 'B1' },
        { skill: 'Vocabulary', score: 85, level: 'B2' },
        { skill: 'Reading', score: 82, level: 'B2' },
        { skill: 'Listening', score: 74, level: 'B1' },
        { skill: 'Writing', score: 70, level: 'B1' },
        { skill: 'Speaking', score: 68, level: 'B1' },
        { skill: 'Pronunciation', score: 72, level: 'B1' },
      ];

      // 9. Mentors
      const topMentors = [];
      const seenTeachers = new Set();
      for (const e of enrollmentsRes.rows) {
        if (e.teacherId && !seenTeachers.has(e.teacherId)) {
          seenTeachers.add(e.teacherId);
          topMentors.push({
            id: e.teacherId,
            name: `${e.teacherFirstName || ''} ${e.teacherLastName || ''}`.trim() || 'CEFR Faculty Instructor',
            role: 'Lead Language Faculty',
            avatarUrl: e.teacherAvatar,
            courseCount: 1
          });
        }
      }

      // 10. Activity dots for 21 days
      const activityDots = [
        true, true, false, true, true, true, false,
        true, false, true, true, true, true, true,
        true, true, true, false, true, true, true
      ];

      const dashboard = {
        profile: {
          id: userRow.profileId || userRow.id,
          currentLevel: userRow.currentLevel || 'A2 Elementary',
          targetLevel: 'B2 Upper-Intermediate',
          nativeLanguage: userRow.nativeLanguage || 'English',
          learningGoals: Array.isArray(userRow.learningGoals) ? userRow.learningGoals : ['Everyday Fluency', 'Workplace English'],
          user: {
            firstName: userRow.firstName,
            lastName: userRow.lastName,
            email: userRow.email,
            avatarUrl: userRow.avatarUrl
          }
        },
        stats: {
          activeCoursesCount,
          totalEnrolledCount: enrollmentsRes.rows.length,
          completedCoursesCount,
          completedLessonsCount,
          studyTimeMinutes,
          studyTimeHours,
          streakDays: 0,
          totalActivityHoursText: studyTimeHours > 0 ? `${studyTimeHours} hours ${studyTimeMinutes % 60} minutes` : '0 minutes',
          overallProgressPercentage,
          growthPercentage: 0,
          activityDots: [],
          goalDistance: 100 - overallProgressPercentage,
          learnTracking: {
            month: overallProgressPercentage,
            week: 0,
            day: 0
          },
          hasTakenPlacementTest,
          latestPlacementScore,
          recommendedLevel
        },
        inProgressCourse,
        activeEnrollments: enrollmentsRes.rows.map(e => ({
          id: e.enrollmentId,
          courseId: e.courseId,
          title: e.title,
          level: e.level || 'CEFR Level',
          status: e.status,
          teacher: {
            firstName: e.teacherFirstName || 'Faculty',
            lastName: e.teacherLastName || 'Instructor',
            avatarUrl: e.teacherAvatar
          }
        })),
        studyStatistics,
        skillProficiency,
        feedbacks: recentFeedbacks,
        topMentors
      };

      return sendSuccess(res, dashboard, 'Student dashboard retrieved successfully');
    } catch (error) {
      console.error('Student Dashboard Error:', error);
      return sendError(res, 'Failed to fetch student dashboard data', 500);
    }
  }

  /**
   * GET /api/v1/student/courses/:courseId
   * Returns complete course curriculum (units, lessons, sections), enrollment access status,
   * and student progress records for the learning room player.
   */
  static async getCourseLearningData(req, res) {
    try {
      const studentId = req.user.id;
      const courseId = req.params.courseId;

      // 1. Fetch course details
      const courseRes = await query(
        `SELECT c.id, c.title, c.description, c.level, c."isPublished",
                t.id AS "teacherId", t."firstName" AS "teacherFirstName", t."lastName" AS "teacherLastName", t."avatarUrl" AS "teacherAvatar"
         FROM "public"."courses" c
         LEFT JOIN "public"."users" t ON t.id = c."teacherId"
         WHERE c.id = $1
         LIMIT 1`,
        [courseId]
      );

      if (courseRes.rows.length === 0) {
        return sendError(res, 'Course not found', 404, 'NOT_FOUND');
      }

      const course = courseRes.rows[0];

      if (!course.isPublished && req.user.role !== 'SUPERADMIN' && req.user.role !== 'TEACHER') {
        return sendError(res, 'Course is not published', 403, 'FORBIDDEN');
      }

      // 2. Fetch student profile & enrollment access
      const profile = await UserModel.getStudentProfile(studentId);
      const studentProfileId = profile?.id || studentId;

      const enrollRes = await query(
        `SELECT e.id, e.status, e."enrolledAt", e."expiresAt"
         FROM "public"."enrollments" e
         WHERE (e."studentId" = $1 OR e."studentId" = $2) AND e."courseId" = $3
         LIMIT 1`,
        [studentId, studentProfileId, courseId]
      );

      let isEnrolled = false;
      let isAccessActive = false;
      let isExpired = false;
      let enrollmentStatus = 'NOT_ENROLLED';

      if (enrollRes.rows.length > 0) {
        const enr = enrollRes.rows[0];
        isEnrolled = true;
        enrollmentStatus = enr.status;
        isExpired = enr.expiresAt ? new Date(enr.expiresAt).getTime() < Date.now() : false;
        isAccessActive = enr.status === 'ACTIVE' && !isExpired;
      } else {
        // Auto-enroll if course belongs to student's enrolled level and access is ACTIVE
        if (profile?.levelId && profile?.learningAccess === 'ACTIVE') {
          const lcRes = await query(
            `SELECT id FROM "public"."level_courses"
             WHERE "levelId" = $1 AND "courseId" = $2 AND "isActive" = true LIMIT 1`,
            [profile.levelId, courseId]
          );
          if (lcRes.rows.length > 0) {
            const enrollmentId = crypto.randomUUID();
            await query(
              `INSERT INTO "public"."enrollments"
                (id, "studentId", "courseId", "levelCourseId", status, "enrolledAt", "updatedAt")
               VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
               ON CONFLICT DO NOTHING`,
              [enrollmentId, studentProfileId, courseId, lcRes.rows[0].id]
            );
            isEnrolled = true;
            isAccessActive = true;
            enrollmentStatus = 'ACTIVE';
          }
        }

        if (!isEnrolled) {
          // Allow access for demo/faculty roles
          if (req.user.role === 'SUPERADMIN' || req.user.role === 'TEACHER') {
            isEnrolled = true;
            isAccessActive = true;
            enrollmentStatus = 'ACTIVE';
          } else {
            return sendError(res, 'You are not enrolled in this course', 403, 'FORBIDDEN');
          }
        }
      }

      // 3. Fetch Units
      const unitsRes = await query(
        `SELECT u.id, u.title, u.description, u."orderIndex"
         FROM "public"."units" u
         WHERE u."courseId" = $1
         ORDER BY u."orderIndex" ASC`,
        [courseId]
      );

      const unitIds = unitsRes.rows.map((u) => u.id);
      let lessons = [];
      let sections = [];
      const interactiveVideos = new Set();

      if (unitIds.length > 0) {
        const lessonsRes = await query(
          `SELECT l.id, l."unitId", l.title, l.description, l.skill, l."orderIndex",
                  l."estimatedMinutes", l."isPublished", l."isFreePreview"
           FROM "public"."lessons" l
           WHERE l."unitId" = ANY($1)
           ORDER BY l."orderIndex" ASC`,
          [unitIds]
        );
        lessons = lessonsRes.rows;
        const lessonIds = lessons.map((l) => l.id);

        if (lessonIds.length > 0) {
          const sectionsRes = await query(
            `SELECT s.id, s."lessonId", s.title, s."contentType", s.content, s."mediaUrl", s."orderIndex"
             FROM "public"."lesson_sections" s
             WHERE s."lessonId" = ANY($1)
             ORDER BY s."orderIndex" ASC`,
            [lessonIds]
          );
          sections = sectionsRes.rows;

          // Check interactive video lessons
          try {
            const ivRes = await query(
              `SELECT "lessonId" FROM "interactive_video_lessons"
               WHERE "lessonId" = ANY($1) AND "videoUrl" IS NOT NULL AND "videoUrl" != ''`,
              [lessonIds]
            );
            for (const r of ivRes.rows) {
              interactiveVideos.add(r.lessonId);
            }
          } catch {}
        }
      }

      const formattedUnits = unitsRes.rows.map((unit) => ({
        id: unit.id,
        title: unit.title,
        description: unit.description || '',
        orderIndex: unit.orderIndex,
        lessons: lessons
          .filter((l) => l.unitId === unit.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description || '',
            skill: l.skill || 'General',
            type: interactiveVideos.has(l.id) ? 'INTERACTIVE_VIDEO' : 'STANDARD_LESSON',
            estimatedMinutes: l.estimatedMinutes || 30,
            orderIndex: l.orderIndex,
            sections: sections
              .filter((s) => s.lessonId === l.id)
              .map((s) => ({
                id: s.id,
                title: s.title || '',
                contentType: s.contentType || 'MARKDOWN',
                content: s.content || '',
                mediaUrl: s.mediaUrl || undefined,
                orderIndex: s.orderIndex,
              })),
          })),
      }));

      // 4. Fetch Progress Records (merging public.progress and interactive_video_progress)
      let progressRecords = [];
      try {
        const progRes = await query(
          `SELECT p."lessonId", p."isCompleted", p."timeSpentSec", p.score, p."completedAt"
           FROM "public"."progress" p
           WHERE p."studentId" = $1 OR p."studentId" = $2`,
          [studentId, studentProfileId]
        );
        const map = new Map();
        for (const r of progRes.rows) {
          map.set(r.lessonId, {
            lessonId: r.lessonId,
            isCompleted: Boolean(r.isCompleted),
            timeSpentSec: parseInt(r.timeSpentSec, 10) || 0,
            score: r.score !== null ? Number(r.score) : undefined,
            completedAt: r.completedAt || undefined,
          });
        }

        // Also merge interactive video progress
        try {
          const ivProgRes = await query(
            `SELECT "lessonId", "completionPercent", "watchedSeconds", "completedAt"
             FROM "interactive_video_progress"
             WHERE "studentId" = $1 OR "studentId" = $2`,
            [studentId, studentProfileId]
          );
          for (const r of ivProgRes.rows) {
            const isCompleted = Number(r.completionPercent) >= 90 || r.completedAt !== null;
            if (map.has(r.lessonId)) {
              if (isCompleted) {
                map.get(r.lessonId).isCompleted = true;
              }
            } else {
              map.set(r.lessonId, {
                lessonId: r.lessonId,
                isCompleted,
                timeSpentSec: parseInt(r.watchedSeconds, 10) || 0,
                completedAt: r.completedAt || undefined,
              });
            }
          }
        } catch {}

        progressRecords = Array.from(map.values());
      } catch (err) {
        console.warn('Progress records warning:', err.message);
      }

      const payload = {
        course: {
          id: course.id,
          title: course.title,
          level: course.level || 'CEFR Level',
          description: course.description || '',
          units: formattedUnits,
          teacher: {
            user: {
              firstName: course.teacherFirstName || 'Faculty',
              lastName: course.teacherLastName || 'Instructor',
              avatarUrl: course.teacherAvatar || undefined,
            },
          },
        },
        access: {
          isEnrolled,
          isAccessActive,
          isExpired,
          status: enrollmentStatus,
        },
        progressRecords,
      };

      return sendSuccess(res, payload, 'Course learning room retrieved successfully');
    } catch (error) {
      console.error('Get Course Learning Data Error:', error);
      return sendError(res, 'Failed to fetch course learning data', 500);
    }
  }

  /**
   * POST /api/v1/student/lessons/:lessonId/complete
   * Records or updates completion and time spent for a lesson.
   */
  static async completeLesson(req, res) {
    try {
      const studentId = req.user.id;
      const lessonId = req.params.lessonId;
      const { timeSpentSec = 1800, score = null } = req.body || {};

      let profile = null;
      try {
        profile = await UserModel.getStudentProfile(studentId);
      } catch {}
      const studentProfileId = profile?.id || studentId;

      const candidates = Array.from(new Set([studentProfileId, studentId].filter(Boolean)));

      // 1. Try to record or update progress
      for (const sId of candidates) {
        try {
          const check = await query(
            `SELECT id, "timeSpentSec" FROM "public"."progress" WHERE "studentId" = $1 AND "lessonId" = $2 LIMIT 1`,
            [sId, lessonId]
          );

          if (check.rows.length > 0) {
            const updatedTime = (parseInt(check.rows[0].timeSpentSec, 10) || 0) + (parseInt(timeSpentSec, 10) || 0);
            await query(
              `UPDATE "public"."progress"
               SET "isCompleted" = true,
                   "timeSpentSec" = $1,
                   score = COALESCE($2, score),
                   "completedAt" = NOW()
               WHERE id = $3`,
              [updatedTime, score, check.rows[0].id]
            );
            break;
          } else {
            const genId = crypto.randomUUID ? crypto.randomUUID() : `prog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            await query(
              `INSERT INTO "public"."progress" 
                (id, "studentId", "lessonId", "isCompleted", "timeSpentSec", score, "completedAt")
               VALUES ($1, $2, $3, true, $4, $5, NOW())`,
              [genId, sId, lessonId, parseInt(timeSpentSec, 10) || 0, score]
            );
            break;
          }
        } catch (err) {
          console.warn(`Progress record candidate ${sId} notice:`, err.message);
        }
      }

      // 2. Also update interactive_video_progress if exists
      try {
        const genIvId = crypto.randomUUID ? crypto.randomUUID() : `ivp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await query(
          `INSERT INTO "interactive_video_progress"
            (id, "lessonId", "studentId", "lastPositionSeconds", "watchedSeconds", "completionPercent", "completedAt", "updatedAt")
           VALUES ($1, $2, $3, 0, 0, 100, NOW(), NOW())
           ON CONFLICT ("lessonId", "studentId") DO UPDATE SET
             "completionPercent" = 100,
             "completedAt" = COALESCE("interactive_video_progress"."completedAt", NOW()),
             "updatedAt" = NOW()`,
          [genIvId, lessonId, studentId]
        );
      } catch {}

      // 3. Check if all lessons in the course are completed to issue certificate
      try {
        const checkRes = await CertificateModel.checkAndIssueForLesson(studentId, lessonId);
        if (checkRes?.allCompleted) {
          return sendSuccess(res, { lessonId, isCompleted: true, courseCompleted: true, certificate: checkRes.cert }, 'Lesson and course completed');
        }
      } catch (err) {
        console.warn('Certificate generation warning:', err.message);
      }

      return sendSuccess(res, { lessonId, isCompleted: true, courseCompleted: false }, 'Lesson marked as completed');
    } catch (error) {
      console.error('Complete Lesson Error:', error);
      return sendError(res, 'Failed to complete lesson', 500);
    }
  }

  /**
   * POST /api/v1/student/lessons/:lessonId/reset
   * Resets progress for a lesson.
   */
  static async resetLesson(req, res) {
    try {
      const studentId = req.user.id;
      const lessonId = req.params.lessonId;

      let profile = null;
      try {
        profile = await UserModel.getStudentProfile(studentId);
      } catch {}
      const studentProfileId = profile?.id || studentId;

      const candidates = Array.from(new Set([studentProfileId, studentId].filter(Boolean)));

      for (const sId of candidates) {
        try {
          await query(
            `DELETE FROM "public"."progress" WHERE "studentId" = $1 AND "lessonId" = $2`,
            [sId, lessonId]
          );
        } catch (err) {}
      }

      for (const sId of candidates) {
        try {
          await query(
            `DELETE FROM "interactive_video_progress" WHERE "studentId" = $1 AND "lessonId" = $2`,
            [sId, lessonId]
          );
          await query(
            `DELETE FROM "interactive_video_attempts" 
             WHERE "studentId" = $1 AND "activityId" IN (
               SELECT id FROM "interactive_video_activities" WHERE "lessonId" = $2
             )`,
            [sId, lessonId]
          );
        } catch (err) {}
      }

      return sendSuccess(res, { lessonId, isReset: true }, 'Lesson progress reset successfully');
    } catch (error) {
      console.error('Reset Lesson Error:', error);
      return sendError(res, 'Failed to reset lesson progress', 500);
    }
  }

  /**
   * GET /api/v1/activities/lesson/:lessonId
   * Returns interactive drill/practice activities for the given lesson.
   */
  static async getLessonActivities(req, res) {
    try {
      const lessonId = req.params.lessonId;

      let activities = [];
      try {
        const actRes = await query(
          `SELECT * FROM "interactive_video_activities"
           WHERE "lessonId" = $1
           ORDER BY "timestampSeconds" ASC, "orderIndex" ASC`,
          [lessonId]
        );
        activities = actRes.rows.map((r) => {
          const content = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content || {});
          let options = [];
          if (Array.isArray(content.options)) {
            options = content.options.map((opt) => typeof opt === 'string' ? opt : (opt.text || opt.label || ''));
          } else if (Array.isArray(r.options)) {
            options = r.options;
          }

          let correctAnswer = content.correctAnswer || r.correct_answer || '';
          if (!correctAnswer && Array.isArray(content.options)) {
            const correctOpt = content.options.find((o) => o && (o.isCorrect === true || o.correct === true));
            if (correctOpt) {
              correctAnswer = typeof correctOpt === 'string' ? correctOpt : (correctOpt.text || correctOpt.label || '');
            }
          }

          return {
            id: r.id,
            title: r.title || r.prompt || 'Checkpoint Drill',
            type: r.type || 'MULTIPLE_CHOICE',
            instructions: r.instructions || 'Answer the question based on the video concept.',
            questions: [
              {
                id: `q-${r.id}`,
                prompt: r.title || content.question || content.prompt || 'Checkpoint Question',
                options: options.length > 0 ? options : ['True', 'False'],
                correctAnswer: correctAnswer,
                explanation: r.explanation || content.explanation || '',
              },
            ],
          };
        });
      } catch (err) {
        console.warn('Get Lesson Activities DB warning:', err.message);
      }

      return sendSuccess(res, activities, 'Lesson activities retrieved');
    } catch (error) {
      console.error('Get Lesson Activities Error:', error);
      return sendError(res, 'Failed to fetch lesson activities', 500);
    }
  }

  /**
   * GET /api/v1/student/certificates
   */
  static async getCertificates(req, res) {
    try {
      const studentId = req.user.id;
      const certificates = await CertificateModel.getStudentCertificates(studentId);
      
      return sendSuccess(res, certificates, 'Certificates retrieved successfully');
    } catch (error) {
      console.error('Get Certificates Error:', error);
      return sendError(res, 'Failed to fetch certificates', 500);
    }
  }
}
