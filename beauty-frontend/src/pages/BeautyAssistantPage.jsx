import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaComments,
  FaMagic,
  FaPaperPlane,
  FaShoppingBag,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API_BASE from "../services/api";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

const starterPrompts = [
  "Help me choose a wig for a polished everyday look",
  "Build a simple glow routine",
  "What products match my beauty profile?",
  "How do I track my order?",
];

export default function BeautyAssistantPage() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I am Zuri. Tell me what you are shopping for and I will help you choose.",
    },
  ]);

  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const sendMessage = async (value = input) => {
    const text = value.trim();

    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

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

      setProducts(Array.isArray(data.suggested_products) ? data.suggested_products : []);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply || "I am here and ready to help.",
        },
      ]);
    } catch (err) {
      console.error("ASSISTANT CHAT ERROR:", err);
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
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="assistant-page">
        <button className="assistant-back" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Shop
        </button>

        <section className="assistant-shell">
          <div className="assistant-main">
            <header className="assistant-hero">
              <div className="assistant-avatar">
                <FaMagic />
              </div>

              <div>
                <p>AI ASSISTANT</p>
                <h1>Zuri Beauty Chat</h1>
              </div>
            </header>

            <div className="starter-row">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <section className="chat-window" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  className={`chat-message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <div>{message.content}</div>
                </div>
              ))}

              {loading && (
                <div className="chat-message assistant">
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </section>

            <form className="chat-composer" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Zuri anything..."
                aria-label="Ask Zuri anything"
              />

              <button type="submit" disabled={loading || !input.trim()}>
                <FaPaperPlane />
              </button>
            </form>
          </div>

          <aside className="assistant-side">
            <div className="side-heading">
              <FaShoppingBag />
              <div>
                <p>STORE PICKS</p>
                <h2>Suggested Now</h2>
              </div>
            </div>

            <div className="side-products">
              {products.length > 0 ? (
                products.map((product) => (
                  <button
                    className="side-product"
                    key={product.id}
                    type="button"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <span>{product.name}</span>
                    <strong>R {Number(product.price || 0).toFixed(2)}</strong>
                  </button>
                ))
              ) : (
                <div className="side-empty">
                  <FaComments />
                  <span>Your picks will appear after your first question.</span>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

const css = `
.assistant-page {
  min-height: 100vh;
  padding: 96px 20px 44px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.16), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
}

.assistant-back {
  border: none;
  border-radius: 14px;
  padding: 12px 16px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.assistant-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: stretch;
}

.assistant-main,
.assistant-side {
  border-radius: 24px;
  background: rgba(255,255,255,.94);
  border: 1px solid rgba(80,36,42,.08);
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
}

.assistant-main {
  min-height: 720px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  overflow: hidden;
}

.assistant-hero {
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(247,231,206,.24), transparent 36%),
    linear-gradient(135deg, ${EMERALD}, #10231f);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
}

.assistant-avatar {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  color: #2b1114;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex: 0 0 auto;
}

.assistant-hero p,
.side-heading p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.assistant-hero h1,
.side-heading h2 {
  margin: 5px 0 0;
  font-family: Georgia, serif;
}

.assistant-hero h1 {
  font-size: 34px;
}

.starter-row {
  padding: 16px 18px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(80,36,42,.08);
}

.starter-row button {
  border: 1px solid rgba(163,133,96,.28);
  border-radius: 999px;
  padding: 10px 13px;
  background: #f8f4ee;
  color: ${WINE};
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.chat-window {
  min-height: 0;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 13px;
  overflow-y: auto;
}

.chat-message {
  display: flex;
}

.chat-message.user {
  justify-content: flex-end;
}

.chat-message > div {
  max-width: min(680px, 82%);
  border-radius: 18px;
  padding: 13px 15px;
  font-weight: 800;
  line-height: 1.55;
  white-space: pre-line;
}

.chat-message.assistant > div {
  background: #f8f4ee;
  color: #4b3f42;
  border-top-left-radius: 6px;
}

.chat-message.user > div {
  background: ${WINE};
  color: #fff;
  border-top-right-radius: 6px;
}

.typing {
  display: flex;
  gap: 6px;
  align-items: center;
}

.typing span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${GOLD};
  animation: zuriTyping 1s ease-in-out infinite;
}

.typing span:nth-child(2) {
  animation-delay: .14s;
}

.typing span:nth-child(3) {
  animation-delay: .28s;
}

.chat-composer {
  padding: 16px;
  border-top: 1px solid rgba(80,36,42,.08);
  display: grid;
  grid-template-columns: 1fr 48px;
  gap: 10px;
}

.chat-composer input {
  min-width: 0;
  border: 1px solid rgba(80,36,42,.14);
  border-radius: 16px;
  padding: 14px 16px;
  color: ${WINE};
  font-weight: 800;
  outline: none;
}

.chat-composer button {
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  color: #2b1114;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.chat-composer button:disabled,
.starter-row button:disabled {
  opacity: .58;
  cursor: not-allowed;
}

.assistant-side {
  padding: 22px;
}

.side-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.side-heading svg {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  padding: 12px;
  background: ${WINE};
  color: ${GOLD};
}

.side-heading h2 {
  color: ${WINE};
  font-size: 24px;
}

.side-products {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.side-product {
  border: 1px solid rgba(7,51,44,.12);
  border-radius: 16px;
  padding: 13px;
  background: #f8f4ee;
  color: ${WINE};
  text-align: left;
  cursor: pointer;
}

.side-product span,
.side-product strong,
.side-empty span {
  display: block;
}

.side-product span {
  font-weight: 900;
  line-height: 1.35;
}

.side-product strong {
  margin-top: 5px;
  color: ${EMERALD};
}

.side-empty {
  min-height: 220px;
  border-radius: 18px;
  background: #f8f4ee;
  color: #75686a;
  display: grid;
  place-content: center;
  gap: 10px;
  text-align: center;
  font-weight: 800;
  padding: 24px;
}

.side-empty svg {
  margin: 0 auto;
  color: ${GOLD};
  font-size: 28px;
}

@keyframes zuriTyping {
  0%, 100% { transform: translateY(0); opacity: .45; }
  50% { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 980px) {
  .assistant-shell {
    grid-template-columns: 1fr;
  }

  .assistant-main {
    min-height: 660px;
  }
}

@media (max-width: 620px) {
  .assistant-page {
    padding: 86px 14px 34px;
  }

  .assistant-hero {
    padding: 20px;
  }

  .assistant-hero h1 {
    font-size: 30px;
  }

  .chat-window {
    padding: 16px;
  }

  .chat-message > div {
    max-width: 92%;
  }
}
`;
