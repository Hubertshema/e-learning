import { LiveSessionModel } from '../models/live-session.model.js';
import { verifyAccessToken } from '../utils/jwt.util.js';

// In-memory active live room participant registry: sessionId -> Map<socketId, { socketId, user, isTeacher, isAudioMuted, isVideoOff }>
const activeRooms = new Map();

/**
 * Configure Real-time WebRTC Signaling and Session Handlers
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerLiveSessionHandlers(io, socket) {
  /**
   * Client joins a live session room
   */
  socket.on('live:join-room', async ({ sessionId, token }, callback) => {
    try {
      if (!socket.user && token) {
        try {
          socket.user = verifyAccessToken(token);
          console.log(`🔑 Authenticated socket ${socket.id} via fallback token for user ${socket.user.firstName}`);
        } catch (e) {
          console.warn('Fallback token verification in live:join-room failed:', e.message);
        }
      }

      if (!socket.user || !socket.user.id) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Authentication required' });
        }
        return socket.emit('live:error', { message: 'Authentication required' });
      }

      if (!sessionId) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Session ID is required' });
        }
        return;
      }

      // Security check: verify user has access
      const access = await LiveSessionModel.verifyAccess(
        sessionId,
        socket.user.id,
        socket.user.role
      );

      if (!access.allowed) {
        if (typeof callback === 'function') {
          callback({ success: false, error: access.reason || 'Unauthorized' });
        }
        return socket.emit('live:error', { message: access.reason || 'Unauthorized' });
      }

      const roomName = `room:live-session:${sessionId}`;
      socket.join(roomName);
      socket.currentLiveSessionId = sessionId;

      // If teacher enters an UPCOMING session, transition it to LIVE automatically
      if (access.isTeacher && access.session.status === 'UPCOMING') {
        try {
          access.session = await LiveSessionModel.startSession(sessionId, socket.user.id);
          io.to(roomName).emit('live:session-status-changed', { session: access.session });
          io.emit('live:session-started', { session: access.session });
        } catch (e) {
          console.warn('Could not auto-start upcoming session on teacher join:', e.message);
        }
      }

      // Update DB participant status if student
      if (!access.isTeacher && access.session.status === 'LIVE') {
        await LiveSessionModel.updateParticipantStatus(sessionId, socket.user.id, 'JOINED').catch((e) =>
          console.warn('Could not update student join status in DB:', e.message)
        );
      }

      // Track participant in room state
      if (!activeRooms.has(sessionId)) {
        activeRooms.set(sessionId, new Map());
      }
      const roomMap = activeRooms.get(sessionId);

      // Clean up previous socket of same user if still present (e.g. page refresh)
      for (const [sId, p] of roomMap.entries()) {
        if (p.userId === socket.user.id && sId !== socket.id) {
          roomMap.delete(sId);
          socket.to(roomName).emit('live:user-left', { socketId: sId, userId: p.userId });
        }
      }

      const participantInfo = {
        socketId: socket.id,
        userId: socket.user.id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        email: socket.user.email,
        avatarUrl: socket.user.avatarUrl,
        isTeacher: access.isTeacher,
        isAudioMuted: false,
        isVideoOff: false,
        isHandRaised: false,
      };

      // Get list of existing peers in the room before adding the new one
      const existingPeers = Array.from(roomMap.values());

      roomMap.set(socket.id, participantInfo);

      // Notify other participants in the room
      socket.to(roomName).emit('live:user-joined', participantInfo);

      // Send existing peers list and session info back to caller
      if (typeof callback === 'function') {
        callback({
          success: true,
          session: access.session,
          isTeacher: access.isTeacher,
          peers: existingPeers,
        });
      }

      socket.emit('live:joined-success', {
        session: access.session,
        isTeacher: access.isTeacher,
        peers: existingPeers,
      });

      console.log(`🎥 User ${socket.user.firstName} (${socket.user.role}) joined live session: ${sessionId}`);
    } catch (err) {
      console.error('Error joining live session room:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
      socket.emit('live:error', { message: err.message });
    }
  });

  /**
   * WebRTC Signaling (Offer, Answer, ICE Candidate)
   */
  socket.on('live:signal', ({ targetSocketId, signalData, type }) => {
    if (!targetSocketId || !signalData) return;

    io.to(targetSocketId).emit('live:signal', {
      fromSocketId: socket.id,
      fromUser: socket.user,
      signalData,
      type, // 'offer' | 'answer' | 'ice-candidate'
    });
  });

  /**
   * Media Controls State Toggle (Audio Mute / Video Off)
   */
  socket.on('live:media-toggle', ({ sessionId, isAudioMuted, isVideoOff, isScreenSharing }) => {
    if (!sessionId) return;
    const roomMap = activeRooms.get(sessionId);
    if (roomMap && roomMap.has(socket.id)) {
      const p = roomMap.get(socket.id);
      p.isAudioMuted = isAudioMuted;
      p.isVideoOff = isVideoOff;
      p.isScreenSharing = isScreenSharing;
    }

    socket.to(`room:live-session:${sessionId}`).emit('live:peer-media-toggled', {
      socketId: socket.id,
      userId: socket.user?.id,
      isAudioMuted,
      isVideoOff,
      isScreenSharing,
    });
  });

  socket.on('live:chat-message', ({ sessionId, message }) => {
    if (!sessionId || !message) return;
    socket.to(`room:live-session:${sessionId}`).emit('live:chat-message-received', {
      socketId: socket.id,
      userId: socket.user?.id,
      firstName: socket.user?.firstName,
      lastName: socket.user?.lastName,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('live:reaction', ({ sessionId, reaction }) => {
    if (!sessionId) return;
    socket.to(`room:live-session:${sessionId}`).emit('live:reaction-received', {
      socketId: socket.id,
      userId: socket.user?.id,
      firstName: socket.user?.firstName,
      reaction,
    });
  });

  /**
   * Toggle Hand Raise (persists until lowered like Google Meet)
   */
  socket.on('live:hand-toggle', ({ sessionId, isHandRaised, targetUserId }) => {
    if (!sessionId) return;
    const roomMap = activeRooms.get(sessionId);
    const roomName = `room:live-session:${sessionId}`;

    let affectedUserId = socket.user?.id;
    let affectedSocketId = socket.id;

    if (targetUserId && roomMap) {
      for (const [sId, p] of roomMap.entries()) {
        if (p.userId === targetUserId) {
          p.isHandRaised = Boolean(isHandRaised);
          affectedUserId = targetUserId;
          affectedSocketId = sId;
          break;
        }
      }
    } else if (roomMap && roomMap.has(socket.id)) {
      const p = roomMap.get(socket.id);
      p.isHandRaised = Boolean(isHandRaised);
    }

    io.to(roomName).emit('live:hand-toggled', {
      socketId: affectedSocketId,
      userId: affectedUserId,
      isHandRaised: Boolean(isHandRaised),
      firstName: socket.user?.firstName,
      lastName: socket.user?.lastName,
    });
  });

  /**
   * Leave live session room voluntarily
   */
  socket.on('live:leave-room', async ({ sessionId }) => {
    await handleLeave(io, socket, sessionId);
  });

  /**
   * Teacher ends the live session
   */
  socket.on('live:end-session', async ({ sessionId }, callback) => {
    try {
      if (!socket.user || !sessionId) return;

      const session = await LiveSessionModel.endSession(sessionId, socket.user.id);

      io.to(`room:live-session:${sessionId}`).emit('live:session-ended', {
        sessionId,
        session,
        message: 'The teacher has ended this live session.',
      });

      // Clear room memory
      activeRooms.delete(sessionId);

      if (typeof callback === 'function') {
        callback({ success: true, session });
      }
    } catch (err) {
      console.error('Error ending live session:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  /**
   * Teacher removes/kicks a participant
   */
  socket.on('live:kick-participant', async ({ sessionId, studentId }, callback) => {
    try {
      if (!socket.user || !sessionId || !studentId) return;

      await LiveSessionModel.removeParticipant(sessionId, socket.user.id, studentId);

      const roomMap = activeRooms.get(sessionId);
      if (roomMap) {
        // Find socket of kicked student
        for (const [sId, p] of roomMap.entries()) {
          if (p.userId === studentId) {
            io.to(sId).emit('live:kicked', {
              sessionId,
              message: 'You have been removed from this live session by the teacher.',
            });
            roomMap.delete(sId);
            break;
          }
        }
      }

      // Notify the room
      io.to(`room:live-session:${sessionId}`).emit('live:participant-removed', {
        sessionId,
        studentId,
      });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (err) {
      console.error('Error kicking participant:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  /**
   * Clean up on disconnect
   */
  socket.on('disconnect', async () => {
    if (socket.currentLiveSessionId) {
      await handleLeave(io, socket, socket.currentLiveSessionId);
    }
  });
}

/**
 * Handle participant leaving logic
 */
async function handleLeave(io, socket, sessionId) {
  if (!sessionId) return;
  const roomName = `room:live-session:${sessionId}`;
  socket.leave(roomName);

  const roomMap = activeRooms.get(sessionId);
  if (roomMap && roomMap.has(socket.id)) {
    const participant = roomMap.get(socket.id);
    roomMap.delete(socket.id);

    // If student, update left status in DB
    if (socket.user && !participant.isTeacher) {
      await LiveSessionModel.updateParticipantStatus(sessionId, socket.user.id, 'LEFT').catch(() => {});
    }

    // Broadcast to peers in the room
    socket.to(roomName).emit('live:user-left', {
      socketId: socket.id,
      userId: socket.user?.id,
    });

    if (roomMap.size === 0) {
      activeRooms.delete(sessionId);
    }
  }

  socket.currentLiveSessionId = null;
}
