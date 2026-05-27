import API_BASE from "../services/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCamera, FaMagic, FaShoppingCart } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useCart } from "../context/CartContext";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function BeautyAnalysisPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const analyzeBeauty = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("user_id", user?.id || 2);

      const res = await fetch(`${API_BASE}/analyze-beauty`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Analysis failed.");
        return;
      }

      setResult(data);
    } catch (err) {
      console.error("BEAUTY ANALYSIS ERROR:", err);
      alert("Beauty analysis failed.");
    } finally {
      setLoading(false);
    }
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

      <main className="beauty-page">
        <button className="back-btn" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Shop
        </button>

        <button className="dashboard-link" onClick={() => navigate("/beauty-dashboard")}>
          View AI Beauty Dashboard
        </button>

        <section className="hero">
          <p>AI BEAUTY MATCH</p>
          <h1>Discover Your Zuri Beauty Profile</h1>
          <span>
            Upload a selfie and get personalized beauty, hair and skincare picks.
          </span>
        </section>

        <section className="layout">
          <div className="upload-card">
            <div className="preview">
              {preview ? (
                <img src={preview} alt="Preview" />
              ) : (
                <div className="placeholder">
                  <FaCamera />
                  <p>Upload your photo</p>
                </div>
              )}
            </div>

            <label className="upload-btn">
              Choose Image
              <input type="file" accept="image/*" onChange={handleImage} hidden />
            </label>

            <button className="analyze-btn" onClick={analyzeBeauty} disabled={loading}>
              <FaMagic />
              {loading ? "Analyzing..." : "Analyze Beauty Profile"}
            </button>

            <small className="note">
              AI vision analysis is active.
            </small>
          </div>

          <div className="result-card">
            {!result ? (
              <div className="empty">
                <h2>Your results will appear here</h2>
                <p>
                  Zuri will show your beauty profile, tips and recommended products.
                </p>
              </div>
            ) : (
              <>
                <p className="kicker">YOUR PROFILE</p>
                <h2>{result.beauty_goal}</h2>
                <p className="summary">{result.summary}</p>

                <div className="profile-grid">
                  <Info label="Skin Type" value={result.skin_type} />
                  <Info label="Hair Focus" value={result.hair_focus} />
                  <Info label="Face Shape" value={result.face_shape} />
                  <Info label="Mode" value={result.mode} />
                </div>

                <div className="beautyScoresGrid">
                  <ScoreCard label="Glow Score" value={result.glow_score} />
                  <ScoreCard label="Hair Health" value={result.hair_health_score} />
                  <ScoreCard label="Style Match" value={result.style_match_score} />
                </div>

                <h3>Beauty Tips</h3>
                <div className="tips">
                  {result.tips?.map((tip, index) => (
                    <div key={index} className="tip">
                      {tip}
                    </div>
                  ))}
                </div>

                <h3>Recommended Products</h3>
                <div className="products">
                  {result.recommended_products?.length > 0 ? (
                    result.recommended_products.map((product) => (
                      <article className="product" key={product.id}>
                        <div className="product-img">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} />
                          ) : (
                            <span>ZURI</span>
                          )}
                        </div>

                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.category || "Beauty"}</small>
                          <b>R {Number(product.price || 0).toFixed(2)}</b>

                          <button
                            onClick={() =>
                              addToCart({
                                ...product,
                                quantity: 1,
                              })
                            }
                          >
                            <FaShoppingCart /> Add
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="no-products">No matching products yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
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

function ScoreCard({ label, value }) {
  const score = Number(value || 0);

  return (
    <div className="beautyScoreCard">
      <span>{label}</span>

      <div className="scoreCircle">
        <svg>
          <circle cx="45" cy="45" r="38"></circle>

          <circle
            cx="45"
            cy="45"
            r="38"
            style={{
              strokeDashoffset: 240 - (240 * score) / 100,
            }}
          ></circle>
        </svg>

        <div className="scoreText">{score}%</div>
      </div>
    </div>
  );
}

const css = `
.beauty-page {
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
  color: white;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 20px;
}

.dashboard-link {
  border: 1px solid rgba(163,133,96,.45);
  border-radius: 16px;
  padding: 13px 18px;
  background: #fff;
  color: ${WINE};
  font-weight: 900;
  cursor: pointer;
  margin: 0 0 20px 10px;
}

.hero {
  padding: 42px;
  border-radius: 34px;
  color: white;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.32), transparent 38%),
    linear-gradient(135deg, ${WINE}, #241014);
  box-shadow: 0 24px 60px rgba(80,36,42,.25);
  margin-bottom: 24px;
}

.hero p,
.kicker {
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

.layout {
  display: grid;
  grid-template-columns: .85fr 1.15fr;
  gap: 24px;
  align-items: start;
}

.upload-card,
.result-card {
  background: rgba(255,255,255,.9);
  border-radius: 30px;
  padding: 26px;
  box-shadow: 0 18px 42px rgba(80,36,42,.11);
  border: 1px solid rgba(80,36,42,.08);
}

.preview {
  height: 420px;
  border-radius: 24px;
  overflow: hidden;
  background: #f8f4ee;
  display: grid;
  place-items: center;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  text-align: center;
  color: ${WINE};
  font-weight: 900;
}

.placeholder svg {
  font-size: 44px;
  color: ${GOLD};
}

.upload-btn,
.analyze-btn {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 17px;
  padding: 15px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  justify-content: center;
  gap: 9px;
  align-items: center;
}

.upload-btn {
  background: #f8f4ee;
  color: ${WINE};
}

.analyze-btn {
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  color: white;
}

.analyze-btn:disabled {
  opacity: .6;
}

.note {
  display: block;
  margin-top: 12px;
  color: #777;
  font-weight: 800;
  text-align: center;
}

.empty {
  min-height: 420px;
  display: grid;
  place-content: center;
  text-align: center;
  color: ${WINE};
}

.result-card h2 {
  color: #2b2023;
  font-size: 30px;
  font-family: Georgia, serif;
  margin: 8px 0;
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
  margin: 20px 0;
}

.info {
  background: #f8f4ee;
  border-radius: 18px;
  padding: 15px;
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

.beautyScoresGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 24px 0;
}

.beautyScoreCard {
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 14px 34px rgba(80,36,42,.18);
  transition: .3s ease;
}

.beautyScoreCard:hover {
  transform: translateY(-4px);
}

.beautyScoreCard span {
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.scoreCircle {
  position: relative;
  width: 90px;
  height: 90px;
  margin-top: 15px;
}

.scoreCircle svg {
  width: 90px;
  height: 90px;
  transform: rotate(-90deg);
}

.scoreCircle svg circle {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
}

.scoreCircle svg circle:first-child {
  stroke: rgba(255,255,255,.14);
}

.scoreCircle svg circle:last-child {
  stroke: ${GOLD};
  stroke-dasharray: 240;
  transition: 1s ease;
}

.scoreText {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  font-size: 20px;
  font-weight: 900;
  color: #fff;
}

.result-card h3 {
  color: ${WINE};
  margin-top: 22px;
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

.products {
  display: grid;
  gap: 12px;
}

.product {
  display: grid;
  grid-template-columns: 74px 1fr;
  gap: 13px;
  padding: 12px;
  border-radius: 18px;
  background: #f8f4ee;
}

.product-img {
  width: 74px;
  height: 74px;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: ${WINE};
  color: ${GOLD};
  font-weight: 900;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product strong,
.product small,
.product b {
  display: block;
}

.product small {
  color: #777;
  margin-top: 3px;
}

.product b {
  color: ${WINE};
  margin-top: 5px;
}

.product button {
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  padding: 9px 12px;
  background: ${WINE};
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.no-products {
  color: #777;
  font-weight: 800;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .preview {
    height: 360px;
  }
}

@media (max-width: 600px) {
  .beauty-page {
    padding: 95px 14px 34px;
  }

  .hero {
    padding: 30px 22px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .profile-grid,
  .beautyScoresGrid {
    grid-template-columns: 1fr;
  }
}
`;
