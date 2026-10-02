import { LiveSessionModel } from '../models/live-session.model.js';
import { emailService } from '../services/email.service.js';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { getIO } from '../config/socket.js';

export class LiveSessionController {
  /**
   * Helper to safely get Socket.IO instance
   */
  static getSocketSafe() {
    try {
      return getIO();
    } catch {
      return null;
    }
  }

  /**
   * GET /api/v1/live-sessions/students
   * Teacher retrieves eligible students to invite to a live session
   */
  static async getAvailableStudents(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const search = req.query.search || '';
      const students = await LiveSessionModel.getAvailableStudents(teacherId, search);
      return sendSuccess(res, students, 'Available students for live session retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/live-sessions
   * Teacher creates a new live session and invites students
   */
  static async createSession(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { title, topic, type, studentIds, scheduledAt } = req.body;

      if (!title || !title.trim()) {
        return sendError(res, 'Session title is required', 400, 'VALIDATION_ERROR');
      }

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return sendError(res, 'At least one student must be selected', 400, 'VALIDATION_ERROR');
      }

      const session = await LiveSessionModel.createSession({
        teacherId,
        title: title.trim(),
        topic: topic ? topic.trim() : '',
        type: type === 'GROUP' || studentIds.length > 1 ? 'GROUP' : 'ONE_ON_ONE',
        studentIds,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      });

      // Realtime notification to all invited students
      const io = LiveSessionController.getSocketSafe();
      if (io) {
        studentIds.forEach((studentId) => {
          io.to(`user:${studentId}`).emit('live:session-created', {
            session,
            message: `You have been invited to a live session: "${session.title}" by ${req.user.firstName || 'Teacher'}`,
          });
        });
      }

      // Dispatch calendar/session invite emails asynchronously
      query(`SELECT id, email, "firstName", "lastName" FROM "public"."users" WHERE id = ANY($1)`, [studentIds])
        .then((userRes) => {
          for (const student of userRes.rows) {
            const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
            emailService.sendLiveSessionInvitation({
              email: student.email,
              name: studentName,
              sessionTitle: session.title,
              scheduledAt: session.scheduledAt,
              joinUrl: `${env.FRONTEND_URL}/live-sessions`,
            }).catch((err) => console.error(`Error sending session invite to ${student.email}:`, err));
          }
        })
        .catch((err) => console.error('Error fetching students for live session email invites:', err));

      return sendSuccess(res, session, 'Live session created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/live-sessions/teacher
   * Teacher retrieves their live sessions
   */
  static async getTeacherSessions(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const sessions = await LiveSessionModel.getTeacherSessions(teacherId);
      return sendSuccess(res, sessions, 'Teacher live sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/live-sessions/student
   * Student retrieves sessions they are invited to
   */
  static async getStudentSessions(req, res, next) {
    try {
      const studentId = req.user.id || req.user.userId;
      const sessions = await LiveSessionModel.getStudentSessions(studentId);
      return sendSuccess(res, sessions, 'Student live sessions retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/live-sessions/:id
   * Get session details with authorization verification
   */
  static async getSessionDetails(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;

      const authResult = await LiveSessionModel.verifyAccess(id, userId, userRole);
      if (!authResult.allowed) {
        return sendError(res, authResult.reason || 'Access denied', 403, 'FORBIDDEN');
      }

      return sendSuccess(
        res,
        {
          ...authResult.session,
          isTeacher: authResult.isTeacher,
        },
        'Session details retrieved'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/live-sessions/:id/start
   * Teacher starts the live session
   */
  static async startSession(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { id } = req.params;

      const session = await LiveSessionModel.startSession(id, teacherId);

      const io = LiveSessionController.getSocketSafe();
      if (io) {
        // Broadcast to session room and notify invited students
        io.to(`room:live-session:${id}`).emit('live:session-status-changed', {
          sessionId: id,
          status: 'LIVE',
          session,
        });

        session.participants.forEach((p) => {
          io.to(`user:${p.studentId}`).emit('live:session-started', {
            sessionId: id,
            session,
            message: `The live session "${session.title}" has started! Join now.`,
          });
        });
      }

      return sendSuccess(res, session, 'Live session started');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/live-sessions/:id/end
   * Teacher ends the live session
   */
  static async endSession(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { id } = req.params;

      const session = await LiveSessionModel.endSession(id, teacherId);

      const io = LiveSessionController.getSocketSafe();
      if (io) {
        io.to(`room:live-session:${id}`).emit('live:session-ended', {
          sessionId: id,
          session,
          message: 'The teacher has ended this live session.',
        });

        session.participants.forEach((p) => {
          io.to(`user:${p.studentId}`).emit('live:session-ended', {
            sessionId: id,
            session,
          });
        });
      }

      return sendSuccess(res, session, 'Live session ended');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/live-sessions/:id/remove-participant
   * Teacher removes a student from the live session
   */
  static async removeParticipant(req, res, next) {
    try {
      const teacherId = req.user.id || req.user.userId;
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return sendError(res, 'studentId is required', 400, 'VALIDATION_ERROR');
      }

      const session = await LiveSessionModel.removeParticipant(id, teacherId, studentId);

      const io = LiveSessionController.getSocketSafe();
      if (io) {
        // Notify the specific student that they have been removed
        io.to(`user:${studentId}`).emit('live:kicked', {
          sessionId: id,
          message: 'You have been removed from this live session by the teacher.',
        });

        // Broadcast to the live room
        io.to(`room:live-session:${id}`).emit('live:participant-removed', {
          sessionId: id,
          studentId,
        });
      }

      return sendSuccess(res, session, 'Participant removed from live session');
    } catch (err) {
      next(err);
    }
  }
}
