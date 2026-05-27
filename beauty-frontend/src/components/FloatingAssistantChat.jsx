import API_BASE from "../services/api";
import { useMemo, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

const starterPrompts = [
  "Help me choose a wig",
  "Build a glow routine",
  "Match products to me",
];

export default function FloatingAssistantChat() {
  const bottomRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I am Zuri. What can I help you choose today?",
    },
  ]);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const sendMessage = async (value = input) => {
    const text = value.trim();

    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_BASE}/assistant-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Assistant failed");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply || "I am here and ready to help.",
        },
      ]);
    } catch (err) {
      console.error("FLOATING ASSISTANT ERROR:", err);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I could not reach the assistant right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      <style>{css}</style>

      <div className="floating-assistant">
        {open && (
          <section className="floating-assistant-panel" aria-label="AI assistant chat">
            <header>
              <div>
                <p>AI ASSISTANT</p>
                <h2>Zuri Beauty Chat</h2>
              </div>

              <button
                type="button"
                className="assistant-close"
                onClick={() => setOpen(false)}
                aria-label="Close AI assistant"
                title="Close"
              >
                <FaTimes />
              </button>
            </header>

            <div className="floating-starters">
              {starterPrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="floating-chat-log" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  className={`floating-chat-message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <div>{message.content}</div>
                </div>
              ))}

              {loading && (
                <div className="floating-chat-message assistant">
                  <div className="floating-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <form className="floating-composer" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Zuri..."
                aria-label="Ask Zuri"
              />

              <button type="submit" disabled={loading || !input.trim()}>
                <FaPaperPlane />
              </button>
            </form>
          </section>
        )}

        <button
          type="button"
          className="floating-assistant-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-label="Open AI assistant"
          title="AI Assistant"
        >
          <FaComments />
        </button>
      </div>
    </>
  );
}

const css = `
.floating-assistant {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 10000;
  display: grid;
  justify-items: end;
  gap: 14px;
  pointer-events: none;
}

.floating-assistant-toggle,
.floating-assistant-panel {
  pointer-events: auto;
}

.floating-assistant-toggle {
  width: 62px;
  height: 62px;
  border: none;
  border-radius: 999px;
  background:
    radial-gradient(circle at 28% 24%, rgba(247,231,206,.42), transparent 32%),
    linear-gradient(135deg, ${WINE}, ${EMERALD});
  color: ${GOLD};
  box-shadow: 0 18px 38px rgba(43,17,20,.32);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.floating-assistant-panel {
  width: min(390px, calc(100vw - 28px));
  height: min(620px, calc(100vh - 112px));
  border-radius: 24px;
  background: rgba(255,255,255,.98);
  border: 1px solid rgba(80,36,42,.10);
  box-shadow: 0 24px 70px rgba(43,17,20,.28);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}

.floating-assistant-panel header {
  padding: 18px;
  background:
    radial-gradient(circle at top right, rgba(247,231,206,.22), transparent 36%),
    linear-gradient(135deg, ${EMERALD}, #10231f);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.floating-assistant-panel header p {
  margin: 0;
  color: ${GOLD};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.5px;
}

.floating-assistant-panel header h2 {
  margin: 4px 0 0;
  font-family: Georgia, serif;
  font-size: 22px;
}

.assistant-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 12px;
  background: rgba(255,255,255,.12);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.floating-starters {
  padding: 12px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(80,36,42,.08);
}

.floating-starters button {
  border: 1px solid rgba(163,133,96,.28);
  border-radius: 999px;
  padding: 9px 11px;
  background: #f8f4ee;
  color: ${WINE};
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.floating-chat-log {
  min-height: 0;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  overflow-y: auto;
}

.floating-chat-message {
  display: flex;
}

.floating-chat-message.user {
  justify-content: flex-end;
}

.floating-chat-message > div {
  max-width: 86%;
  border-radius: 16px;
  padding: 11px 12px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
  white-space: pre-line;
}

.floating-chat-message.assistant > div {
  background: #f8f4ee;
  color: #4b3f42;
  border-top-left-radius: 6px;
}

.floating-chat-message.user > div {
  background: ${WINE};
  color: #fff;
  border-top-right-radius: 6px;
}

.floating-typing {
  display: flex;
  align-items: center;
  gap: 5px;
}

.floating-typing span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: ${GOLD};
  animation: floatingAssistantTyping 1s ease-in-out infinite;
}

.floating-typing span:nth-child(2) {
  animation-delay: .14s;
}

.floating-typing span:nth-child(3) {
  animation-delay: .28s;
}

.floating-composer {
  padding: 12px;
  border-top: 1px solid rgba(80,36,42,.08);
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 8px;
}

.floating-composer input {
  min-width: 0;
  border: 1px solid rgba(80,36,42,.14);
  border-radius: 14px;
  padding: 12px;
  color: ${WINE};
  font-weight: 800;
  outline: none;
}

.floating-composer button {
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  color: #2b1114;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.floating-composer button:disabled,
.floating-starters button:disabled {
  opacity: .58;
  cursor: not-allowed;
}

@keyframes floatingAssistantTyping {
  0%, 100% { transform: translateY(0); opacity: .45; }
  50% { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 620px) {
  .floating-assistant {
    right: 14px;
    bottom: 14px;
  }

  .floating-assistant-toggle {
    width: 56px;
    height: 56px;
  }

  .floating-assistant-panel {
    height: min(560px, calc(100vh - 94px));
  }
}
`;
