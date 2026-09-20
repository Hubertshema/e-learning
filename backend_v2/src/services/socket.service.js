import { getIO } from '../config/socket.js';

export class SocketService {
  /**
   * Emit an event to a specific user room
   */
  static emitToUser(userId, event, payload) {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit(event, payload);
    } catch (err) {
      console.warn(`SocketService emitToUser warning (${event}):`, err.message);
    }
  }

  /**
   * Emit an event to a specific room (e.g. class:123 or chat:456)
   */
  static emitToRoom(room, event, payload) {
    try {
      const io = getIO();
      io.to(room).emit(event, payload);
    } catch (err) {
      console.warn(`SocketService emitToRoom warning (${room} -> ${event}):`, err.message);
    }
  }

  /**
   * Broadcast an event to all connected clients
   */
  static broadcast(event, payload) {
    try {
      const io = getIO();
      io.emit(event, payload);
    } catch (err) {
      console.warn(`SocketService broadcast warning (${event}):`, err.message);
    }
  }
}
