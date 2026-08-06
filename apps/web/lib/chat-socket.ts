import { io, type Socket } from 'socket.io-client';
import { apiOrigin } from './api-url';

let socket: Socket | null = null;

/** One shared connection per tab — auth token is only read at connect time (see AuthProvider notes). */
export function getChatSocket(): Socket {
  if (socket) return socket;
  const token = localStorage.getItem('accessToken');
  socket = io(`${apiOrigin()}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}
