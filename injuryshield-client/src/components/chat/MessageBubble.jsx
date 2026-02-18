import "../../css/Chat.css";

export default function MessageBubble({ meId, msg, onDelete }) {
  const mine = String(msg.sender) === String(meId);

  let tick = "";
  if (mine) tick = msg.status === "seen" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓";

  return (
    <div className={`wa-bubble-row ${mine ? "mine" : "theirs"}`}>
      <div
        className={`wa-bubble ${mine ? "mine" : "theirs"}`}
        onContextMenu={(e) => {
          e.preventDefault();
          onDelete?.(msg._id);
        }}
        title="Right click / long press to delete for me"
      >
        <div className="wa-bubble-text">{msg.text}</div>
        <div className="wa-bubble-meta">
          <span className="wa-time">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {mine && <span className={`wa-tick ${msg.status}`}>{tick}</span>}
        </div>
      </div>
    </div>
  );
}

