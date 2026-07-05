import { io, Socket } from "socket.io-client";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

let socket: Socket | null = null;

/** Get (or lazily create) the shared authenticated socket connection. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, {
      auth: { token: localStorage.getItem("chasqr_token") },
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
