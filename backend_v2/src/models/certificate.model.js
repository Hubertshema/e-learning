import { query } from '../config/database.js';
import crypto from 'crypto';

export class CertificateModel {
  /**
   * Get all certificates for a student
   */
  static async getStudentCertificates(studentId) {
    // DISTINCT ON courseId — returns only the latest certificate per course
    const res = await query(
      `SELECT DISTINCT ON (cert."courseId")
         cert.id, cert."certificateCode", cert."levelCompleted", cert."finalGrade", cert."issueDate",
         c.title as "courseTitle", c.level as "courseLevel",
         u."firstName" as "teacherFirstName", u."lastName" as "teacherLastName"
       FROM "public"."certificates" cert
       JOIN "public"."courses" c ON c.id = cert."courseId"
       LEFT JOIN "public"."users" u ON u.id = c."teacherId"
       WHERE cert."studentId" = $1
          OR cert."studentId" = (SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1)
       ORDER BY cert."courseId", cert."issueDate" DESC`,
      [studentId]
    );

    return res.rows.map(row => ({
      id: row.id,
      certificateCode: row.certificateCode,
      levelCompleted: row.levelCompleted,
      finalGrade: Number(row.finalGrade),
      issueDate: row.issueDate,
      course: {
        title: row.courseTitle,
        level: row.courseLevel,
        teacher: {
          user: {
            firstName: row.teacherFirstName,
            lastName: row.teacherLastName,
          }
        }
      }
    }));
  }

  /**
   * Check if a certificate already exists for this student and course
   */
  static async hasCertificate(studentId, courseId) {
    const res = await query(
      `SELECT id FROM "public"."certificates" WHERE ("studentId" = $1 OR "studentId" = (SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1)) AND "courseId" = $2 LIMIT 1`,
      [studentId, courseId]
    );
    return res.rows.length > 0;
  }

  /**
   * Issue a new certificate
   */
  static async issueCertificate(studentId, courseId, levelCompleted, finalGrade) {
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateCode = `FE-${year}-${randomSuffix}`; // FE-2026-ABCD

    const res = await query(
      `INSERT INTO "public"."certificates"
         ("id", "studentId", "courseId", "certificateCode", "levelCompleted", "finalGrade", "issueDate")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT ("studentId", "courseId")
       DO UPDATE SET
         "certificateCode" = EXCLUDED."certificateCode",
         "levelCompleted"  = EXCLUDED."levelCompleted",
         "finalGrade"      = EXCLUDED."finalGrade",
         "issueDate"       = EXCLUDED."issueDate"
       RETURNING *`,
      [id, studentId, courseId, certificateCode, levelCompleted, finalGrade]
    );
    return res.rows[0];
  }
  /**
   * Check if course is completed after a lesson and issue a certificate
   */
  static async checkAndIssueForLesson(studentId, lessonId) {
    try {
      const lessonRes = await query(
        `SELECT u."courseId" FROM "public"."lessons" l JOIN "public"."units" u ON u.id = l."unitId" WHERE l.id = $1 LIMIT 1`,
        [lessonId]
      );
      
      if (lessonRes.rows.length === 0) return null;
      
      const courseId = lessonRes.rows[0].courseId;
      const hasCert = await this.hasCertificate(studentId, courseId);
      
      if (hasCert) return null; // Already has certificate

      // Get profile ID for this student
      let studentProfileId = null;
      try {
        const profile = await query(`SELECT id FROM "public"."student_profiles" WHERE "userId" = $1 LIMIT 1`, [studentId]);
        if (profile.rows.length > 0) studentProfileId = profile.rows[0].id;
      } catch (err) {}

      // Get all lessons for course
      const allLessonsRes = await query(
        `SELECT l.id FROM "public"."lessons" l JOIN "public"."units" u ON u.id = l."unitId" WHERE u."courseId" = $1`,
        [courseId]
      );
      const courseLessonIds = allLessonsRes.rows.map(r => r.id);
      
      if (courseLessonIds.length > 0) {
        const completedSet = new Set();
        
        const completedRes = await query(
          `SELECT "lessonId" FROM "public"."progress" WHERE ("studentId" = $1 OR "studentId" = $2) AND "isCompleted" = true`,
          [studentId, studentProfileId || studentId]
        );
        completedRes.rows.forEach(r => completedSet.add(r.lessonId));

        const ivCompletedRes = await query(
          `SELECT "lessonId" FROM "interactive_video_progress" WHERE ("studentId" = $1 OR "studentId" = $2) AND ("completionPercent" >= 90 OR "completedAt" IS NOT NULL)`,
          [studentId, studentProfileId || studentId]
        );
        ivCompletedRes.rows.forEach(r => completedSet.add(r.lessonId));

        const allCompleted = courseLessonIds.every(id => completedSet.has(id));
        
        if (allCompleted) {
          const cRes = await query(`SELECT level FROM "public"."courses" WHERE id = $1`, [courseId]);
          let cLevel = cRes.rows[0]?.level || 'A1';
          
          // Map numeric levels (1-6) to CEFR (A1-C2) if needed
          if (/^[1-6]$/.test(cLevel)) {
            const cefrMap = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            cLevel = cefrMap[parseInt(cLevel, 10) - 1];
          } else if (!/^[A-C][1-2]$/.test(cLevel)) {
            cLevel = 'A1'; // Fallback for invalid formats
          }

          const cert = await this.issueCertificate(studentProfileId || studentId, courseId, cLevel, 100);
          
          return { cert, courseId, allCompleted: true };
        }
      }
    } catch (err) {
      console.warn('Certificate generation warning:', err.message);
    }
    return null;
  }

  /**
   * Publicly verify a certificate by its unique code (e.g. FE-2026-6NEW)
   */
  static async verifyCertificate(code) {
    if (!code || typeof code !== 'string') return null;
    const cleanCode = code.trim().toUpperCase();

    const res = await query(
      `SELECT
         cert.id, cert."certificateCode", cert."levelCompleted", cert."finalGrade", cert."issueDate", cert."isRevoked",
         c.title as "courseTitle", c.level as "courseLevel",
         tu."firstName" as "teacherFirstName", tu."lastName" as "teacherLastName",
         su."firstName" as "studentFirstName", su."lastName" as "studentLastName"
       FROM "public"."certificates" cert
       JOIN "public"."courses" c ON c.id = cert."courseId"
       LEFT JOIN "public"."teacher_profiles" tp ON tp.id = c."teacherId"
       LEFT JOIN "public"."users" tu ON (tu.id = c."teacherId" OR tu.id = tp."userId")
       LEFT JOIN "public"."student_profiles" sp ON sp.id = cert."studentId"
       LEFT JOIN "public"."users" su ON (su.id = sp."userId" OR su.id = cert."studentId")
       WHERE UPPER(TRIM(cert."certificateCode")) = $1
       LIMIT 1`,
      [cleanCode]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const studentFullName = [row.studentFirstName, row.studentLastName].filter(Boolean).join(' ') || 'Verified Student';
    const instructorFullName = [row.teacherFirstName, row.teacherLastName].filter(Boolean).join(' ') || 'LinguaChris Faculty';

    return {
      id: row.id,
      certificateCode: row.certificateCode,
      studentName: studentFullName,
      courseTitle: row.courseTitle,
      levelCompleted: row.levelCompleted || 'A1',
      finalGrade: Number(row.finalGrade) || 100,
      issueDate: row.issueDate,
      instructorName: instructorFullName,
      status: row.isRevoked ? 'REVOKED' : 'VALID',
      isValid: !row.isRevoked,
      issuedBy: 'LinguaChris Academy Board of Accreditation',
    };
  }
}
