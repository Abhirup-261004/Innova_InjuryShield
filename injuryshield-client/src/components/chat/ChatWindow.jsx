import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import "../../css/Chat.css";

export default function ChatWindow({
  socket,
  me,
  activeUser,
  conversationId,
  messages,
  setMessages,
  typing,
  online,
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark seen when opening chat or receiving new message
  useEffect(() => {
    if (!socket?.connected || !conversationId || !activeUser?._id) return;

    socket.emit("message:seen", {
      conversationId,
      fromUserId: activeUser._id,
    });
  }, [socket?.connected, socket, conversationId, activeUser?._id, messages.length]);

  // Typing indicator
  useEffect(() => {
    if (!socket?.connected || !activeUser?._id) return;

    if (!text.trim()) {
      socket.emit("typing:stop", { to: activeUser._id });
      return;
    }

    socket.emit("typing:start", { to: activeUser._id });

    const t = setTimeout(() => {
      socket.emit("typing:stop", { to: activeUser._id });
    }, 900);

    return () => clearTimeout(t);
  }, [text, socket, activeUser?._id]);

  const send = () => {
    const clean = (text || "").trim();

    console.log("SEND CLICK", {
      clean,
      hasSocket: !!socket,
      socketConnected: socket?.connected,
      activeUserId: activeUser?._id,
      meId: me?._id,
    });

    if (!clean || !activeUser?._id) return;

    setText("");

    // optimistic UI (always show locally)
    const optimistic = {
      _id: "tmp_" + Date.now(),
      sender: me?._id,
      receiver: activeUser._id,
      text: clean,
      status: socket?.connected ? "sent" : "pending",
      createdAt: new Date().toISOString(),
      conversation: conversationId,
    };

    setMessages((prev) => [...prev, optimistic]);

    // if socket isn't connected, stop here (it will not persist)
    if (!socket?.connected) return;

    socket.emit("message:send", { to: activeUser._id, text: clean }, (ack) => {
      if (!ack?.ok) {
        console.log("Send failed:", ack?.message);
      }
    });
  };

  const deleteForMe = (messageId) => {
    if (!socket?.connected) return;

    // optimistic remove locally
    setMessages((prev) => prev.filter((m) => m._id !== messageId));

    // tell server to mark deletedFor
    socket.emit("message:deleteForMe", { messageId }, () => {});
  };

  if (!activeUser) {
    return (
      <div className="wa-empty">
        <div className="wa-empty-box">
          <h2>Chat</h2>
          <p>Select a coach/user from the left to start chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wa-chat">
      <div className="wa-chat-header">
        <div className="wa-chat-header-left">
          <div className="wa-chat-avatar big">
            {activeUser.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="wa-chat-name">{activeUser.name}</div>
            <div className="wa-chat-last">
              {activeUser.role} • {online ? "online" : "offline"}
              {typing ? " • typing..." : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="wa-chat-body">
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            meId={me?._id}
            msg={m}
            onDelete={deleteForMe}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="wa-chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

