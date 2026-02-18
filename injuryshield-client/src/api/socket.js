import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  const raw = localStorage.getItem("userInfo");
  const user = raw ? JSON.parse(raw) : null;
  const token = user?.token;

  if (!token) return null;

  const base =
    import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000";

  socket = io(base, {
    auth: { token },
    transports: ["websocket"]
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
