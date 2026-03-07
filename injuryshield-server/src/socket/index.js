const { Server } = require("socket.io");
const socketAuth = require("./socketAuth");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { canChat } = require("../utils/chatRules");

async function getOrCreateConversation(userId, otherId) {
  let convo = await Conversation.findOne({
    participants: { $all: [userId, otherId] }
  });

  if (!convo) {
    convo = await Conversation.create({ participants: [userId, otherId] });
  }

  return convo;
}

const onlineUsers = new Map(); // userId -> socketId

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const me = socket.user;

    // join personal room (for direct emits)
    socket.join(String(me._id));

    onlineUsers.set(String(me._id), socket.id);
    io.emit("presence:online", { userId: String(me._id) });

    // broadcast online status (optional)
    socket.broadcast.emit("presence:online", { userId: String(me._id) });

    // ---------------------------
    // TYPING EVENTS
    // ---------------------------
    socket.on("typing:start", ({ to }) => {
      if (!to) return;
      io.to(String(to)).emit("typing:start", { from: String(me._id) });
    });

    socket.on("typing:stop", ({ to }) => {
      if (!to) return;
      io.to(String(to)).emit("typing:stop", { from: String(me._id) });
    });

    // ---------------------------
    // SEND MESSAGE
    // ---------------------------
    socket.on("message:send", async (payload, ack) => {
      try {
        const { to, text } = payload;

        if (!to || !text?.trim()) {
          return ack?.({ ok: false, message: "Invalid payload" });
        }

        const other = await User.findById(to).select("_id role name");
        if (!other) {
          return ack?.({ ok: false, message: "Receiver not found" });
        }

        if (!canChat(me, other)) {
          return ack?.({ ok: false, message: "Chat not allowed" });
        }

        const convo = await getOrCreateConversation(me._id, other._id);

        const msg = await Message.create({
          conversation: convo._id,
          sender: me._id,
          receiver: other._id,
          text: text.trim(),
          status: "sent"
        });

        const receiverOnline = onlineUsers.has(String(other._id));
        if (receiverOnline) {
          msg.status = "delivered";
          await msg.save();
        }

        convo.lastMessage = msg._id;
        await convo.save();

        const out = {
          _id: String(msg._id),
          conversation: String(convo._id),
          sender: String(me._id),
          receiver: String(other._id),
          text: msg.text,
          status: msg.status,
          createdAt: msg.createdAt
        };

        io.to(String(me._id)).emit("message:new", out);
        io.to(String(other._id)).emit("message:new", out);

        ack?.({ ok: true, message: out });
      } catch (e) {
        console.log("message:send error:", e);
        ack?.({ ok: false, message: "Send failed" });
      }
    });

    // ---------------------------
    // DELETE MESSAGE FOR ME
    // ---------------------------
    socket.on("message:deleteForMe", async ({ messageId }, ack) => {
      try {
        if (!messageId) return ack?.({ ok: false });

        const msg = await Message.findById(messageId);
        if (!msg) return ack?.({ ok: false });

        const isParticipant =
          String(msg.sender) === String(me._id) ||
          String(msg.receiver) === String(me._id);

        if (!isParticipant) return ack?.({ ok: false });

        await Message.updateOne(
          { _id: messageId },
          { $addToSet: { deletedFor: me._id } }
        );

        io.to(String(me._id)).emit("message:deleted", { messageId });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false });
      }
    });

    // ---------------------------
    // MARK SEEN
    // ---------------------------
    socket.on("message:seen", async ({ conversationId, fromUserId }, ack) => {
      try {
        if (!conversationId) return ack?.({ ok: false });

        await Message.updateMany(
          {
            conversation: conversationId,
            receiver: me._id,
            status: { $ne: "seen" }
          },
          {
            $set: {
              status: "seen",
              readAt: new Date()
            }
          }
        );

        // notify sender that messages were seen
        if (fromUserId) {
          io.to(String(fromUserId)).emit("message:seen:update", {
            conversationId,
            seenBy: String(me._id)
          });
        }

        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false });
      }
    });

    // =========================================================
    // VIDEO CALL EVENTS
    // =========================================================

    socket.on("join-video-room", ({ roomId, userId, name }) => {
      try {
        if (!roomId || !userId) return;

        socket.join(String(roomId));

        socket.to(String(roomId)).emit("participant-joined", {
          userId: String(userId),
          name: name || me.name || "Participant"
        });
      } catch (e) {
        console.log("join-video-room error:", e);
      }
    });

    socket.on("signal-offer", ({ roomId, offer, fromUserId }) => {
      try {
        if (!roomId || !offer) return;

        socket.to(String(roomId)).emit("signal-offer", {
          offer,
          fromUserId: String(fromUserId || me._id)
        });
      } catch (e) {
        console.log("signal-offer error:", e);
      }
    });

    socket.on("signal-answer", ({ roomId, answer, fromUserId }) => {
      try {
        if (!roomId || !answer) return;

        socket.to(String(roomId)).emit("signal-answer", {
          answer,
          fromUserId: String(fromUserId || me._id)
        });
      } catch (e) {
        console.log("signal-answer error:", e);
      }
    });

    socket.on("signal-candidate", ({ roomId, candidate, fromUserId }) => {
      try {
        if (!roomId || !candidate) return;

        socket.to(String(roomId)).emit("signal-candidate", {
          candidate,
          fromUserId: String(fromUserId || me._id)
        });
      } catch (e) {
        console.log("signal-candidate error:", e);
      }
    });

    socket.on("video-chat-message", ({ roomId, message }) => {
      try {
        if (!roomId || !message) return;

        socket.to(String(roomId)).emit("video-chat-message", message);
      } catch (e) {
        console.log("video-chat-message error:", e);
      }
    });

    socket.on("video-toggle", ({ roomId, payload }) => {
      try {
        if (!roomId || !payload) return;

        socket.to(String(roomId)).emit("video-toggle", payload);
      } catch (e) {
        console.log("video-toggle error:", e);
      }
    });

    socket.on("end-video-call", ({ roomId, endedBy }) => {
      try {
        if (!roomId) return;

        socket.to(String(roomId)).emit("end-video-call", {
          endedBy: String(endedBy || me._id)
        });
      } catch (e) {
        console.log("end-video-call error:", e);
      }
    });

    socket.on("leave-video-room", ({ roomId, userId }) => {
      try {
        if (!roomId) return;

        socket.leave(String(roomId));
        socket.to(String(roomId)).emit("participant-left", {
          userId: String(userId || me._id)
        });
      } catch (e) {
        console.log("leave-video-room error:", e);
      }
    });

    // ---------------------------
    // DISCONNECT
    // ---------------------------
    socket.on("disconnect", () => {
      onlineUsers.delete(String(me._id));
      io.emit("presence:offline", { userId: String(me._id) });
    });
  });

  return io;
}

module.exports = initSocket;