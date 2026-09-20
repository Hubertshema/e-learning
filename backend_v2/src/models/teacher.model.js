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
}
