
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroSlider from "../components/HeroSlider";
import { FaUserPlus, FaTruckFast, FaShieldHalved, FaWhatsapp } from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setMessage("Account created successfully ✨");

      setTimeout(() => {
        navigate("/verify-email", { state: { email: formData.email } });
      }, 800);
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <style>{css}</style>

      <div className="register-hero-bg">
        <HeroSlider />
      </div>

      <div className="register-overlay" />

      <div className="brand-pill">ZURI ELEGANCE</div>

      <div className="delivery-pill">
        <FaTruckFast />
        <div>
          <strong>24-hour delivery</strong>
          <span>Cape Town & Joburg priority</span>
        </div>
      </div>

      <section className="register-card">
        <div className="icon-orb">
          <FaUserPlus />
        </div>

        <h1>Create Account</h1>
        <p>Join Zuri Elegance and start your luxury beauty experience.</p>

        <form onSubmit={handleRegister}>
          <input
            name="full_name"
            placeholder="Full name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="whatsapp-field">
            <div className="whatsapp-label">
              <FaWhatsapp />
              <span>WhatsApp Number</span>
            </div>

            <input
              type="tel"
              name="phone"
              placeholder="e.g. +27 71 234 5678 or +44 7700 900123"
              value={formData.phone}
              onChange={handleChange}
            />

            <small>
              Use your WhatsApp number for order confirmations, tracking and delivery updates.
            </small>
          </div>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirm_password"
            placeholder="Confirm password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {message && <small className="success">{message}</small>}
        {error && <small className="error">{error}</small>}

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <div className="secure-note">
          <FaShieldHalved />
          <span>Secure account creation</span>
        </div>
      </section>
    </main>
  );
}

const css = `
.register-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #000;
  font-family: Inter, Arial, sans-serif;
}

.register-hero-bg {
  position: fixed;
  inset: 0;
  z-index: 1;
}

.register-hero-bg .zuri-hero-slider {
  width: 100%;
  height: 100vh !important;
  min-height: 100vh !important;
  max-height: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.register-overlay {
  position: fixed;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 34%),
    linear-gradient(135deg, rgba(0,0,0,0.76), rgba(0,0,0,0.42), rgba(0,0,0,0.78));
  backdrop-filter: blur(4px);
}

.brand-pill {
  position: fixed;
  top: 26px;
  left: 28px;
  z-index: 5;
  padding: 10px 17px;
  border-radius: 999px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.16);
  color: #A38560;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  backdrop-filter: blur(18px);
}

.delivery-pill {
  position: fixed;
  top: 26px;
  right: 28px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 22px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.16);
  color: #fff;
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 34px rgba(0,0,0,0.28);
}

.delivery-pill svg {
  color: #A38560;
}

.delivery-pill strong {
  display: block;
  font-size: 13px;
}

.delivery-pill span {
  display: block;
  color: rgba(255,255,255,0.72);
  font-size: 11px;
}

.register-card {
  position: relative;
  z-index: 6;
  width: min(430px, calc(100% - 40px));
  margin: 90px auto 40px;
  padding: 30px 32px;
  border-radius: 30px;
  text-align: center;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.20);
  backdrop-filter: blur(24px);
  box-shadow:
    0 24px 70px rgba(0,0,0,0.42),
    inset 0 1px 0 rgba(255,255,255,0.12);
}

.icon-orb {
  width: 50px;
  height: 50px;
  margin: 0 auto 12px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #A38560;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.16);
  font-size: 21px;
}

.register-card h1 {
  margin: 0;
  color: #fff;
  font-size: 29px;
  font-weight: 900;
}

.register-card > p {
  margin: 8px 0 20px;
  color: rgba(255,255,255,0.76);
  font-weight: 700;
  font-size: 14px;
}

.register-card input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 15px;
  margin-bottom: 11px;
  border-radius: 15px;
  border: 1px solid rgba(255,255,255,0.20);
  outline: none;
  background: rgba(255,255,255,0.13);
  color: #fff;
  font-size: 15px;
}

.register-card input::placeholder {
  color: rgba(255,255,255,0.65);
}

.whatsapp-field {
  text-align: left;
  margin-bottom: 11px;
}

.whatsapp-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #A38560;
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 7px;
  letter-spacing: 0.5px;
}

.whatsapp-label svg {
  color: #25D366;
  font-size: 16px;
}

.whatsapp-field input {
  margin-bottom: 6px;
}

.whatsapp-field small {
  display: block;
  color: rgba(255,255,255,0.72);
  font-size: 11px;
  line-height: 1.4;
  font-weight: 700;
}

.register-card button {
  width: 100%;
  padding: 15px;
  margin-top: 6px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #A38560, #e2c180);
  color: #2b1114;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
}

.success {
  display: block;
  margin-top: 13px;
  color: #00ffae;
  font-weight: 800;
}

.error {
  display: block;
  margin-top: 13px;
  color: #ff8585;
  font-weight: 800;
}

.login-link {
  margin-top: 16px !important;
  color: rgba(255,255,255,0.82) !important;
  font-size: 14px;
}

.login-link a {
  color: #A38560;
  font-weight: 900;
  text-decoration: none;
}

.secure-note {
  margin: 14px auto 0;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.82);
  font-size: 12px;
  font-weight: 800;
}

.secure-note svg {
  color: #A38560;
}

@media (max-width: 700px) {
  .delivery-pill {
    display: none;
  }

  .brand-pill {
    top: 18px;
    left: 18px;
  }

  .register-card {
    margin-top: 80px;
    padding: 28px 22px;
  }
}
`;
