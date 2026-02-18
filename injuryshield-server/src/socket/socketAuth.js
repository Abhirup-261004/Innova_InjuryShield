const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function socketAuth(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select("_id name email role");

    if (!user) return next(new Error("User not found"));

    socket.user = user; // attach user to socket
    next();
  } catch (e) {
    next(new Error("Unauthorized"));
  }
}

module.exports = socketAuth;
