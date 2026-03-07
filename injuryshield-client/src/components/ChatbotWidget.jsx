import { useEffect, useRef, useState } from "react";
import API from "../api/axios";
import "../css/ChatbotWidget.css";

const STORAGE_KEY = "injuryshield_chatbot_messages";

const starterMessages = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Hi! I’m the InjuryShield assistant. Ask me about workouts, ACWR, Injury Radar, coach features, posture analysis, or AI reports."
  }
];

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(starterMessages);

  const bottomRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      } catch (err) {
        console.error("Failed to parse chatbot history", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setTyping(true);

    try {
      const payload = {
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content
        }))
      };

      const { data } = await API.post("/chatbot/message", payload);

      const botMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data?.reply ||
          "Sorry, I could not understand that. Please try again."
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            err.response?.data?.reply ||
            "I’m having trouble responding right now. Please try again in a moment."
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages(starterMessages);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {!open && (
        <button
          className="chatbot-fab"
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
        >
          💬
        </button>
      )}

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <h4>InjuryShield Assistant</h4>
              <p>Ask anything about the website</p>
            </div>

            <div className="chatbot-header-actions">
              <button onClick={clearChat} title="Clear chat">
                ⟲
              </button>
              <button onClick={() => setOpen(false)} title="Close">
                ✕
              </button>
            </div>
          </div>

          <div className="chatbot-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div className="chatbot-bubble">{msg.content}</div>
              </div>
            ))}

            {typing && (
              <div className="chatbot-message assistant">
                <div className="chatbot-bubble chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chatbot-footer">
            <textarea
              rows="2"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage} disabled={!input.trim() || typing}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatbotWidget;