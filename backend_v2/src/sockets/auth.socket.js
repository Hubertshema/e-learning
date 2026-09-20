import { verifyAccessToken } from '../utils/jwt.util.js';

/**
 * Socket.IO Handshake Authentication Middleware
 */
export function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    // Allow anonymous connections for public rooms/events, but tag as guest
    socket.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    console.warn('Socket authentication handshake failed:', err.message);
    // Continue as guest if token is invalid
    socket.user = null;
    next();
  }
}
