import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    return () => disconnectSocket();
  }, []);

  const me = useMemo(() => {
    const raw = localStorage.getItem("userInfo");
    return raw ? JSON.parse(raw) : null;
  }, []);

  // Load contact list + existing conversations
  const loadSidebar = async () => {
    const [c1, c2] = await Promise.all([
      API.get("/chat/contacts"),
      API.get("/chat/conversations")
    ]);
    setContacts(c1.data || []);
    setConversations(c2.data || []);
  };

  const openChatWith = async (user) => {
    setActiveUser(user);
    setMessages([]);
    setConversationId(null);

    const { data } = await API.get(`/chat/${user._id}/messages`);
    setConversationId(data.conversationId);
    setMessages(data.messages || []);
  };

  // Socket: realtime new messages + seen updates
  useEffect(() => {
    loadSidebar();

    const s = connectSocket();
    if (!s) return;

    s.on("message:new", (msg) => {
      // only append to active chat if match
      const otherId = activeUser?._id;
      const relevant =
        (msg.sender === otherId && msg.receiver === me?._id) ||
        (msg.sender === me?._id && msg.receiver === otherId);

      if (relevant) {
        setMessages((prev) => [...prev, msg]);
        setConversationId(msg.conversation || conversationId);
      }

      // refresh conversation list ordering/last message
      loadSidebar();
    });

    s.on("message:seen:update", ({ conversationId: cid }) => {
      if (cid && cid === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.status !== "seen" && m.sender === me?._id ? { ...m, status: "seen" } : m
          )
        );
      }
    });

    s.on("presence:online", ({ userId }) => {
        setOnlineSet((prev) => new Set(prev).add(userId));
    });

    s.on("presence:offline", ({ userId }) => {
        setOnlineSet((prev) => {
        const n = new Set(prev);
        n.delete(userId);
        return n;
    });
    });

    s.on("typing:start", ({ from }) => setTypingFrom(from));
    s.on("typing:stop", ({ from }) => {
        setTypingFrom((cur) => (cur === from ? null : cur));
    });

    s.on("message:deleted", ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });


    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?._id, conversationId]);

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
            me={me}
            activeUser={activeUser}
            conversationId={conversationId}
            messages={messages}
            onNewLocalMessage={(m) => setMessages((prev) => [...prev, m])}
            typing={typingFrom === activeUser?._id}
            online={onlineSet.has(activeUser?._id)}
        />
      </div>
    </div>
  );
}
