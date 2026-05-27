import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaEnvelope, FaTruck, FaEye, FaEyeSlash } from "react-icons/fa";


export default function LoginPage() {
  const navigate = useNavigate();

  const slides = [
    "/images/slide1.jpeg",
    "/images/slide2.jpeg",
    "/images/slide3.jpeg",
    "/images/slide4.jpeg",
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(data.user?.is_admin ? "/admin" : "/products");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = (resetEmail || email).trim();

    if (!targetEmail) {
      setResetMessage("Please enter the email address linked to your account.");
      return;
    }

    try {
      setResetLoading(true);
      setResetMessage("");

      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResetMessage(data.error || "Could not send reset email.");
        return;
      }

      setResetMessage(data.message || "Check your email for reset instructions.");
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR:", err);
      setResetMessage("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="login-page">
        <div className="slider-bg">
          {slides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt="Zuri Elegance"
              className={index === activeSlide ? "slide active" : "slide"}
            />
          ))}
        </div>

        <div className="login-overlay"></div>

        <div className="brand">ZURI ELEGANCE</div>

        <div className="delivery-card">
          <FaTruck />
          <div>
            <h3>24-hour delivery</h3>
            <p>Cape Town & Joburg priority</p>
          </div>
        </div>

        <section className="hero-text">
          <p>LUXURY HAIR EXPERIENCE</p>
          <h1>
            Elevate Your
            <br />
            Beauty
            <br />
            Routine.
          </h1>
          <span>
            Premium wigs, frontals, closures and beauty essentials crafted for
            confidence and elegance.
          </span>
        </section>

        <section className="login-card">
          <div className="icon-circle">
            <FaLock />
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to continue your luxury beauty experience</p>

          <div className="input-wrap">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-wrap password-wrap">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <button
            type="button"
            className="forgot-btn"
            onClick={() => {
              setResetMode((value) => !value);
              setResetEmail(email);
              setResetMessage("");
            }}
          >
            Forgot your password?
          </button>

          {resetMode && (
            <div className="reset-panel">
              <p>
                Enter your account email and we will send a secure reset link.
              </p>

              <div className="input-wrap reset-input">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Account email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              {resetMessage && <div className="reset-message">{resetMessage}</div>}

              <div className="reset-actions">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Email"}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => setResetMode(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="register-btn"
            onClick={() => navigate("/register")}
          >
            Don’t have an account? <span>Register</span>
          </button>
        </section>
      </main>
    </>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #13070a;
}

.slider-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transform: scale(1.08);
  transition: opacity 1.2s ease, transform 5s ease;
}

.slide.active {
  opacity: 1;
  transform: scale(1);
}

.login-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at center, rgba(163,133,96,0.10), transparent 36%),
    linear-gradient(90deg, rgba(15,6,8,0.90), rgba(80,36,42,0.38), rgba(15,6,8,0.78));
  backdrop-filter: blur(1px);
}

.brand {
  position: absolute;
  top: 28px;
  left: 32px;
  z-index: 10;
  padding: 11px 20px;
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.26);
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  backdrop-filter: blur(14px);
}

.delivery-card {
  position: absolute;
  top: 28px;
  right: 32px;
  z-index: 10;
  width: 260px;
  min-height: 76px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-radius: 24px;
  background: rgba(255,255,255,0.17);
  border: 1px solid rgba(255,255,255,0.26);
  color: white;
  backdrop-filter: blur(16px);
}

.delivery-card svg {
  color: #D6B37A;
  font-size: 25px;
}

.delivery-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
}

.delivery-card p {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255,255,255,0.80);
}

.hero-text {
  position: absolute;
  left: 70px;
  bottom: 78px;
  z-index: 5;
  max-width: 470px;
  color: white;
}

.hero-text p {
  margin: 0 0 12px;
  color: #D6B37A;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 3px;
}

.hero-text h1 {
  margin: 0;
  font-size: 66px;
  line-height: 0.95;
  font-family: Georgia, serif;
  font-weight: 900;
}

.hero-text span {
  display: block;
  margin-top: 18px;
  max-width: 430px;
  color: rgba(255,255,255,0.88);
  line-height: 1.7;
  font-size: 15px;
}

.login-card {
  position: relative;
  z-index: 10;
  width: 430px;
  padding: 42px 34px 32px;
  border-radius: 34px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.34);
  backdrop-filter: blur(22px);
  box-shadow: 0 28px 70px rgba(0,0,0,0.36);
}

.icon-circle {
  width: 58px;
  height: 58px;
  margin: 0 auto 20px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  color: #D6B37A;
  font-size: 20px;
  background: rgba(255,255,255,0.13);
  border: 1px solid rgba(255,255,255,0.28);
}

.login-card h2 {
  margin: 0;
  text-align: center;
  color: white;
  font-size: 44px;
  font-weight: 900;
}

.subtitle {
  text-align: center;
  color: rgba(255,255,255,0.82);
  margin: 12px 0 28px;
  font-size: 14px;
}

.input-wrap {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 16px;
  padding: 0 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.32);
}

.password-wrap {
  position: relative;
  padding-right: 62px;
}

.input-icon {
  color: rgba(255,255,255,0.90);
  font-size: 15px;
  flex-shrink: 0;
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent !important;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
}

.input-wrap input::placeholder {
  color: rgba(255,255,255,0.78);
}

.eye-toggle {
  position: absolute !important;
  right: 14px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 38px !important;
  height: 38px !important;
  border-radius: 999px !important;
  background: rgba(255,255,255,0.20) !important;
  color: #fff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  font-size: 15px !important;
  z-index: 5 !important;
}

.login-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 18px;
  margin-top: 8px;
  background: linear-gradient(135deg, #6A2740, #4A1830);
  color: white;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.forgot-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #D6B37A;
  font-weight: 900;
  cursor: pointer;
}

.reset-panel {
  margin-top: 14px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255,255,255,0.13);
  border: 1px solid rgba(255,255,255,0.22);
}

.reset-panel p {
  margin: 0 0 12px;
  color: rgba(255,255,255,0.82);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
}

.reset-input {
  height: 52px;
  margin-bottom: 10px;
}

.reset-message {
  margin: 8px 0 10px;
  color: #F4D08E;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 800;
}

.reset-actions {
  display: grid;
  grid-template-columns: 1fr 0.7fr;
  gap: 10px;
}

.reset-actions button {
  min-height: 42px;
  border: none;
  border-radius: 13px;
  background: #D6B37A;
  color: #2b1114;
  font-weight: 900;
  cursor: pointer;
}

.reset-actions button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.reset-actions .secondary {
  background: rgba(255,255,255,0.16);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.20);
}

.register-btn {
  width: 100%;
  min-height: 52px;
  margin-top: 14px;
  border-radius: 16px;
  background: rgba(80,36,42,0.80);
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.18);
}

.register-btn span {
  color: #D6B37A;
}

@media (max-width: 900px) {
  .login-page {
    padding: 24px;
  }

  .hero-text,
  .delivery-card {
    display: none;
  }

  .brand {
    top: 18px;
    left: 18px;
  }

  .login-card {
    width: 100%;
    max-width: 430px;
    padding: 36px 24px;
  }

  .login-card h2 {
    font-size: 38px;
  }
}
`;
