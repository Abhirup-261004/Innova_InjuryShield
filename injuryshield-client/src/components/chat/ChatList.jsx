import { useMemo, useState } from "react";
import "../../css/Chat.css";

export default function ChatList({
  conversations,
  contacts,
  activeUserId,
  onSelectUser,
  onlineSet
}) {
  const [q, setQ] = useState("");

  const convoOtherIds = new Set(conversations.map((c) => c.otherUser?._id).filter(Boolean));
  const extraContacts = contacts.filter((u) => !convoOtherIds.has(u._id));

  const norm = (s) => (s || "").toLowerCase().trim();
  const query = norm(q);

  const filteredConvos = useMemo(() => {
    if (!query) return conversations;
    return conversations.filter((c) => norm(c.otherUser?.name).includes(query));
  }, [conversations, query]);

  const filteredContacts = useMemo(() => {
    if (!query) return extraContacts;
    return extraContacts.filter((u) => norm(u.name).includes(query));
  }, [extraContacts, query]);

  return (
    <div className="wa-list">
      <div className="wa-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
        />
      </div>

      <div className="wa-section-title">Chats</div>

      {filteredConvos.map((c) => {
        const u = c.otherUser;
        if (!u) return null;

        const last = c.lastMessage?.text || "No messages yet";
        const online = onlineSet?.has(u._id);

        return (
          <button
            key={c._id}
            className={`wa-chat-item ${activeUserId === u._id ? "active" : ""}`}
            onClick={() => onSelectUser(u)}
          >
            <div className="wa-chat-avatar">
              {u.name?.[0]?.toUpperCase()}
              {online ? <span className="wa-dot" /> : null}
            </div>

            <div className="wa-chat-meta">
              <div className="wa-chat-top">
                <div className="wa-chat-name">{u.name}</div>
                <div className="wa-chat-role">{u.role}</div>
              </div>

              <div className="wa-chat-last">{last}</div>
            </div>

            {c.unreadCount > 0 && (
              <div className="wa-unread">{c.unreadCount}</div>
            )}
          </button>
        );
      })}

      <div className="wa-section-title" style={{ marginTop: 10 }}>
        Start new chat
      </div>

      {filteredContacts.map((u) => {
        const online = onlineSet?.has(u._id);
        return (
          <button
            key={u._id}
            className={`wa-chat-item ${activeUserId === u._id ? "active" : ""}`}
            onClick={() => onSelectUser(u)}
          >
            <div className="wa-chat-avatar">
              {u.name?.[0]?.toUpperCase()}
              {online ? <span className="wa-dot" /> : null}
            </div>
            <div className="wa-chat-meta">
              <div className="wa-chat-top">
                <div className="wa-chat-name">{u.name}</div>
                <div className="wa-chat-role">{u.role}</div>
              </div>
              <div className="wa-chat-last">Tap to chat</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
