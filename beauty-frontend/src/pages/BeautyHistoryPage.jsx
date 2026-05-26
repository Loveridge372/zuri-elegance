import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClockRotateLeft, FaWandMagicSparkles } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WINE = "#50242A";
const GOLD = "#A38560";

export default function BeautyHistoryPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/beauty-analyses/${userId}`)
      .then((res) => res.json())
      .then((data) => setAnalyses(Array.isArray(data) ? data : []))
      .catch((err) => console.error("BEAUTY HISTORY ERROR:", err))
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="history-page">
        <button className="back-btn" onClick={() => navigate("/beauty-analysis")}>
          <FaArrowLeft /> Back to AI Beauty Match
        </button>

        <section className="hero">
          <p>AI BEAUTY MEMORY</p>
          <h1>Your Beauty Analysis History</h1>
          <span>Track your previous beauty profiles and personalized Zuri recommendations.</span>
        </section>

        {loading ? (
          <div className="empty">Loading your beauty history...</div>
        ) : analyses.length === 0 ? (
          <div className="empty">
            <FaClockRotateLeft />
            <h2>No beauty analyses yet</h2>
            <p>Run your first AI Beauty Match to start building your profile.</p>
            <button onClick={() => navigate("/beauty-analysis")}>Start Analysis</button>
          </div>
        ) : (
          <section className="history-grid">
            {analyses.map((item) => (
              <article className="history-card" key={item.id}>
                <div className="card-top">
                  <div className="icon">
                    <FaWandMagicSparkles />
                  </div>

                  <div>
                    <p>Analysis #{item.id}</p>
                    <small>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "No date"}
                    </small>
                  </div>
                </div>

                <h2>{item.beauty_goal}</h2>
                <p className="summary">{item.summary}</p>

                <div className="profile-grid">
                  <Info label="Skin Type" value={item.skin_type} />
                  <Info label="Hair Focus" value={item.hair_focus} />
                  <Info label="Face Shape" value={item.face_shape} />
                  <Info label="Mode" value={item.mode} />
                </div>

                <h3>Recommended Categories</h3>
                <div className="chips">
                  {item.recommended_categories?.map((cat, index) => (
                    <span key={index}>{cat}</span>
                  ))}
                </div>

                <h3>Beauty Tips</h3>
                <div className="tips">
                  {item.tips?.map((tip, index) => (
                    <div key={index} className="tip">
                      {tip}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value || "Not available"}</strong>
    </div>
  );
}

const css = `
.history-page {
  min-height: 100vh;
  padding: 110px 20px 44px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
}

.back-btn {
  border: none;
  border-radius: 16px;
  padding: 13px 18px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 20px;
}

.hero {
  padding: 42px;
  border-radius: 34px;
  color: #fff;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.32), transparent 38%),
    linear-gradient(135deg, ${WINE}, #241014);
  box-shadow: 0 24px 60px rgba(80,36,42,.25);
  margin-bottom: 24px;
}

.hero p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.hero h1 {
  font-family: Georgia, serif;
  font-size: 44px;
  margin: 10px 0;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.history-card,
.empty {
  background: rgba(255,255,255,.9);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 42px rgba(80,36,42,.11);
  border: 1px solid rgba(80,36,42,.08);
}

.card-top {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: ${WINE};
  color: ${GOLD};
}

.card-top p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 1px;
}

.card-top small {
  color: #777;
  font-weight: 800;
}

.history-card h2 {
  color: #2b2023;
  font-family: Georgia, serif;
  margin: 18px 0 8px;
}

.summary {
  color: #6e6265;
  line-height: 1.6;
  font-weight: 700;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 18px 0;
}

.info {
  background: #f8f4ee;
  border-radius: 16px;
  padding: 13px;
}

.info span {
  display: block;
  color: #777;
  font-size: 12px;
  font-weight: 900;
}

.info strong {
  display: block;
  color: ${WINE};
  margin-top: 5px;
}

.history-card h3 {
  color: ${WINE};
  margin-top: 18px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips span {
  padding: 8px 12px;
  border-radius: 999px;
  background: ${GOLD};
  color: #2b1114;
  font-weight: 900;
  font-size: 12px;
}

.tips {
  display: grid;
  gap: 10px;
}

.tip {
  background: #f8f4ee;
  border-radius: 16px;
  padding: 13px;
  color: #4b3f42;
  font-weight: 800;
}

.empty {
  text-align: center;
  color: ${WINE};
}

.empty svg {
  font-size: 40px;
  color: ${GOLD};
}

.empty button {
  border: none;
  border-radius: 16px;
  padding: 14px 20px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 800px) {
  .history-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 30px 22px;
  }

  .hero h1 {
    font-size: 34px;
  }
}

@media (max-width: 520px) {
  .history-page {
    padding: 95px 14px 34px;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }
}
`;
