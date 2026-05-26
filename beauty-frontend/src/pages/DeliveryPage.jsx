import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTruckFast, FaLocationDot, FaClock, FaBoxOpen, FaArrowLeft } from "react-icons/fa6";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const GOLD = "#A38560";
const WINE = "#50242A";

export default function DeliveryPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main style={styles.page}>
        <button style={styles.backCard} onClick={() => navigate("/products")}>
          <span style={styles.backIcon}>
            <FaArrowLeft />
          </span>
          <span>
            <strong>Back to Shop</strong>
            <small>Continue browsing Zuri products</small>
          </span>
        </button>

        <section style={styles.hero}>
          <FaTruckFast size={38} color={GOLD} />
          <h1 style={styles.title}>24-Hour Delivery Promise</h1>
          <p style={styles.subtitle}>
            Fast, premium delivery across South Africa — starting with Cape Town & Johannesburg.
          </p>
        </section>

        <section style={styles.highlight}>
          🚀 <b>Same-day / Next-day delivery</b> available in Cape Town & Joburg
        </section>

        <section style={styles.grid}>
          <InfoCard
            icon={<FaClock />}
            title="Delivery Time"
            text="We aim to deliver within 24 hours in Cape Town and Johannesburg. Other regions may take 2–3 working days."
          />

          <InfoCard
            icon={<FaLocationDot />}
            title="Coverage"
            text="Cape Town and Joburg are our priority express delivery zones. Nationwide delivery is also available."
          />

          <InfoCard
            icon={<FaBoxOpen />}
            title="Tracking"
            text="Every order includes tracking so you can follow your package from dispatch to delivery."
          />
        </section>

        <section style={styles.cta}>
          <h2>Luxury Delivered Fast</h2>
          <p>Shop now and experience premium beauty with speed.</p>
          <button style={styles.shopBtn} onClick={() => navigate("/products")}>
            Shop Now
          </button>
        </section>
      </main>
    </>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

const styles = {
  page: {
    padding: "110px 20px 40px",
    background: "#f8f4ee",
    minHeight: "100vh",
  },

  backCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "22px",
    padding: "14px 18px",
    borderRadius: "18px",
    border: "1px solid rgba(163,133,96,0.45)",
    background: "linear-gradient(135deg, #fff, #f2e8dc)",
    color: WINE,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(80,36,42,0.14)",
  },

  backIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: WINE,
    color: "#fff",
    display: "grid",
    placeItems: "center",
  },

  hero: {
    textAlign: "center",
    padding: "58px 20px",
    borderRadius: "28px",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: "#fff",
    marginBottom: "26px",
    boxShadow: "0 22px 55px rgba(80,36,42,0.28)",
  },

  title: {
    fontSize: "38px",
    margin: "12px 0",
    fontWeight: "900",
  },

  subtitle: {
    maxWidth: "640px",
    margin: "0 auto",
    color: "#f1e6db",
  },

  highlight: {
    textAlign: "center",
    marginBottom: "28px",
    fontWeight: "900",
    color: WINE,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "34px",
  },

  card: {
    background: "rgba(255,255,255,0.82)",
    padding: "26px",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 14px 30px rgba(80,36,42,0.10)",
    border: "1px solid rgba(80,36,42,0.08)",
    backdropFilter: "blur(14px)",
  },

  cardIcon: {
    color: GOLD,
    fontSize: "24px",
    marginBottom: "8px",
  },

  cta: {
    textAlign: "center",
    padding: "42px",
    borderRadius: "28px",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: "#fff",
    boxShadow: "0 20px 46px rgba(80,36,42,0.25)",
  },

  shopBtn: {
    marginTop: "16px",
    padding: "13px 26px",
    borderRadius: "16px",
    border: "none",
    background: GOLD,
    color: "#2b1114",
    fontWeight: "900",
    cursor: "pointer",
  },
};
