import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submitReset = async () => {
    if (!token) {
      setMessage("This reset link is missing or invalid.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not reset password.");
        return;
      }

      setMessage(data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <main className="reset-page">
        <section className="reset-card">
          <div className="icon-circle">
            <FaLock />
          </div>

          <p className="kicker">ZURI ELEGANCE</p>
          <h1>Reset Password</h1>
          <span>Create a new password for your account.</span>

          <div className="input-wrap">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="input-wrap">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message && <div className="message">{message}</div>}

          <button className="reset-btn" onClick={submitReset} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button className="login-link" onClick={() => navigate("/login")}>
            Back to login
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

.reset-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,0.28), transparent 34%),
    linear-gradient(135deg, #13070a, #50242A, #1f0f12);
  font-family: Inter, Arial, sans-serif;
}

.reset-card {
  width: min(430px, 100%);
  padding: 38px 30px 30px;
  border-radius: 32px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.32);
  color: #fff;
  box-shadow: 0 28px 70px rgba(0,0,0,0.34);
  backdrop-filter: blur(22px);
}

.icon-circle {
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  color: #D6B37A;
  background: rgba(255,255,255,0.13);
  border: 1px solid rgba(255,255,255,0.28);
}

.kicker {
  margin: 0;
  text-align: center;
  color: #D6B37A;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
}

h1 {
  margin: 8px 0 8px;
  text-align: center;
  font-family: Georgia, serif;
  font-size: 40px;
}

.reset-card > span {
  display: block;
  margin-bottom: 24px;
  text-align: center;
  color: rgba(255,255,255,0.82);
  font-weight: 700;
}

.input-wrap {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 14px;
  padding: 0 14px 0 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.32);
}

.input-icon {
  color: rgba(255,255,255,0.90);
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
}

.input-wrap input::placeholder {
  color: rgba(255,255,255,0.76);
}

.input-wrap button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: rgba(255,255,255,0.20);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.message {
  margin: 8px 0 12px;
  color: #F4D08E;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 800;
  text-align: center;
}

.reset-btn,
.login-link {
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 17px;
  font-weight: 900;
  cursor: pointer;
}

.reset-btn {
  background: linear-gradient(135deg, #D6B37A, #A38560);
  color: #2b1114;
}

.reset-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-link {
  margin-top: 12px;
  background: rgba(255,255,255,0.14);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.20);
}
`;
