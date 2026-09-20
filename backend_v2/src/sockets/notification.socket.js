/**
 * Real-time User Notification Handlers
 */
export function registerNotificationHandlers(_io, socket) {
  // If user is authenticated, join their private notification room
  if (socket.user?.id) {
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    console.log(`Socket ${socket.id} joined personal notification room: ${userRoom}`);
  }
}
