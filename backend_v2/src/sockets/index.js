import { socketAuthMiddleware } from './auth.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { registerNotificationHandlers } from './notification.socket.js';

/**
 * Configure all Socket.IO event handlers and middleware
 * @param {import('socket.io').Server} io
 */
export function setupSockets(io) {
  // Handshake authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userDisplay = socket.user
      ? `${socket.user.firstName} ${socket.user.lastName} (${socket.user.role})`
      : 'Guest';

    console.log(`🔌 Client connected: ${socket.id} - ${userDisplay}`);

    // Register event modules
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });
  });
}
