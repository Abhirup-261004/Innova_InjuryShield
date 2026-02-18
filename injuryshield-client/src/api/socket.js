import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  // 🔥 Get token directly (NOT from userInfo)
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("❌ No token found for socket");
    return null;
  }

  const base =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:8000";

  socket = io(base, {
    auth: { token },       // 🔥 required for backend socketAuth
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ SOCKET CONNECTED:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ SOCKET ERROR:", err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
}

