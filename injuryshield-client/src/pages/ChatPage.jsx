import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";
import { connectSocket, disconnectSocket } from "../api/socket";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import "../css/Chat.css";

export default function ChatPage() {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // other user
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineSet, setOnlineSet] = useState(new Set());
  const [typingFrom, setTypingFrom] = useState(null);

  const [socket, setSocket] = useState(null);

  const me = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  }, []);

  // refs to avoid re-binding socket listeners
  const activeUserIdRef = useRef(null);
  const conversationIdRef = useRef(null);

  useEffect(() => {
    activeUserIdRef.current = activeUser?._id || null;
    conversationIdRef.current = conversationId || null;
  }, [activeUser?._id, conversationId]);

  const loadSidebar = async () => {
    try {
      const [c1, c2] = await Promise.all([
        API.get("/chat/contacts"),
        API.get("/chat/conversations"),
      ]);
      setContacts(c1.data || []);
      setConversations(c2.data || []);
    } catch (e) {
      console.log("loadSidebar error:", e?.response?.data || e.message);
    }
  };

  const openChatWith = async (user) => {
    try {
      setActiveUser(user);
      setMessages([]);
      setConversationId(null);

      const { data } = await API.get(`/chat/${user._id}/messages`);
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
    } catch (e) {
      console.log("openChatWith error:", e?.response?.data || e.message);
    }
  };

  // ✅ Connect socket ONCE and attach listeners ONCE
  useEffect(() => {
    loadSidebar();

    const s = connectSocket();
    setSocket(s);

    if (!s) return () => {};

    const onMessageNew = (msg) => {
      const otherId = activeUserIdRef.current;

      const relevant =
        (msg.sender === otherId && msg.receiver === me?._id) ||
        (msg.sender === me?._id && msg.receiver === otherId);

      if (relevant) {
        setMessages((prev) => [...prev, msg]);

        // If conversationId isn't set yet, set it
        if (!conversationIdRef.current && msg.conversation) {
          setConversationId(msg.conversation);
        }
      }

      loadSidebar();
    };

    const onSeenUpdate = ({ conversationId: cid }) => {
      if (cid && cid === conversationIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === me?._id && m.status !== "seen" ? { ...m, status: "seen" } : m
          )
        );
      }
    };

    const onOnline = ({ userId }) => {
      setOnlineSet((prev) => new Set(prev).add(userId));
    };

    const onOffline = ({ userId }) => {
      setOnlineSet((prev) => {
        const n = new Set(prev);
        n.delete(userId);
        return n;
      });
    };

    const onTypingStart = ({ from }) => setTypingFrom(from);
    const onTypingStop = ({ from }) =>
      setTypingFrom((cur) => (cur === from ? null : cur));

    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    s.on("message:new", onMessageNew);
    s.on("message:seen:update", onSeenUpdate);
    s.on("presence:online", onOnline);
    s.on("presence:offline", onOffline);
    s.on("typing:start", onTypingStart);
    s.on("typing:stop", onTypingStop);
    s.on("message:deleted", onDeleted);

    return () => {
      s.off("message:new", onMessageNew);
      s.off("message:seen:update", onSeenUpdate);
      s.off("presence:online", onOnline);
      s.off("presence:offline", onOffline);
      s.off("typing:start", onTypingStart);
      s.off("typing:stop", onTypingStop);
      s.off("message:deleted", onDeleted);

      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ EMPTY deps

  return (
    <div className="wa-shell">
      <div className="wa-sidebar">
        <div className="wa-sidebar-top">
          <div className="wa-title">
            <div className="wa-avatar">{(me?.name || "U")[0]?.toUpperCase()}</div>
            <div>
              <div className="wa-name">{me?.name || "User"}</div>
              <div className="wa-sub">{me?.role === "coach" ? "Coach" : "Athlete"}</div>
            </div>
          </div>
        </div>

        <ChatList
          conversations={conversations}
          contacts={contacts}
          activeUserId={activeUser?._id}
          onSelectUser={openChatWith}
          onlineSet={onlineSet}
        />
      </div>

      <div className="wa-main">
        <ChatWindow
            socket={socket}
            me={me}
            activeUser={activeUser}
            conversationId={conversationId}
            messages={messages}
            setMessages={setMessages}
            typing={typingFrom === activeUser?._id}
            online={onlineSet.has(activeUser?._id)}
        />

      </div>
    </div>
  );
}
