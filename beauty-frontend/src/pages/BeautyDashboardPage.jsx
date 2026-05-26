import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBrain,
  FaCalendarAlt,
  FaChartLine,
  FaCrown,
  FaGem,
  FaLightbulb,
  FaRedo,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useCart } from "../context/CartContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function BeautyDashboardPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const [historyRes, recommendationsRes] = await Promise.all([
          fetch(`${API_BASE}/beauty-analyses/${userId}`),
          fetch(`${API_BASE}/recommendations/${userId}`),
        ]);

        const historyData = await historyRes.json();
        const recommendationsData = await recommendationsRes.json();

        setAnalyses(Array.isArray(historyData) ? historyData : []);
        setRecommendations(
          Array.isArray(recommendationsData) ? recommendationsData.slice(0, 4) : []
        );
      } catch (err) {
        console.error("BEAUTY DASHBOARD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [userId, navigate]);

  const latest = analyses[0];

  const scoreHistory = useMemo(
    () =>
      analyses
        .slice(0, 5)
        .reverse()
        .map((item) => ({
          id: item.id,
          date: item.created_at ? new Date(item.created_at) : null,
          score: getGlowScore(item),
        })),
    [analyses]
  );

  const memory = useMemo(() => buildBeautyMemory(analyses), [analyses]);
  const insights = useMemo(() => buildInsights(latest), [latest]);
  const routines = useMemo(() => buildRoutines(latest), [latest]);

  const currentScore = latest ? getGlowScore(latest) : 0;
  const previousScore = analyses[1] ? getGlowScore(analyses[1]) : currentScore;
  const scoreDelta = currentScore - previousScore;

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="beauty-dashboard-page">
        <button className="back-btn" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Shop
        </button>

        <section className="dashboard-hero">
          <div>
            <p>AI BEAUTY DASHBOARD</p>
            <h1>Your Zuri Beauty Intelligence</h1>
            <span>
              Track your beauty profile, glow progress, routines and personal
              recommendations in one place.
            </span>
          </div>

          <button onClick={() => navigate("/beauty-analysis")}>
            <FaRedo />
            Retake Analysis
          </button>
        </section>

        {loading ? (
          <section className="empty-card">Loading your AI Beauty Dashboard...</section>
        ) : !latest ? (
          <section className="empty-card">
            <FaCrown />
            <h2>No beauty profile yet</h2>
            <p>Start your AI Beauty Match to unlock your dashboard.</p>
            <button onClick={() => navigate("/beauty-analysis")}>
              Start AI Beauty Match
            </button>
          </section>
        ) : (
          <>
            <section className="overview-grid">
              <ScorePanel
                score={currentScore}
                delta={scoreDelta}
                history={scoreHistory}
              />

              <ProfileMemory memory={memory} latest={latest} />
            </section>

            <section className="dashboard-grid">
              <Panel
                icon={<FaLightbulb />}
                kicker="BEAUTY INSIGHTS"
                title="What Zuri remembers"
              >
                <div className="insight-list">
                  {insights.map((insight) => (
                    <div className="insight" key={insight}>
                      {insight}
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                icon={<FaCalendarAlt />}
                kicker="AI ROUTINES"
                title="Your suggested routine"
              >
                <div className="routine-list">
                  {routines.map((routine) => (
                    <div className="routine" key={routine.title}>
                      <strong>{routine.title}</strong>
                      <span>{routine.text}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="recommendation-panel">
              <div className="panel-heading">
                <div>
                  <p>TOP RECOMMENDATIONS</p>
                  <h2>Matched To Your Beauty Profile</h2>
                </div>

                <button onClick={() => navigate("/products")}>Shop All</button>
              </div>

              <div className="recommendation-grid">
                {recommendations.length > 0 ? (
                  recommendations.map((product) => (
                    <article className="recommendation-card" key={product.id}>
                      <div className="product-image">
                        {getProductImage(product) ? (
                          <img src={getProductImage(product)} alt={product.name} />
                        ) : (
                          <span>ZURI</span>
                        )}
                      </div>

                      <div className="product-copy">
                        <small>{product.category || "Beauty"}</small>
                        <h3>{product.name}</h3>
                        <p>{product.ai_match_reason || "Selected from your latest AI beauty profile."}</p>
                        <strong>R {Number(product.price || 0).toFixed(2)}</strong>
                      </div>

                      <button
                        onClick={() =>
                          addToCart({
                            ...product,
                            quantity: 1,
                          })
                        }
                      >
                        <FaShoppingCart />
                        Add
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty-inline">
                    Run a fresh AI Beauty Match to refresh your recommendations.
                  </div>
                )}
              </div>
            </section>

            <section className="history-strip">
              <div>
                <p>GLOW SCORE HISTORY</p>
                <h2>Your recent analyses</h2>
              </div>

              <button onClick={() => navigate("/beauty-history")}>
                View Full History
              </button>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function ScorePanel({ score, delta, history }) {
  return (
    <section className="score-panel">
      <div className="score-copy">
        <p>GLOW SCORE</p>
        <h2>{score}%</h2>
        <span className={delta >= 0 ? "delta positive" : "delta"}>
          {delta >= 0 ? "+" : ""}
          {delta}% from last analysis
        </span>
      </div>

      <div
        className="score-ring"
        style={{
          background: `conic-gradient(${GOLD} ${score * 3.6}deg, rgba(255,255,255,.16) 0deg)`,
        }}
      >
        <div>
          <FaStar />
          <strong>{score}</strong>
        </div>
      </div>

      <div className="score-bars">
        {history.map((item) => (
          <div className="score-bar" key={item.id}>
            <span>{item.date ? item.date.toLocaleDateString() : "Recent"}</span>
            <div>
              <i style={{ width: `${item.score}%` }} />
            </div>
            <strong>{item.score}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileMemory({ memory, latest }) {
  return (
    <section className="memory-panel">
      <div className="memory-heading">
        <FaBrain />
        <div>
          <p>BEAUTY PROFILE MEMORY</p>
          <h2>{latest.beauty_goal || "Your beauty profile"}</h2>
        </div>
      </div>

      <div className="memory-grid">
        {memory.map((item) => (
          <div className="memory-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Panel({ icon, kicker, title, children }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-title">
        <div className="panel-icon">{icon}</div>
        <div>
          <p>{kicker}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {children}
    </section>
  );
}

function getGlowScore(item) {
  const text = `${item.skin_type || ""} ${item.hair_focus || ""} ${item.beauty_goal || ""}`.toLowerCase();
  let score = 82;

  if (text.includes("glow")) score += 7;
  if (text.includes("hydr")) score += 5;
  if (text.includes("premium")) score += 4;
  if (text.includes("healthy")) score += 4;
  if (text.includes("dry")) score -= 3;
  if (text.includes("sensitive")) score -= 2;

  return Math.max(68, Math.min(score, 98));
}

function buildBeautyMemory(analyses) {
  const latest = analyses[0] || {};

  return [
    { label: "Skin Type", value: latest.skin_type || "Not captured yet" },
    { label: "Hair Focus", value: latest.hair_focus || "Not captured yet" },
    { label: "Face Shape", value: latest.face_shape || "Not captured yet" },
    { label: "Analyses", value: `${analyses.length} saved profile${analyses.length === 1 ? "" : "s"}` },
  ];
}

function buildInsights(latest) {
  if (!latest) return [];

  const insights = [];
  const hair = String(latest.hair_focus || "").toLowerCase();
  const skin = String(latest.skin_type || "").toLowerCase();
  const goal = String(latest.beauty_goal || "").toLowerCase();

  if (hair.includes("wig") || hair.includes("hair")) {
    insights.push("Your recommendations should prioritize premium hair pieces, secure finishes and styling support.");
  }

  if (skin.includes("dry") || goal.includes("glow")) {
    insights.push("Hydration-led skincare and glow maintenance products are a strong fit for your profile.");
  }

  if (latest.recommended_categories?.length) {
    insights.push(`Zuri is currently watching ${latest.recommended_categories.slice(0, 3).join(", ")} for your next best picks.`);
  }

  return insights.length
    ? insights
    : ["Your latest beauty profile is ready. Retake the analysis whenever your style goals change."];
}

function buildRoutines(latest) {
  const goal = String(latest?.beauty_goal || "").toLowerCase();

  return [
    {
      title: "Morning glow prep",
      text: goal.includes("glow")
        ? "Hydrate, protect and choose lightweight glow-supporting products."
        : "Start with clean, simple prep before styling or product layering.",
    },
    {
      title: "Hair finish check",
      text: "Keep lace, edges and styling tools aligned with your current hair focus.",
    },
    {
      title: "Weekly profile refresh",
      text: "Retake your AI Beauty Match when your skin, hair goals or occasion changes.",
    },
  ];
}

function getProductImage(product) {
  return (
    product.image_url ||
    product.image_url_2 ||
    product.image_url_3 ||
    product.image_url_4 ||
    ""
  );
}

const css = `
.beauty-dashboard-page {
  min-height: 100vh;
  padding: 96px 20px 44px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.16), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
}

.back-btn {
  border: none;
  border-radius: 15px;
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

.dashboard-hero {
  padding: 34px;
  border-radius: 30px;
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(247,231,206,.22), transparent 34%),
    linear-gradient(135deg, ${EMERALD}, #10231f);
  box-shadow: 0 24px 60px rgba(7,51,44,.24);
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  margin-bottom: 22px;
}

.dashboard-hero p,
.score-copy p,
.memory-heading p,
.panel-title p,
.panel-heading p,
.history-strip p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.dashboard-hero h1 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 42px;
  line-height: 1;
}

.dashboard-hero span {
  color: rgba(255,255,255,.78);
  font-weight: 700;
  line-height: 1.6;
}

.dashboard-hero button,
.panel-heading button,
.history-strip button,
.empty-card button {
  border: none;
  border-radius: 16px;
  padding: 14px 17px;
  background: linear-gradient(135deg, ${GOLD}, #F7E7CE);
  color: #2b1114;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.overview-grid,
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.score-panel,
.memory-panel,
.dashboard-panel,
.recommendation-panel,
.history-strip,
.empty-card {
  background: rgba(255,255,255,.94);
  border: 1px solid rgba(80,36,42,.08);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
}

.score-panel {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 18px;
}

.score-copy h2 {
  margin: 6px 0;
  color: ${WINE};
  font-family: Georgia, serif;
  font-size: 52px;
  line-height: 1;
}

.delta {
  color: #7c6268;
  font-weight: 900;
}

.delta.positive {
  color: ${EMERALD};
}

.score-ring {
  width: 142px;
  height: 142px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  justify-self: end;
}

.score-ring > div {
  width: 112px;
  height: 112px;
  border-radius: 999px;
  background: ${WINE};
  color: #fff;
  display: grid;
  place-items: center;
}

.score-ring svg {
  color: ${GOLD};
}

.score-ring strong {
  font-size: 30px;
  font-family: Georgia, serif;
}

.score-bars {
  grid-column: 1 / -1;
  display: grid;
  gap: 9px;
}

.score-bar {
  display: grid;
  grid-template-columns: 90px 1fr 44px;
  gap: 10px;
  align-items: center;
  color: ${WINE};
  font-size: 11px;
  font-weight: 900;
}

.score-bar div {
  height: 9px;
  border-radius: 999px;
  background: #f1e8de;
  overflow: hidden;
}

.score-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, ${EMERALD}, ${GOLD});
}

.memory-heading,
.panel-title,
.panel-heading,
.history-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.memory-heading {
  justify-content: flex-start;
}

.memory-heading svg,
.panel-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  background: ${WINE};
  color: ${GOLD};
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.memory-heading h2,
.panel-title h2,
.panel-heading h2,
.history-strip h2,
.empty-card h2 {
  margin: 5px 0 0;
  color: ${WINE};
  font-family: Georgia, serif;
}

.memory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.memory-item,
.insight,
.routine {
  border-radius: 17px;
  padding: 14px;
  background: #f8f4ee;
  color: ${WINE};
}

.memory-item span {
  display: block;
  color: #75686a;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .5px;
  text-transform: uppercase;
}

.memory-item strong {
  display: block;
  margin-top: 5px;
}

.insight-list,
.routine-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.insight,
.routine span {
  color: #5d4f52;
  font-weight: 800;
  line-height: 1.55;
}

.routine strong {
  display: block;
  margin-bottom: 5px;
  color: ${WINE};
}

.recommendation-panel {
  margin-bottom: 18px;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.recommendation-card {
  border-radius: 22px;
  overflow: hidden;
  background: #f8f4ee;
  border: 1px solid rgba(7,51,44,.14);
  display: flex;
  flex-direction: column;
}

.product-image {
  height: 170px;
  background: ${WINE};
  color: ${GOLD};
  display: grid;
  place-items: center;
  font-weight: 900;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-copy {
  padding: 14px;
  flex: 1;
}

.product-copy small {
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.product-copy h3 {
  margin: 6px 0;
  color: ${WINE};
  font-size: 15px;
}

.product-copy p {
  color: #65575a;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.product-copy strong {
  color: ${WINE};
}

.recommendation-card > button {
  margin: 0 14px 14px;
  border: none;
  border-radius: 14px;
  padding: 11px;
  background: ${EMERALD};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-card,
.empty-inline {
  text-align: center;
  color: ${WINE};
  font-weight: 800;
}

.empty-card svg {
  color: ${GOLD};
  font-size: 42px;
}

.empty-card p {
  color: #75686a;
}

@media (max-width: 980px) {
  .overview-grid,
  .dashboard-grid,
  .recommendation-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-hero,
  .history-strip,
  .panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .beauty-dashboard-page {
    padding: 86px 14px 34px;
  }

  .dashboard-hero {
    padding: 26px 20px;
  }

  .dashboard-hero h1 {
    font-size: 34px;
  }

  .score-panel {
    grid-template-columns: 1fr;
  }

  .score-ring {
    justify-self: start;
  }

  .memory-grid {
    grid-template-columns: 1fr;
  }
}
`;
