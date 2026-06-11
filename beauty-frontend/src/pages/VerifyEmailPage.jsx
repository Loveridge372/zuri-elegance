import API_BASE from "../services/api";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }

      setMessage("Email verified successfully ✨ Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.error("VERIFY EMAIL ERROR:", err);
      setError("Could not connect to server. Make sure Flask is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setError("");
    setResending(true);

    try {
      const res = await fetch(`${API_BASE}/resend-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not resend code.");
        return;
      }

      setMessage(data.message || "Verification code sent again.");
    } catch (err) {
      console.error("RESEND EMAIL ERROR:", err);
      setError("Could not connect to server.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.kicker}>EMAIL VERIFICATION</p>
        <h1 style={styles.title}>Verify Your Email</h1>
        <p style={styles.subtitle}>
          Enter the verification code sent to your email address.
        </p>

        <form onSubmit={handleVerify} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            required
          />

          <button style={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <button style={styles.secondaryBtn} onClick={handleResend} disabled={resending}>
          {resending ? "Sending..." : "Resend Code"}
        </button>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <Link to="/login" style={styles.link}>
          Back to Login
        </Link>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top left, rgba(163,133,96,0.22), transparent 32%), #f8f4ee",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    padding: "34px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.82)",
    boxShadow: "0 24px 60px rgba(80,36,42,0.14)",
    border: "1px solid rgba(255,255,255,0.55)",
  },
  kicker: {
    color: "#A38560",
    fontWeight: "900",
    letterSpacing: "2px",
    fontSize: "12px",
    margin: 0,
  },
  title: {
    margin: "10px 0",
    color: "#2b2023",
    fontSize: "40px",
    fontWeight: "900",
  },
  subtitle: {
    color: "#666",
    fontWeight: "700",
    lineHeight: "1.5",
  },
  form: {
    marginTop: "22px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    marginBottom: "13px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    outline: "none",
    fontSize: "15px",
  },
  primaryBtn: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "17px",
    background: "linear-gradient(135deg, #A38560, #e2c180)",
    color: "#2b1114",
    fontWeight: "900",
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    borderRadius: "17px",
    border: "1px solid rgba(80,36,42,0.18)",
    background: "#fff",
    color: "#50242A",
    fontWeight: "900",
    cursor: "pointer",
  },
  success: {
    color: "#128c56",
    fontWeight: "900",
    textAlign: "center",
  },
  error: {
    color: "#c0394a",
    fontWeight: "900",
    textAlign: "center",
  },
  link: {
    display: "block",
    marginTop: "18px",
    textAlign: "center",
    color: "#50242A",
    fontWeight: "900",
    textDecoration: "none",
  },
};
