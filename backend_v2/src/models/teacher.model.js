import { query, parsePgArray } from '../config/database.js';
import crypto from 'crypto';

export class TeacherModel {
  /**
   * Helper to resolve both teacher_profile.id and user.id
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
   * Get dashboard statistics for teacher
   */
  static async getDashboardStats(teacherId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);

    // 1. Total Courses
    const coursesCountRes = await query(
      `SELECT COUNT(*) AS total FROM "public"."courses" WHERE "teacherId" = ANY($1)`,
      [teacherIds]
    );
    const totalCourses = parseInt(coursesCountRes.rows[0].total, 10);

    // 2. Total Classes
    const classesCountRes = await query(
      `SELECT COUNT(*) AS total FROM "public"."classes" WHERE "teacherId" = ANY($1)`,
      [teacherIds]
    );
    const totalClasses = parseInt(classesCountRes.rows[0].total, 10);

    // 3. Total Students (Enrolled in teacher's courses or classes)
    const studentsCountRes = await query(
      `SELECT COUNT(DISTINCT e."studentId") AS total 
       FROM "public"."enrollments" e
       JOIN "public"."courses" c ON c.id = e."courseId"
       WHERE c."teacherId" = ANY($1) AND e.status = 'ACTIVE'`,
      [teacherIds]
    );
    const totalStudents = parseInt(studentsCountRes.rows[0].total, 10);

