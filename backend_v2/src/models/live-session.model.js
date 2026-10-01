import { query } from '../config/database.js';
import { TeacherModel } from './teacher.model.js';

export class LiveSessionModel {
  /**
   * Get all eligible students for live session invitation (enrolled with teacher prioritized)
   */
  static async getAvailableStudents(teacherId, search = '') {
    const teacherIds = await TeacherModel.resolveTeacherIds(teacherId);
    const hasSearch = Boolean(search && search.trim());
    const searchTerm = hasSearch ? `%${search.trim()}%` : '';

    const res = await query(
      `SELECT DISTINCT ON (u.id)
        u.id AS "userId",
        u."firstName",
        u."lastName",
        u.email,
        u."avatarUrl",
        sp."currentLevel",
        sp."targetLevel",
        l.name AS "levelName",
        l.code AS "levelCode",
        EXISTS (
          SELECT 1 FROM "enrollments" e
          JOIN "courses" c ON c.id = e."courseId"
          WHERE (e."studentId" = u.id OR e."studentId" = sp.id)
            AND c."teacherId" = ANY($1)
            AND e.status = 'ACTIVE'
        ) AS "enrolledWithTeacher"
       FROM "users" u
       LEFT JOIN "student_profiles" sp ON sp."userId" = u.id
       LEFT JOIN "levels" l ON l.id = sp."levelId"
       WHERE u.role = 'STUDENT'
         AND (
           $2 = ''
           OR (COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')) ILIKE $2
           OR COALESCE(u.email, '') ILIKE $2
           OR COALESCE(l.name, '') ILIKE $2
           OR COALESCE(l.code, '') ILIKE $2
           OR COALESCE(sp."currentLevel", '') ILIKE $2
           OR COALESCE(sp."targetLevel", '') ILIKE $2
         )
       ORDER BY u.id, u."firstName" ASC`,
      [teacherIds, searchTerm]
    );

    return res.rows.sort((a, b) => {
      if (a.enrolledWithTeacher && !b.enrolledWithTeacher) return -1;
      if (!a.enrolledWithTeacher && b.enrolledWithTeacher) return 1;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }

  /**
   * Create a new live session with invited participants
   */
  static async createSession({
    teacherId,
    title,
    topic = '',
    type = 'ONE_ON_ONE',
    studentIds = [],
    scheduledAt = new Date(),
  }) {
    // 1. Insert live session
    const sessionRes = await query(
      `INSERT INTO "live_sessions" 
        ("teacherId", title, topic, type, status, "scheduledAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'UPCOMING', $5, NOW(), NOW())
       RETURNING *`,
      [teacherId, title, topic, type, scheduledAt]
    );

    const session = sessionRes.rows[0];

    // 2. Insert participants
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      for (const studentId of studentIds) {
        if (!studentId) continue;
        await query(
          `INSERT INTO "live_session_participants" 
            ("sessionId", "studentId", status, "createdAt")
           VALUES ($1, $2, 'INVITED', NOW())
           ON CONFLICT ("sessionId", "studentId") DO NOTHING`,
          [session.id, studentId]
        );
      }
    }

    return this.getSessionById(session.id);
  }

  /**
   * Fetch complete session details including teacher and participants
   */
  static async getSessionById(sessionId) {
    const sessionRes = await query(
      `SELECT 
        s.*,
        u."firstName" AS "teacherFirstName",
        u."lastName" AS "teacherLastName",
        u.email AS "teacherEmail",
        u."avatarUrl" AS "teacherAvatarUrl"
       FROM "live_sessions" s
       JOIN "users" u ON u.id = s."teacherId"
       WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return null;
    }

    const session = sessionRes.rows[0];

    // Fetch participants
    const participantsRes = await query(
      `SELECT 
        p.id AS "participantId",
        p."sessionId",
        p."studentId",
        p.status,
        p."joinedAt",
        p."leftAt",
        p."createdAt",
        u."firstName",
        u."lastName",
        u.email,
        u."avatarUrl"
       FROM "live_session_participants" p
       JOIN "users" u ON u.id = p."studentId"
       WHERE p."sessionId" = $1
       ORDER BY u."firstName" ASC`,
      [sessionId]
    );

    return {
      ...session,
      teacher: {
        id: session.teacherId,
        firstName: session.teacherFirstName,
        lastName: session.teacherLastName,
        email: session.teacherEmail,
        avatarUrl: session.teacherAvatarUrl,
      },
      participants: participantsRes.rows,
    };
  }

  /**
   * Get all live sessions for a teacher
   */
  static async getTeacherSessions(teacherId) {
    const res = await query(
      `SELECT 
        s.*,
        (SELECT COUNT(*) FROM "live_session_participants" p WHERE p."sessionId" = s.id) AS "participantCount",
        (SELECT COUNT(*) FROM "live_session_participants" p WHERE p."sessionId" = s.id AND p.status = 'JOINED') AS "activeParticipantCount"
       FROM "live_sessions" s
       WHERE s."teacherId" = $1
       ORDER BY 
         CASE 
           WHEN s.status = 'LIVE' THEN 1
           WHEN s.status = 'UPCOMING' THEN 2
           ELSE 3
         END,
         s."createdAt" DESC`,
      [teacherId]
    );

    // Populate light participant roster for preview
    const sessions = res.rows;
    for (const session of sessions) {
      const partRes = await query(
        `SELECT 
          p."studentId",
          p.status,
          u."firstName",
          u."lastName",
          u.email,
          u."avatarUrl"
         FROM "live_session_participants" p
         JOIN "users" u ON u.id = p."studentId"
         WHERE p."sessionId" = $1
         LIMIT 6`,
        [session.id]
      );
      session.participants = partRes.rows;
    }

    return sessions;
  }

  /**
   * Get all live sessions for a student
   */
  static async getStudentSessions(studentId) {
    const res = await query(
      `SELECT 
        s.*,
        p.status AS "participantStatus",
        p."joinedAt",
        p."leftAt",
        u."firstName" AS "teacherFirstName",
        u."lastName" AS "teacherLastName",
        u.email AS "teacherEmail",
        u."avatarUrl" AS "teacherAvatarUrl",
        (SELECT COUNT(*) FROM "live_session_participants" p2 WHERE p2."sessionId" = s.id) AS "participantCount"
       FROM "live_sessions" s
       JOIN "live_session_participants" p ON p."sessionId" = s.id
       JOIN "users" u ON u.id = s."teacherId"
       WHERE p."studentId" = $1
       ORDER BY 
         CASE 
           WHEN s.status = 'LIVE' THEN 1
           WHEN s.status = 'UPCOMING' THEN 2
           ELSE 3
         END,
         s."createdAt" DESC`,
      [studentId]
    );

    return res.rows.map((row) => ({
      ...row,
      teacher: {
        id: row.teacherId,
        firstName: row.teacherFirstName,
        lastName: row.teacherLastName,
        email: row.teacherEmail,
        avatarUrl: row.teacherAvatarUrl,
      },
    }));
  }

  /**
   * Teacher starts a session
   */
  static async startSession(sessionId, teacherId) {
    const sessionRes = await query(
      `SELECT * FROM "live_sessions" WHERE id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionRes.rows[0];
    if (session.teacherId !== teacherId) {
      throw new Error('Unauthorized: Only the creator teacher can start this session');
    }

    if (session.status === 'ENDED') {
      throw new Error('This session has already ended');
    }

    await query(
      `UPDATE "live_sessions" 
       SET status = 'LIVE', "startedAt" = COALESCE("startedAt", NOW()), "updatedAt" = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    return this.getSessionById(sessionId);
  }

  /**
   * Teacher ends a session
   */
  static async endSession(sessionId, teacherId) {
    const sessionRes = await query(
      `SELECT * FROM "live_sessions" WHERE id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionRes.rows[0];
    if (session.teacherId !== teacherId) {
      throw new Error('Unauthorized: Only the creator teacher can end this session');
    }

    await query(
      `UPDATE "live_sessions" 
       SET status = 'ENDED', "endedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Mark active participants as left
    await query(
      `UPDATE "live_session_participants" 
       SET status = 'LEFT', "leftAt" = NOW()
       WHERE "sessionId" = $1 AND status = 'JOINED'`,
      [sessionId]
    );

    return this.getSessionById(sessionId);
  }

  /**
   * Update participant status
   */
  static async updateParticipantStatus(sessionId, studentId, status) {
    const updates = ['status = $3'];
    const values = [sessionId, studentId, status];

    if (status === 'JOINED') {
      updates.push('"joinedAt" = NOW()');
    } else if (status === 'LEFT' || status === 'REMOVED') {
      updates.push('"leftAt" = NOW()');
    }

    await query(
      `UPDATE "live_session_participants"
       SET ${updates.join(', ')}
       WHERE "sessionId" = $1 AND "studentId" = $2`,
      values
    );

    return this.getSessionById(sessionId);
  }

  /**
   * Teacher removes a participant
   */
  static async removeParticipant(sessionId, teacherId, studentId) {
    const sessionRes = await query(
      `SELECT * FROM "live_sessions" WHERE id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionRes.rows[0];
    if (session.teacherId !== teacherId) {
      throw new Error('Unauthorized: Only the creator teacher can remove participants');
    }

    await query(
      `UPDATE "live_session_participants"
       SET status = 'REMOVED', "leftAt" = NOW()
       WHERE "sessionId" = $1 AND "studentId" = $2`,
      [sessionId, studentId]
    );

    return this.getSessionById(sessionId);
  }

  /**
   * Verify access permissions
   */
  static async verifyAccess(sessionId, userId, userRole) {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      return { allowed: false, reason: 'Session not found' };
    }

    if (userRole === 'SUPERADMIN') {
      return { allowed: true, isTeacher: true, session };
    }

    if (session.teacherId === userId) {
      return { allowed: true, isTeacher: true, session };
    }

    // Check student participant
    const isInvited = session.participants.some(
      (p) => p.studentId === userId && p.status !== 'REMOVED'
    );

    if (isInvited) {
      return { allowed: true, isTeacher: false, session };
    }

    return { 
      allowed: false, 
      reason: 'Unauthorized: You are not an invited participant in this live session' 
    };
  }
}
