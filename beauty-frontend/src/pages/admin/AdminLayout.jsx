import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaBoxOpen,
  FaBell,
  FaBrain,
  FaChartLine,
  FaComments,
  FaGift,
  FaRightFromBracket,
  FaShop,
  FaTags,
  FaTicket,
  FaTruckFast,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminLayout({ children, title = "Admin Panel" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const links = [
    { label: "Dashboard", path: "/admin", icon: <FaChartLine /> },
    { label: "Products", path: "/admin/products", icon: <FaBoxOpen /> },
    { label: "Brands", path: "/admin/brands", icon: <FaTags /> },
    { label: "Orders", path: "/admin/orders", icon: <FaTruckFast /> },
    { label: "Customers", path: "/admin/customers", icon: <FaUsers /> },
    { label: "Beauty AI", path: "/admin/beauty-intelligence", icon: <FaBrain /> },
    { label: "Reviews", path: "/admin/reviews", icon: <FaComments /> },
    { label: "Coupons", path: "/admin/coupons", icon: <FaTicket /> },
    { label: "Rewards", path: "/admin/rewards", icon: <FaGift /> },
    { label: "Notifications", path: "/admin/notifications", icon: <FaBell /> },
    { label: "Settings", path: "/admin/settings", icon: <FaXmark /> },
  ];

  return (
    <div className="admin-shell">
      <style>{css}</style>

      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-brand">
          <div className="brand-mark">ZE</div>
          <div>
            <strong>ZURI ELEGANCE</strong>
            <span>Admin Control</span>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <button
              key={link.path}
              className={location.pathname === link.path ? "active" : ""}
              onClick={() => {
                navigate(link.path);
                setOpen(false);
              }}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => navigate("/products")}>
            <FaShop /> View Store
          </button>

          <button className="logout" onClick={logout}>
            <FaRightFromBracket /> Logout
          </button>
        </div>
      </aside>

      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

      <section className="admin-main">
        <header className="admin-topbar">
          <button className="menu-btn" onClick={() => setOpen(true)}>
            <FaBars />
          </button>

          <div>
            <p>ADMIN DASHBOARD</p>
            <h2>{title}</h2>
          </div>

          <div className="admin-user">
            <strong>{user?.full_name || "Admin"}</strong>
            <span>{user?.email || "admin@zuri.com"}</span>
          </div>
        </header>

        {children}
      </section>
    </div>
  );
}

const css = `
.admin-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(7,51,44,.14), transparent 30%),
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
  font-family: Inter, Arial, sans-serif;
}

.admin-sidebar {
  position: fixed;
  inset: 18px auto 18px 18px;
  width: 280px;
  border-radius: 30px;
  padding: 22px;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.24), transparent 34%),
    linear-gradient(180deg, ${EMERALD}, ${WINE}, #1f0f12);
  color: #fff;
  z-index: 1000;
  box-shadow: 0 24px 70px rgba(80,36,42,.30);
  display: flex;
  flex-direction: column;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, ${GOLD}, #e2c180);
  color: #2b1114;
  font-weight: 900;
}

.admin-brand strong {
  display: block;
  font-size: 13px;
  letter-spacing: 1.4px;
}

.admin-brand span {
  color: rgba(255,255,255,.65);
  font-size: 12px;
}

.admin-sidebar nav {
  display: grid;
  gap: 10px;
}

.admin-sidebar button {
  width: 100%;
  border: none;
  cursor: pointer;
  border-radius: 18px;
  padding: 14px 15px;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.82);
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
}

.admin-sidebar button.active {
  background: linear-gradient(135deg, ${GOLD}, #e2c180);
  color: #2b1114;
  box-shadow: 0 12px 24px rgba(163,133,96,.24);
}

.sidebar-bottom {
  margin-top: auto;
  display: grid;
  gap: 10px;
}

.sidebar-bottom .logout {
  background: rgba(255,80,105,.16);
  color: #ffb4c1;
}

.admin-main {
  margin-left: 320px;
  padding: 18px 24px 34px;
}

.admin-topbar {
  min-height: 82px;
  margin-bottom: 20px;
  padding: 16px 20px;
  border-radius: 26px;
  background: rgba(255,255,255,.82);
  box-shadow: 0 16px 38px rgba(7,51,44,.10);
  border: 1px solid rgba(7,51,44,.10);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.admin-topbar p {
  margin: 0;
  color: ${GOLD};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.admin-topbar h2 {
  margin: 4px 0 0;
  color: #2b2023;
  font-family: Georgia, serif;
}

.menu-btn {
  display: none;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 15px;
  background: ${EMERALD};
  color: #fff;
}

.admin-user {
  text-align: right;
}

.admin-user strong,
.admin-user span {
  display: block;
}

.admin-user strong {
  color: ${WINE};
}

.admin-user span {
  color: #777;
  font-size: 12px;
  font-weight: 800;
}

.admin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.42);
  z-index: 900;
}

@media (max-width: 900px) {
  .admin-sidebar {
    transform: translateX(-120%);
    transition: .25s ease;
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .admin-main {
    margin-left: 0;
    padding: 14px;
  }

  .menu-btn {
    display: grid;
    place-items: center;
  }

  .admin-user {
    display: none;
  }
}
`;
