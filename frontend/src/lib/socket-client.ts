import { io, Socket } from 'socket.io-client';
import { tokenStorage, getApiBaseUrl } from './api-client';

let socketInstance: Socket | null = null;

export function getSocketClient(): Socket {
  if (typeof window === 'undefined') {
    return {} as Socket;
  }

  const token = tokenStorage.getAccessToken();

  if (!socketInstance) {
    const apiBase = getApiBaseUrl();
    const serverUrl = apiBase.replace(/\/api\/v1\/?$/, '');

    socketInstance = io(serverUrl, {
      auth: (cb) => {
        cb({ token: tokenStorage.getAccessToken() });
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to real-time server:', socketInstance?.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO] Connection warning:', err.message);
    });
  }

  // Ensure current auth token is updated in memory
  if (token && socketInstance.auth) {
    if (typeof socketInstance.auth === 'object') {
      (socketInstance.auth as any).token = token;
    }
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
}

export function reconnectSocketWithAuth() {
  if (typeof window === 'undefined') return;
  if (socketInstance) {
    const token = tokenStorage.getAccessToken();
    (socketInstance.auth as any) = { token };
    socketInstance.disconnect().connect();
  }
}

export function joinLessonRoom(lessonId: string) {
  const socket = getSocketClient();
  if (socket?.emit) {
    socket.emit('join_lesson_room', { lessonId });
  }
}

export function leaveLessonRoom(lessonId: string) {
  const socket = getSocketClient();
  if (socket?.emit) {
    socket.emit('leave_lesson_room', { lessonId });
  }
}

export function broadcastLessonUpdate(payload: {
  lessonId: string;
  blocks: any[];
  settings: any;
  updatedBlockId?: string;
}) {
  const socket = getSocketClient();
  if (socket?.emit) {
    socket.emit('broadcast_lesson_update', payload);
  }
}

export function saveLiveLessonViaSocket(
  payload: {
    lessonId: string;
    blocks: any[];
    settings: any;
    title: string;
  },
  callback?: (response: any) => void
) {
  const socket = getSocketClient();
  if (socket?.emit) {
    socket.emit('save_live_lesson', payload, callback);
  }
}

export function fetchLiveLessonViaSocket(
  lessonId: string,
  callback: (response: { success?: boolean; lesson?: any; fromCache?: boolean; error?: string }) => void
) {
  const socket = getSocketClient();
  if (socket?.emit) {
    socket.emit('fetch_live_lesson', { lessonId }, callback);
  }
}

