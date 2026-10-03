import { query } from '../config/database.js';
import { LiveSessionModel } from '../models/live-session.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { SocketService } from './socket.service.js';

export class LiveSessionSchedulerService {
  static intervalId = null;
  static isChecking = false;

  /**
   * Start recurring background checker for scheduled live classes.
   * Default interval: 10 seconds.
   */
  static startScheduler(intervalMs = 10000) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    console.log('🕒 Live Class Scheduler initialized (monitoring scheduled sessions every 10s)...');

    // Run first check after a brief server start delay (3s)
    setTimeout(() => {
      this.checkAndActivateDueSessions().catch((err) => {
        console.error('Error during initial live session check:', err.message);
      });
    }, 3000);

    this.intervalId = setInterval(() => {
      this.checkAndActivateDueSessions().catch((err) => {
        console.error('Error in LiveSessionScheduler check:', err.message);
      });
    }, intervalMs);
  }

  static stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check and auto-activate any scheduled live classes whose scheduledAt time has arrived
   */
  static async checkAndActivateDueSessions() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      // Find all upcoming sessions whose scheduledAt is due (<= NOW())
      const dueRes = await query(
        `SELECT id, "teacherId", title, topic, type, "scheduledAt"
         FROM "public"."live_sessions"
         WHERE status = 'UPCOMING'
           AND "scheduledAt" IS NOT NULL
           AND "scheduledAt" <= NOW()
         ORDER BY "scheduledAt" ASC`
      );

      if (dueRes.rows.length === 0) {
        return;
      }

      for (const dueSession of dueRes.rows) {
        // Concurrency-safe atomic state transition from UPCOMING to LIVE
        const updateRes = await query(
          `UPDATE "public"."live_sessions"
           SET status = 'LIVE',
               "startedAt" = COALESCE("startedAt", NOW()),
               "updatedAt" = NOW()
           WHERE id = $1 AND status = 'UPCOMING'
           RETURNING *`,
          [dueSession.id]
        );

        if (updateRes.rows.length === 0) {
          // Already transitioned by another process
          continue;
        }

        console.log(`\n🔴 [Auto-Activate Live Class] Scheduled session "${dueSession.title}" is now DUE and has been AUTO-ACTIVATED (ID: ${dueSession.id})`);

        // Reset any participants marked 'LEFT' back to 'INVITED' so they can enter the room
        await query(
          `UPDATE "public"."live_session_participants"
           SET status = 'INVITED', "leftAt" = NULL
           WHERE "sessionId" = $1 AND status = 'LEFT'`,
          [dueSession.id]
        );

        // Fetch full session details including participants and teacher profile
        const fullSession = await LiveSessionModel.getSessionById(dueSession.id);
        if (!fullSession) continue;

        const teacherName = fullSession.teacher
          ? `${fullSession.teacher.firstName || ''} ${fullSession.teacher.lastName || ''}`.trim() || 'Your Teacher'
          : 'Your Instructor';

        const joinUrl = `/live/${fullSession.id}`;

        // 1. Push notifications to all invited students
        for (const p of fullSession.participants) {
          if (!p.studentId) continue;
          try {
            // Save in-app notification record in DB
            const notif = await NotificationModel.create({
              userId: p.studentId,
              title: '🔴 Live Class Is Now Active!',
              message: `Your scheduled class "${fullSession.title}" with ${teacherName} is now live and waiting for you to join.`,
              type: 'LIVE_SESSION',
              link: joinUrl,
            });

            // Emit real-time Socket.IO events directly to student's user room
            SocketService.emitToUser(p.studentId, 'notification:new', notif);
            SocketService.emitToUser(p.studentId, 'live:session-started', {
              sessionId: fullSession.id,
              session: fullSession,
              title: fullSession.title,
              teacherName,
              joinUrl,
              message: `Your scheduled class "${fullSession.title}" is now active! All students are entering the classroom.`,
            });
            SocketService.emitToUser(p.studentId, 'live:session-status-changed', {
              sessionId: fullSession.id,
              status: 'LIVE',
              session: fullSession,
            });
          } catch (notifErr) {
            console.error(`Error notifying student ${p.studentId} for live session ${dueSession.id}:`, notifErr.message);
          }
        }

        // 2. Push notification to the teacher
        try {
          const teacherNotif = await NotificationModel.create({
            userId: fullSession.teacherId,
            title: '🔴 Scheduled Live Class Activated',
            message: `Your scheduled live class "${fullSession.title}" is due and has been auto-activated. Students are entering the waiting room!`,
            type: 'LIVE_SESSION',
            link: joinUrl,
          });

          SocketService.emitToUser(fullSession.teacherId, 'notification:new', teacherNotif);
          SocketService.emitToUser(fullSession.teacherId, 'live:session-started', {
            sessionId: fullSession.id,
            session: fullSession,
            title: fullSession.title,
            teacherName,
            joinUrl,
            message: `Your class "${fullSession.title}" has been auto-activated. Click to join the room.`,
          });
          SocketService.emitToUser(fullSession.teacherId, 'live:session-status-changed', {
            sessionId: fullSession.id,
            status: 'LIVE',
            session: fullSession,
          });
        } catch (tErr) {
          console.error(`Error notifying teacher ${fullSession.teacherId}:`, tErr.message);
        }

        // 3. Broadcast status change to live session room and all connected sockets
        SocketService.emitToRoom(`room:live-session:${fullSession.id}`, 'live:session-status-changed', {
          sessionId: fullSession.id,
          status: 'LIVE',
          session: fullSession,
        });

        SocketService.broadcast('live:session-status-changed', {
          sessionId: fullSession.id,
          status: 'LIVE',
          session: fullSession,
        });
      }
    } finally {
      this.isChecking = false;
    }
  }
}
