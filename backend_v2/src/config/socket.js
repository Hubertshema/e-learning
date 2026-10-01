import { Server } from 'socket.io';
import { isOriginAllowed } from './cors.js';

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS error: Origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  return io;
}

/**
 * Get the initialized Socket.IO instance
 * @returns {Server}
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(httpServer) first.');
  }
  return io;
}
