import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaChartLine,
  FaHeart,
  FaLocationDot,
  FaPalette,
  FaPhone,
  FaReceipt,
  FaCartShopping,
  FaTags,
  FaTruckFast,
  FaUserGroup,
} from "react-icons/fa6";

const GOLD = "#A38560";

export default function Sidebar({
  isOpen,
  toggleSidebar,
  brands = [],
  activeBrand = "All",
  onBrandSelect,
}) {
  const hasBrands = brands.length > 1 && onBrandSelect;

  return (
    <>
      <div
        style={{
          ...styles.overlay,
          display: isOpen ? "block" : "none",
        }}
        onClick={toggleSidebar}
      />

      <aside
        style={{
          ...styles.sidebar,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={toggleSidebar}>
          ✕
        </button>

        {/* Brand */}
        <h2 style={styles.brand}>ZURI ELEGANCE</h2>

        {/* Menu */}
        <nav style={styles.nav}>
          <Link to="/products" style={styles.link}><FaBoxOpen /> Products</Link>
          <Link to="/brands" style={styles.link}><FaTags /> Brands</Link>
          <Link to="/beauty-analysis" style={styles.featuredLink}><FaPalette /> AI Beauty Match</Link>
          <Link to="/beauty-dashboard" style={styles.link}><FaChartLine /> AI Beauty Dashboard</Link>
          <Link to="/wishlist" style={styles.link}><FaHeart /> Wishlist</Link>
          <Link to="/cart" style={styles.link}><FaCartShopping /> Cart</Link>
          <Link to="/orders" style={styles.link}><FaReceipt /> Orders</Link>
          <Link to="/tracking" style={styles.link}><FaLocationDot /> Track Order</Link>
          <Link to="/delivery" style={styles.link}><FaTruckFast /> Delivery</Link>
          <Link to="/about" style={styles.link}><FaUserGroup /> About</Link>
          <Link to="/contact" style={styles.link}><FaPhone /> Contact</Link>
        </nav>

        {hasBrands && (
          <section style={styles.brandSection}>
            <p style={styles.sectionTitle}>BRANDS</p>

            <div style={styles.brandList}>
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  style={{
                    ...styles.brandBtn,
                    ...(activeBrand === brand ? styles.brandBtnActive : {}),
                  }}
                  onClick={() => {
                    onBrandSelect(brand);
                    toggleSidebar();
                  }}
                >
                  {brand}
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(6px)",
    zIndex: 999,
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "280px",
    height: "100vh",
    padding: "24px",
    zIndex: 1000,

    /* GLASS EFFECT */
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",

    borderRight: "1px solid rgba(255,255,255,0.15)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",

    transition: "transform 0.35s ease",
  },

  closeBtn: {
    position: "absolute",
    top: "18px",
    right: "18px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: "10px",
    padding: "6px 10px",
    cursor: "pointer",
  },

  brand: {
    marginTop: "10px",
    marginBottom: "30px",
    fontSize: "18px",
    fontWeight: "900",
    letterSpacing: "2px",
    color: GOLD, // 👈 GOLD BRAND
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  link: {
    padding: "12px 14px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#fff",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",

    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",

    transition: "all 0.25s ease",
  },

  featuredLink: {
    padding: "13px 14px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#2b1114",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: `linear-gradient(135deg, ${GOLD}, #F7E7CE)`,
    border: "1px solid rgba(247,231,206,0.72)",
    boxShadow: "0 14px 28px rgba(163,133,96,0.22)",
    transition: "all 0.25s ease",
  },

  brandSection: {
    marginTop: "24px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(255,255,255,0.14)",
  },

  sectionTitle: {
    margin: "0 0 10px",
    color: GOLD,
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.8px",
  },

  brandList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  brandBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: "800",
    textAlign: "left",
    cursor: "pointer",
  },

  brandBtnActive: {
    background: `linear-gradient(135deg, ${GOLD}, #F7E7CE)`,
    border: "1px solid rgba(247,231,206,0.72)",
    color: "#2b1114",
  },
};

/* Hover effect injected globally */
if (typeof document !== "undefined" && !document.getElementById("sidebar-glass")) {
  const style = document.createElement("style");
  style.id = "sidebar-glass";
  style.innerHTML = `
    a:hover {
      background: rgba(163,133,96,0.25) !important;
      border-color: rgba(163,133,96,0.5) !important;
      transform: translateX(6px);
    }
  `;
  document.head.appendChild(style);
}
