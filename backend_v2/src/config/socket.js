import { Server } from 'socket.io';
import { env } from './env.js';

let io = null;

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const isLocalNetworkOrigin = (origin) => {
  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
};

/**
 * Initialize Socket.IO with HTTP Server
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (env.NODE_ENV === 'development' && isLocalNetworkOrigin(origin))
        ) {
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