    // 4. Total Earnings
    const earningsRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total 
       FROM "public"."payments" 
       WHERE "teacherId" = ANY($1) AND status = 'VERIFIED'`,
      [teacherIds]
    );
    const totalEarnings = parseFloat(earningsRes.rows[0].total);

    // 5. Active Classes
    const activeClassesRes = await query(
      `SELECT cl.*, 
              c.title AS "courseTitle",
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."classId" = cl.id) AS "enrolledCount"
       FROM "public"."classes" cl
       LEFT JOIN "public"."courses" c ON c.id = cl."courseId"
       WHERE cl."teacherId" = ANY($1) AND cl."isActive" = true
       ORDER BY cl."createdAt" DESC
       LIMIT 5`,
      [teacherIds]
    );

    // 6. Recent Submissions
    const submissionsRes = await query(
      `SELECT s.*, 
              u."firstName" AS "studentFirstName", 
              u."lastName" AS "studentLastName",
              u."avatarUrl" AS "studentAvatar",
              a.title AS "assignmentTitle"
       FROM "public"."assignment_submissions" s
       JOIN "public"."assignments" a ON a.id = s."assignmentId"
       JOIN "public"."lessons" l ON l.id = a."lessonId"
       JOIN "public"."units" un ON un.id = l."unitId"
       JOIN "public"."courses" c ON c.id = un."courseId"
       JOIN "public"."users" u ON u.id = s."studentId"
       WHERE c."teacherId" = ANY($1)
       ORDER BY s."submittedAt" DESC
       LIMIT 5`,
      [teacherIds]
    );

    // 7. Expiring Soon Count
    const expiringRes = await query(
      `SELECT COUNT(*) AS total
       FROM "public"."enrollments" e
       JOIN "public"."courses" c ON c.id = e."courseId"
       WHERE c."teacherId" = ANY($1) 
         AND e.status = 'ACTIVE' 
         AND e."expiresAt" >= NOW() 
         AND e."expiresAt" <= NOW() + INTERVAL '7 days'`,
      [teacherIds]
    );
    const expiringSoonCount = parseInt(expiringRes.rows[0]?.total || 0, 10);

    // 8. Pending Payments Count
    const pendingPaymentsRes = await query(
      `SELECT COUNT(*) AS total FROM "public"."payments" WHERE "teacherId" = ANY($1) AND status = 'PENDING'`,
      [teacherIds]
    );
    const pendingPaymentsCount = parseInt(pendingPaymentsRes.rows[0]?.total || 0, 10);

    // 9. Pending Submissions Count
    const pendingSubmissionsRes = await query(
      `SELECT COUNT(*) AS total 
       FROM "public"."assignment_submissions" s
       JOIN "public"."assignments" a ON a.id = s."assignmentId"
       JOIN "public"."lessons" l ON l.id = a."lessonId"
       JOIN "public"."units" un ON un.id = l."unitId"
       JOIN "public"."courses" c ON c.id = un."courseId"
       WHERE c."teacherId" = ANY($1) AND s.status = 'SUBMITTED'`,
      [teacherIds]
    );
    const pendingSubmissionsCount = parseInt(pendingSubmissionsRes.rows[0]?.total || 0, 10);

    // 10. Recent Payments
    const paymentsRes = await query(
      `SELECT p.id, p.amount, p.currency, p."paymentMethod", p."transactionRef" AS "referenceNumber",
              p."receiptUrl" AS "proofUrl", p.notes, p."createdAt",
              u."firstName", u."lastName", u.email,
              c.title AS "courseTitle", c.level AS "courseLevel"
       FROM "public"."payments" p
       LEFT JOIN "public"."users" u ON u.id = p."studentId"
       LEFT JOIN "public"."enrollments" e ON e.id = p."enrollmentId"
       LEFT JOIN "public"."courses" c ON c.id = e."courseId"
       WHERE p."teacherId" = ANY($1) AND p.status = 'PENDING'
       ORDER BY p."createdAt" DESC
       LIMIT 5`,
      [teacherIds]
    );

    const upcomingClasses = activeClassesRes.rows.map((c) => ({
      id: c.id,
      name: c.name,
      schedule: c.description || 'Mon, Wed, Fri at 6:00 PM GMT',
      _count: {
        enrollments: parseInt(c.enrolledCount || 0, 10),
      },
    }));

    const recentPayments = paymentsRes.rows.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod || 'Manual',
      referenceNumber: p.referenceNumber || 'N/A',
      proofUrl: p.proofUrl || undefined,
      notes: p.notes || undefined,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      user: {
        firstName: p.firstName || 'Student',
        lastName: p.lastName || '',
        email: p.email || '',
      },
      course: p.courseTitle ? {
        title: p.courseTitle,
        level: p.courseLevel || 'A1',
      } : undefined,
    }));

    const recentSubmissions = submissionsRes.rows.map((s) => ({
      id: s.id,
      submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : new Date().toISOString(),
      status: s.status,
      assignment: {
        title: s.assignmentTitle || 'Course Assignment',
        maxScore: s.maxScore || 100,
      },
      student: {
        firstName: s.studentFirstName || 'Student',
        lastName: s.studentLastName || '',
      },
    }));

    const skillProficiency = [
      { skill: 'Grammar', score: 82 },
      { skill: 'Speaking', score: 75 },
      { skill: 'Listening', score: 88 },
      { skill: 'Reading', score: 91 },
      { skill: 'Writing', score: 78 },
      { skill: 'Vocabulary', score: 85 },
    ];

    return {
      totalCourses,
      totalClasses,
      totalStudents,
      pendingPaymentsCount,
      pendingSubmissionsCount,
      expiringStudentsCount: expiringSoonCount,
      totalEarnings,
      recentPayments,
      recentSubmissions,
      upcomingClasses,
      skillProficiency,
      // Nested stats for backwards-compatibility
      stats: {
        totalCourses,
        totalStudents,
        totalClasses,
        totalEarnings,
        expiringSoonCount,
        pendingPaymentsCount,
        pendingSubmissionsCount,
      },
      activeClasses: activeClassesRes.rows,
      skillsRadar: skillProficiency,
    };
  }

  /**
   * Get teacher's courses
   */
  static async getCourses(teacherId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);
    const res = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM "public"."units" un WHERE un."courseId" = c.id) AS "unitCount",
              (SELECT COUNT(*) FROM "public"."lessons" l JOIN "public"."units" un ON un.id = l."unitId" WHERE un."courseId" = c.id) AS "lessonCount",
              (SELECT COUNT(*) FROM "public"."enrollments" e WHERE e."courseId" = c.id) AS "enrollmentCount",
              (SELECT COUNT(*) FROM "public"."classes" cl WHERE cl."courseId" = c.id) AS "classCount"
       FROM "public"."courses" c
       WHERE c."teacherId" = ANY($1)
       ORDER BY c."createdAt" DESC`,
      [teacherIds]
    );

    const courseIds = res.rows.map((c) => c.id);
    let units = [];
    let lessons = [];

    if (courseIds.length > 0) {
      const unitsRes = await query(
        `SELECT * FROM "public"."units" WHERE "courseId" = ANY($1) ORDER BY "orderIndex" ASC`,
        [courseIds]
      );
      units = unitsRes.rows;
      const unitIds = units.map((u) => u.id);

      if (unitIds.length > 0) {
        const lessonsRes = await query(
          `SELECT id, "unitId", title, skill, skills, "orderIndex", "estimatedMinutes", "isPublished" 
           FROM "public"."lessons" 
           WHERE "unitId" = ANY($1) 
           ORDER BY "orderIndex" ASC`,
          [unitIds]
        );
        lessons = lessonsRes.rows;
      }
    }

    return res.rows.map((course) => {
      const courseUnits = units
        .filter((u) => u.courseId === course.id)
        .map((unit) => ({
          ...unit,
          lessons: lessons
            .filter((l) => l.unitId === unit.id)
            .map((l) => ({
              ...l,
              skills: parsePgArray(l.skills),
            })),
        }));

      const unitCount = parseInt(course.unitCount || 0, 10);
      const lessonCount = parseInt(course.lessonCount || 0, 10);
      const enrollmentCount = parseInt(course.enrollmentCount || 0, 10);
      const classCount = parseInt(course.classCount || 0, 10);

      return {
        ...course,
        published: Boolean(course.isPublished),
        isPublished: Boolean(course.isPublished),
        units: courseUnits,
        unitCount,
        lessonCount,
        _count: {
          units: unitCount,
          lessons: lessonCount,
          enrollments: enrollmentCount,
          classes: classCount,
        },
      };
    });
  }

  /**
   * Get full course details with curriculum (units, lessons, sections)
   */
  static async getCourseById(teacherId, courseId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);
    const courseRes = await query(
      `SELECT c.* 
       FROM "public"."courses" c
       WHERE c.id = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [courseId, teacherIds]
    );

    if (courseRes.rows.length === 0) return null;
    const course = courseRes.rows[0];

    // Units
    const unitsRes = await query(
      `SELECT * FROM "public"."units" WHERE "courseId" = $1 ORDER BY "orderIndex" ASC`,
      [courseId]
    );

    const unitIds = unitsRes.rows.map((u) => u.id);
    let lessons = [];
    let sections = [];
    let assignments = [];
    let quizzes = [];

    if (unitIds.length > 0) {
      const lessonsRes = await query(
        `SELECT * FROM "public"."lessons" WHERE "unitId" = ANY($1) ORDER BY "orderIndex" ASC`,
        [unitIds]
      );
      lessons = lessonsRes.rows;
      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length > 0) {
        const sectionsRes = await query(
          `SELECT * FROM "public"."lesson_sections" WHERE "lessonId" = ANY($1) ORDER BY "orderIndex" ASC`,
          [lessonIds]
        );
        sections = sectionsRes.rows;

        const assignmentsRes = await query(
          `SELECT * FROM "public"."assignments" WHERE "lessonId" = ANY($1)`,
          [lessonIds]
        );
        assignments = assignmentsRes.rows;

        const quizzesRes = await query(
          `SELECT * FROM "public"."quizzes" WHERE "lessonId" = ANY($1)`,
          [lessonIds]
        );
        quizzes = quizzesRes.rows;
      }
    }

    course.units = unitsRes.rows.map((unit) => ({
      ...unit,
      lessons: lessons
        .filter((l) => l.unitId === unit.id)
        .map((lesson) => ({
          ...lesson,
          skills: parsePgArray(lesson.skills),
          sections: sections.filter((s) => s.lessonId === lesson.id),
          assignments: assignments.filter((a) => a.lessonId === lesson.id),
          quizzes: quizzes.filter((q) => q.lessonId === lesson.id),
        })),
    }));

    return course;
  }

  /**
   * Add unit to course
   */
  static async addUnit(courseId, { title, description = '', orderIndex = 0 }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."units" (id, "courseId", title, description, "orderIndex", "isPublished", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING *`,
      [id, courseId, title, description, orderIndex]
    );
    return res.rows[0];
  }

  /**
   * Add lesson to unit
   */
  static async addLesson(unitId, { title, description = '', skill = 'GRAMMAR', skills = [], orderIndex = 0, estimatedMinutes = 30 }) {
    const id = crypto.randomUUID();
    const res = await query(
      `INSERT INTO "public"."lessons" 
        (id, "unitId", title, description, skill, skills, "orderIndex", "estimatedMinutes", "isPublished", "isFreePreview", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, NOW(), NOW())
       RETURNING *`,
      [id, unitId, title, description, skill, skills, orderIndex, estimatedMinutes]
    );
    return res.rows[0];
  }

  /**
   * List enrolled students for a teacher (across all their courses)
   * GET /api/v1/teacher/students
   */
  static async getStudents(teacherId, { search = '' } = {}) {
    const teacherIds = await this.resolveTeacherIds(teacherId);
    const searchTerm = `%${search}%`;
    const res = await query(
      `SELECT e.id AS "enrollmentId",
              e."studentId",
              e."courseId",
              e."classId",
              e.status AS "enrollmentStatus",
              e."enrolledAt",
              e."expiresAt",
              u.id AS "userId",
              u."firstName",
              u."lastName",
              u.email,
              sp."currentLevel",
              sp."targetLevel",
              c.id AS "courseIdRef",
              c.title AS "courseTitle",
              c.level AS "courseLevel",
              cl.id AS "classIdRef",
              cl.name AS "className"
       FROM "public"."enrollments" e
       JOIN "public"."courses" c ON c.id = e."courseId"
       JOIN "public"."users" u ON u.id = e."studentId"
       LEFT JOIN "public"."student_profiles" sp ON sp."userId" = u.id
       LEFT JOIN "public"."classes" cl ON cl.id = e."classId"
       WHERE c."teacherId" = ANY($1)
         AND ($2 = '' OR u."firstName" ILIKE $2 OR u."lastName" ILIKE $2 OR u.email ILIKE $2)
       ORDER BY u."firstName" ASC, u."lastName" ASC`,
      [teacherIds, searchTerm]
    );

    return res.rows.map((r) => ({
      id: r.enrollmentId,
      studentId: r.studentId,
      userId: r.userId,
      courseId: r.courseId,
      classId: r.classId,
      status: r.enrollmentStatus,
      enrolledAt: r.enrolledAt,
      expiresAt: r.expiresAt,
      user: {
        id: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        studentProfile: r.currentLevel
          ? { currentLevel: r.currentLevel, targetLevel: r.targetLevel }
          : undefined,
      },
      course: {
        id: r.courseId,
        title: r.courseTitle,
        level: r.courseLevel,
      },
      class: r.classId ? { id: r.classId, name: r.className } : undefined,
    }));
  }

  /**
   * Get a single student's full learning profile + progress for a teacher.
   * GET /api/v1/teacher/students/:studentId/progress
   * Only returns data if the student is enrolled in one of the teacher's courses.
   */
  static async getStudentProgress(teacherId, studentId) {
    const teacherIds = await this.resolveTeacherIds(teacherId);

    const ownerRes = await query(
      `SELECT e."studentId"
       FROM "public"."enrollments" e
       JOIN "public"."courses" c ON c.id = e."courseId"
       WHERE e."studentId" = $1 AND c."teacherId" = ANY($2)
       LIMIT 1`,
      [studentId, teacherIds]
    );
    if (ownerRes.rows.length === 0) return null;

    const userRes = await query(
      `SELECT u.id, u."firstName", u."lastName", u.email,
              sp."currentLevel", sp."targetLevel", sp."nativeLanguage"
       FROM "public"."users" u
       LEFT JOIN "public"."student_profiles" sp ON sp."userId" = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [studentId]
    );
    if (userRes.rows.length === 0) return null;
    const u = userRes.rows[0];

    // Enrollments tied to teacher's courses (with nested units/lessons)
    const enrollRes = await query(
      `SELECT e.id, e."classId", e.status, e."enrolledAt", e."expiresAt",
              c.id AS "courseIdRef", c.title AS "courseTitle", c.level AS "courseLevel",
              cl.id AS "classIdRef", cl.name AS "className"
       FROM "public"."enrollments" e
       JOIN "public"."courses" c ON c.id = e."courseId"
       LEFT JOIN "public"."classes" cl ON cl.id = e."classId"
       WHERE e."studentId" = $1 AND c."teacherId" = ANY($2)
       ORDER BY e."enrolledAt" DESC`,
      [studentId, teacherIds]
    );
    const enrollments = [];
    const courseIds = enrollRes.rows.map((r) => r.courseIdRef]);

    if (courseIds.length > 0) {
      const unitsRes = await query(
        `SELECT u.id, u."courseId", u.title
         FROM "public"."units" u
         WHERE u."courseId" = ANY($1) ORDER BY u."orderIndex" ASC`,
        [courseIds]
      );
      const unitIds = unitsRes.rows.map((x) => x.id);
      let lessons = [];
      if (unitIds.length > 0) {
        const lessonsRes = await query(
          `SELECT l.id, l."unitId", l.title, l."estimatedMinutes", l.skill
           FROM "public"."lessons" l
           WHERE l."unitId" = ANY($1) ORDER BY l."orderIndex" ASC`,
          [unitIds]
        );
        lessons = lessonsRes.rows;
      }
      for (const r of enrollRes.rows) {
        const units = unitsRes.rows
          .filter((x) => x.courseId === r.courseIdRef)
          .map((x) => ({
            id: x.id,
            title: x.title,
            lessons: lessons
              .filter((l) => l.unitId === x.id)
              .map((l) => ({
                id: l.id,
                title: l.title,
                durationMinutes: l.estimatedMinutes,
                skillType: l.skill,
              })),
          }));
        enrollments.push({
          id: r.id,
          classId: r.classId,
          status: r.status,
          enrolledAt: r.enrolledAt,
          expiresAt: r.expiresAt,
          class: r.classIdRef ? { id: r.classIdRef, name: r.className } : undefined,
          course: {
            id: r.courseIdRef,
            title: r.courseTitle,
            level: r.courseLevel,
            units,
          },
        });
      }
    }

    // Lesson progress (restricted to teacher's courses)
    const progressRes = await query(
      `SELECT p.id, p."isCompleted", p."completedAt", p."timeSpentSec", p.score,
              l.title AS "lessonTitle", l.skill
       FROM "public"."progress" p
       JOIN "public"."lessons" l ON l.id = p."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE p."studentId" = $1 AND c."teacherId" = ANY($2)
       ORDER BY p."completedAt" DESC`,
      [studentId, teacherIds]
    );
    const lessonProgress = progressRes.rows.map((p) => ({
      id: p.id,
      completed: p.isCompleted,
      completedAt: p.completedAt,
      timeSpentSeconds: p.timeSpentSec || 0,
      score: p.score ? Number(p.score) : null,
      lesson: {
        title: p.lessonTitle,
        skillType: p.skill,
      },
    }));

    // Quiz attempts (restricted to teacher's courses)
    const quizRes = await query(
      `SELECT qa.id, qa.score, qa.passed, qa."completedAt",
              q.title AS "quizTitle", q."passingScore"
       FROM "public"."quiz_attempts" qa
       JOIN "public"."quizzes" q ON q.id = qa."quizId"
       JOIN "public"."lessons" l ON l.id = q."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE qa."studentId" = $1 AND c."teacherId" = ANY($2)
       ORDER BY qa."completedAt" DESC`,
      [studentId, teacherIds]
    );
    const quizAttempts = quizRes.rows.map((qa) => ({
      id: qa.id,
      score: qa.score !== null ? Number(qa.score) : null,
      passed: qa.passed,
      completedAt: qa.completedAt,
      quiz: {
        title: qa.quizTitle,
        passingScore: qa.passingScore,
      },
    }));

    // Assignment submissions (restricted to teacher's courses)
    const assignRes = await query(
      `SELECT s.id, s.score, s.status, s."submittedAt",
              a.title AS "assignmentTitle", a."maxScore", a."skillType"
       FROM "public"."assignment_submissions" s
       JOIN "public"."assignments" a ON a.id = s."assignmentId"
       JOIN "public"."lessons" l ON l.id = a."lessonId"
       JOIN "public"."units" u ON u.id = l."unitId"
       JOIN "public"."courses" c ON c.id = u."courseId"
       WHERE s."studentId" = $1 AND c."teacherId" = ANY($2)
       ORDER BY s."submittedAt" DESC`,
      [studentId, teacherIds]
    );
    const assignmentSubmissions = assignRes.rows.map((s) => ({
      id: s.id,
      score: s.score !== null ? Number(s.score) : null,
      status: s.status,
      submittedAt: s.submittedAt,
      assignment: {
        title: s.assignmentTitle,
        maxScore: s.maxScore,
        skillType: s.skillType,
      },
    }));

    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      studentProfile: {
        currentLevel: u.currentLevel,
        targetLevel: u.targetLevel,
        nativeLanguage: u.nativeLanguage,
      },
      enrollments,
      lessonProgress,
      quizAttempts,
      assignmentSubmissions,
    };
  }
}
