import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaFloppyDisk,
  FaUserShield,
} from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const WINE = "#50242A";
const GOLD = "#A38560";

export default function AdminSettingsPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    new_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE}/admin/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          address: data.address || "",
          new_password: "",
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("SETTINGS LOAD ERROR:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Update failed.");
        return;
      }

      setMessage("Admin settings updated successfully ✨");

      setForm((prev) => ({
        ...prev,
        new_password: "",
      }));
    } catch (err) {
      console.error("SAVE SETTINGS ERROR:", err);
      setMessage("Could not connect to server.");
    }
  };

  if (loading) {
    return (
      <main className="settings-page">
        <style>{css}</style>
        <div className="loading">Loading settings...</div>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <style>{css}</style>

      <button className="back-btn" onClick={() => navigate("/admin")}>
        <FaArrowLeft />
        Back to Dashboard
      </button>

      <section className="hero">
        <div>
          <p>ZURI ADMIN</p>
          <h1>Admin Settings</h1>
          <span>
            Manage your administrator profile and login credentials.
          </span>
        </div>

        <div className="hero-icon">
          <FaUserShield />
        </div>
      </section>

      <form className="settings-card" onSubmit={saveSettings}>
        <div className="grid">
          <input
            name="full_name"
            placeholder="Full name"
            value={form.full_name}
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="grid">
          <input
            name="phone"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
          />
        </div>

        <textarea
          name="address"
          placeholder="Business address"
          value={form.address}
          onChange={handleChange}
        />

        <input
          name="new_password"
          type="password"
          placeholder="New password (optional)"
          value={form.new_password}
          onChange={handleChange}
        />

        {message && <div className="message">{message}</div>}

        <button className="save-btn" type="submit">
          <FaFloppyDisk />
          Save Settings
        </button>
      </form>
    </main>
  );
}

const css = `
.settings-page {
  min-height: 100vh;
  padding: 34px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    #f8f4ee;
  font-family: Inter, Arial, sans-serif;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 16px;
  padding: 13px 18px;
  background: ${WINE};
  color: white;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 38px;
  border-radius: 34px;
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: white;
  box-shadow: 0 24px 60px rgba(80,36,42,.25);
}

.hero p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
}

.hero h1 {
  margin: 8px 0;
  font-size: 46px;
  font-family: Georgia, serif;
}

.hero span {
  color: rgba(255,255,255,.75);
  font-weight: 700;
}

.hero-icon {
  width: 90px;
  height: 90px;
  border-radius: 26px;
  background: rgba(255,255,255,.12);
  display: grid;
  place-items: center;
  font-size: 34px;
  color: ${GOLD};
}

.settings-card {
  margin-top: 24px;
  background: rgba(255,255,255,.92);
  border-radius: 30px;
  padding: 28px;
  box-shadow: 0 18px 42px rgba(80,36,42,.11);
  display: grid;
  gap: 18px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.settings-card input,
.settings-card textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #eadfd6;
  border-radius: 18px;
  padding: 16px;
  background: #f8f4ee;
  outline: none;
  font-weight: 800;
  color: #2b2023;
}

.settings-card textarea {
  min-height: 120px;
  resize: vertical;
}

.save-btn {
  border: none;
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  color: white;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.message {
  padding: 14px;
  border-radius: 16px;
  background: rgba(18,140,86,.10);
  color: #128c56;
  font-weight: 900;
}

.loading {
  font-weight: 900;
  color: ${WINE};
}

@media (max-width: 700px) {
  .settings-page {
    padding: 18px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 28px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
`;
