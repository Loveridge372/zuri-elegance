import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBagShopping,
  FaClockRotateLeft,
  FaEnvelope,
  FaFloppyDisk,
  FaGift,
  FaGem,
  FaLocationDot,
  FaPhone,
  FaRightFromBracket,
  FaShieldHalved,
  FaStar,
  FaTruckFast,
  FaUser,
} from "react-icons/fa6";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Seo from "../components/Seo";


export default function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rewards, setRewards] = useState(null);
  const [rewardsError, setRewardsError] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (!token || !storedUser?.id) {
      setError("Your saved session is missing. Please login again.");
      setLoading(false);
      return;
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/profile/${storedUser.id}`, { headers: authHeaders })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load profile.");
        return data;
      })
      .then((data) => {
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          address: data.address || "",
        });
      })
      .catch((err) => setError(err.message || "Could not connect to server."))
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/profile/${storedUser.id}/rewards`, { headers: authHeaders })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load rewards.");
        return data;
      })
      .then((data) => setRewards(data))
      .catch((err) => setRewardsError(err.message || "Could not load rewards."));
  }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token || !storedUser?.id) {
      setError("Session missing. Please login again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/profile/${storedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Profile update failed.");
        return;
      }

      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...form }));
      setMessage("Profile updated successfully.");
    } catch {
      setError("Could not connect to server.");
    }
  };

  return (
    <>
      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      <Seo
        title="My Profile | Zuri Elegance"
        description="Manage your Zuri Elegance customer profile, delivery address and account details."
      />
      <main className="profile-page">
        <style>{css}</style>

        {loading ? (
          <div className="loading-card">Loading profile...</div>
        ) : (
          <>
            <section className="profile-hero">
              <div>
                <p>ZURI ACCOUNT</p>
                <h1>My Profile</h1>
                <span>Keep your contact and delivery details ready for faster checkout.</span>
              </div>

              <div className="hero-actions">
                <button className="shop-btn" onClick={() => navigate("/products")}>
                  Back to Shop
                </button>
                <button className="logout-btn" onClick={logout}>
                  <FaRightFromBracket />
                  Logout
                </button>
              </div>
            </section>

            {error && <div className="error-banner"><strong>Profile notice:</strong> {error}</div>}

            <section className="profile-grid">
              <aside className="profile-card">
                <div className="avatar"><FaUser /></div>
                <h2>{form.full_name || storedUser?.full_name || "Zuri Customer"}</h2>
                <p>{form.email || storedUser?.email || "No email loaded"}</p>

                <div className="badge">
                  <FaShieldHalved />
                  {storedUser?.is_admin ? "Admin Account" : "Customer Account"}
                </div>

                {storedUser?.is_admin && (
                  <button className="admin-btn" onClick={() => navigate("/admin")}>
                    Open Admin Dashboard
                  </button>
                )}

                <div className="quick-actions">
                  <button type="button" onClick={() => navigate("/orders")}><FaBagShopping /> Orders</button>
                  <button type="button" onClick={() => navigate("/tracking")}><FaTruckFast /> Track</button>
                  <button type="button" onClick={() => navigate("/beauty-history")}><FaClockRotateLeft /> Beauty History</button>
                </div>
              </aside>

              <div className="profile-main">
                <RewardsPanel rewards={rewards} error={rewardsError} />

                <form className="details-card" onSubmit={updateProfile}>
                  <div className="form-head">
                    <div>
                      <p>PROFILE DETAILS</p>
                      <h2>Account Details</h2>
                    </div>
                    <span>{storedUser?.is_verified ? "Verified" : "Not verified"}</span>
                  </div>

                  <div className="form-grid">
                    <Field icon={<FaUser />} label="Full Name" value={form.full_name} placeholder="Full name" onChange={(value) => setForm((p) => ({ ...p, full_name: value }))} />
                    <Field icon={<FaEnvelope />} label="Email" value={form.email} placeholder="Email" onChange={(value) => setForm((p) => ({ ...p, email: value }))} />
                    <Field icon={<FaPhone />} label="Phone" type="tel" value={form.phone} placeholder="+27 71 234 5678 or +44 7700 900123" onChange={(value) => setForm((p) => ({ ...p, phone: value }))} />
                    <Field icon={<FaLocationDot />} label="City" value={form.city} placeholder="City" onChange={(value) => setForm((p) => ({ ...p, city: value }))} />
                  </div>

                  <label className="wide-field">
                    <span><FaLocationDot /> Delivery Address</span>
                    <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Delivery address" />
                  </label>

                  <button className="save-btn" type="submit">
                    <FaFloppyDisk />
                    Save Changes
                  </button>

                  {message && <small className="success">{message}</small>}
                </form>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function RewardsPanel({ rewards, error }) {
  const points = Number(rewards?.points_balance || 0);
  const threshold = Number(rewards?.reward_threshold || 100);
  const progress = Math.min(100, Math.round(((points % threshold) / threshold) * 100));
  const pointsToNext = Number(rewards?.points_to_next_reward ?? threshold);
  const history = rewards?.history || [];
  const randPerPoint = rewards?.points_per_rand
    ? Math.round(1 / Number(rewards.points_per_rand))
    : 0;

  return (
    <section className="rewards-card">
      <div className="rewards-head">
        <div>
          <p>MY REWARDS</p>
          <h2>Zuri Rewards</h2>
        </div>
        <span><FaGem /> {rewards?.tier || "Starter"}</span>
      </div>

      {error ? (
        <div className="rewards-error">{error}</div>
      ) : (
        <>
          <div className="rewards-summary">
            <div className="points-balance">
              <FaGift />
              <strong>{points}</strong>
              <span>points available</span>
            </div>
            <div className="reward-stat">
              <span>Voucher Value</span>
              <strong>R{Number(rewards?.voucher_value || 0).toFixed(0)}</strong>
            </div>
            <div className="reward-stat">
              <span>Eligible Orders</span>
              <strong>{Number(rewards?.eligible_orders || 0)}</strong>
            </div>
          </div>

          <div className="reward-progress">
            <div>
              <strong>{rewards?.is_enabled === false ? "Rewards are paused" : pointsToNext === 0 ? "Reward unlocked" : `${pointsToNext} points to your next reward`}</strong>
              <span>
                {randPerPoint
                  ? `Earn 1 point for every R${randPerPoint} spent on eligible orders.`
                  : "Rewards are configured by Zuri Elegance."}
              </span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${pointsToNext === 0 ? 100 : progress}%` }} />
            </div>
          </div>

          <div className="reward-history">
            <h3><FaStar /> Recent Points</h3>
            {history.length ? (
              history.map((item) => (
                <div className="reward-row" key={item.order_id}>
                  <span>Order #{item.order_id}</span>
                  <strong>+{item.points} pts</strong>
                </div>
              ))
            ) : (
              <div className="reward-empty">Paid orders will appear here once you start earning points.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Field({ icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <label>
      <span>{icon} {label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

const css = `
.profile-page{min-height:100vh;padding:94px 24px 40px;background:radial-gradient(circle at top right,rgba(163,133,96,.18),transparent 34%),linear-gradient(180deg,#fbf7f1,#f8f4ee);font-family:Inter,Arial,sans-serif}
.profile-hero,.profile-grid,.error-banner,.loading-card{max-width:1180px;margin-left:auto;margin-right:auto}
.profile-hero{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:34px;border-radius:28px;background:radial-gradient(circle at top right,rgba(163,133,96,.28),transparent 34%),linear-gradient(135deg,#07332c,#50242A,#1f0f12);color:#fff;box-shadow:0 24px 60px rgba(80,36,42,.25);margin-bottom:18px}
.profile-hero p,.form-head p,.rewards-head p{margin:0;color:#A38560;font-weight:900;letter-spacing:1.8px;font-size:12px}
.profile-hero h1{margin:8px 0;font-size:42px;font-family:Georgia,serif}
.profile-hero span{color:rgba(255,255,255,.75);font-weight:800}
.hero-actions{display:flex;align-items:center;gap:12px}
.logout-btn,.shop-btn{border:none;cursor:pointer;padding:13px 18px;border-radius:999px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:9px}
.logout-btn{background:rgba(255,255,255,.12);color:#fff}
.shop-btn{background:linear-gradient(135deg,#A38560,#e2c180);color:#2b1114;box-shadow:0 12px 28px rgba(163,133,96,.22)}
.error-banner{margin-bottom:18px;padding:14px 18px;border-radius:18px;background:rgba(192,57,74,.12);color:#8d2633;font-weight:800}
.profile-grid{display:grid;grid-template-columns:330px 1fr;gap:18px}
.profile-main{display:grid;gap:18px}
.profile-card,.details-card,.loading-card,.rewards-card{background:rgba(255,255,255,.9);border:1px solid rgba(80,36,42,.08);border-radius:24px;padding:24px;box-shadow:0 18px 42px rgba(80,36,42,.12)}
.profile-card{text-align:center;height:fit-content}
.avatar{width:86px;height:86px;margin:0 auto 16px;border-radius:26px;display:grid;place-items:center;background:linear-gradient(135deg,#50242A,#A38560);color:#fff;font-size:34px}
.profile-card h2{margin:0;color:#2b2023}
.profile-card p{color:#777;word-break:break-word;font-weight:800}
.badge{width:fit-content;margin:18px auto;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:#f8f4ee;color:#50242A;font-weight:900}
.admin-btn,.save-btn{width:100%;border:none;border-radius:16px;padding:14px;background:#50242A;color:#fff;font-weight:900;cursor:pointer}
.quick-actions{display:grid;gap:10px;margin-top:18px}
.quick-actions button{border:1px solid rgba(80,36,42,.12);border-radius:15px;padding:12px;background:#fffaf5;color:#50242A;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
.form-head,.rewards-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:18px}
.form-head h2,.rewards-head h2{margin:4px 0 0;color:#2b2023;font-size:28px;font-family:Georgia,serif}
.form-head span,.rewards-head span{border-radius:999px;padding:8px 12px;background:#f8f4ee;color:#07332c;font-weight:900;font-size:12px;display:flex;align-items:center;gap:7px;white-space:nowrap}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.details-card label{display:block;margin-bottom:15px}
.details-card label span{display:flex;align-items:center;gap:8px;color:#50242A;font-weight:900;font-size:13px;margin-bottom:7px}
.details-card input,.details-card textarea{width:100%;box-sizing:border-box;padding:14px;border-radius:15px;border:1px solid #eadfd6;outline:none;background:#fffaf5;color:#1f1719;font-weight:800}
.details-card input:focus,.details-card textarea:focus{border-color:#A38560;box-shadow:0 0 0 3px rgba(163,133,96,.16);background:#fff}
.details-card textarea{min-height:112px}
.save-btn{display:flex;justify-content:center;align-items:center;gap:9px}
.success{display:block;margin-top:13px;font-weight:900;color:#128c56}
.rewards-card{background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(255,250,245,.92))}
.rewards-summary{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px}
.points-balance,.reward-stat{border:1px solid rgba(80,36,42,.09);border-radius:18px;padding:16px;background:#fffaf5}
.points-balance{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px 12px;color:#50242A}
.points-balance svg{font-size:28px;color:#A38560}
.points-balance strong{font-size:42px;line-height:1;font-family:Georgia,serif;color:#50242A}
.points-balance span{grid-column:2;color:#75686a;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:1px}
.reward-stat span{display:block;color:#75686a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px}
.reward-stat strong{display:block;margin-top:8px;color:#07332c;font-size:26px;font-family:Georgia,serif}
.reward-progress{margin-top:14px;border:1px solid rgba(7,51,44,.1);border-radius:18px;padding:16px;background:rgba(7,51,44,.04)}
.reward-progress strong{display:block;color:#2b2023}
.reward-progress span{display:block;margin-top:5px;color:#75686a;font-weight:800}
.progress-track{height:11px;border-radius:999px;background:#eadfd6;overflow:hidden;margin-top:12px}
.progress-track span{height:100%;margin:0;background:linear-gradient(90deg,#07332c,#A38560);border-radius:999px}
.reward-history{margin-top:16px}
.reward-history h3{display:flex;align-items:center;gap:8px;margin:0 0 10px;color:#50242A;font-size:15px}
.reward-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid rgba(80,36,42,.08);font-weight:900;color:#75686a}
.reward-row strong{color:#128c56}
.reward-empty,.rewards-error{padding:13px;border-radius:15px;background:#fffaf5;color:#75686a;font-weight:800}
.rewards-error{color:#8d2633;background:rgba(192,57,74,.1)}
@media(max-width:850px){.profile-page{padding:76px 12px 28px}.profile-hero{flex-direction:column;align-items:flex-start;padding:26px 18px}.hero-actions{width:100%;flex-direction:column}.hero-actions button{width:100%}.profile-grid,.form-grid,.rewards-summary{grid-template-columns:1fr}.profile-hero h1{font-size:34px}.rewards-head{flex-direction:column}.points-balance strong{font-size:36px}}
`;
