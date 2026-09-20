/**
 * Real-time Chat & Room Events Handler
 */
export function registerChatHandlers(io, socket) {
  // Join a class/discussion room
  socket.on('join_room', ({ roomId }) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`Socket ${socket.id} (user: ${socket.user?.id || 'guest'}) joined room: ${roomId}`);

    socket.to(roomId).emit('user_joined', {
      userId: socket.user?.id || 'guest',
      name: socket.user ? `${socket.user.firstName} ${socket.user.lastName}` : 'Guest',
      timestamp: new Date().toISOString(),
    });
  });

  // Leave a room
  socket.on('leave_room', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', {
      userId: socket.user?.id || 'guest',
      timestamp: new Date().toISOString(),
    });
  });

  // Send a message to a room
  socket.on('send_message', ({ roomId, message }) => {
    if (!roomId || !message) return;

    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      roomId,
      message,
      sender: socket.user
        ? {
            id: socket.user.id,
            name: `${socket.user.firstName} ${socket.user.lastName}`,
            role: socket.user.role,
          }
        : { id: 'guest', name: 'Guest', role: 'GUEST' },
      timestamp: new Date().toISOString(),
    };

    // Broadcast to room members including sender
    io.to(roomId).emit('receive_message', chatMessage);
  });

  // Typing indicator
  socket.on('typing', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('user_typing', {
      userId: socket.user?.id || 'guest',
      name: socket.user ? `${socket.user.firstName} ${socket.user.lastName}` : 'Guest',
    });
  });

  socket.on('stop_typing', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('user_stop_typing', {
      userId: socket.user?.id || 'guest',
    });
  });
}
