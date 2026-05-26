
import {
  FaBars,
  FaHome,
  FaHeart,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

export default function Navbar({
  toggleSidebar,
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search products...",
}) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const showSearch = typeof onSearchChange === "function";

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button
          className="menu-icon"
          onClick={toggleSidebar}
          title="Menu"
        >
          <FaBars />
        </button>

        <h1
          className="logo"
          onClick={() => navigate("/products")}
        >
          Zuri Elegance
        </h1>
      </div>

      {showSearch && (
        <div className="topbar-search">
          <FaSearch />
          <input
            type="search"
            value={searchValue || ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search products"
          />
          {searchValue && (
            <button
              type="button"
              onClick={onSearchClear}
              title="Clear search"
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      <div className="nav-right">

        <button
          className="nav-action home"
          onClick={() => navigate("/products")}
          title="Home"
        >
          <FaHome />
        </button>

        <button
          className="nav-action wishlist"
          onClick={() => navigate("/wishlist")}
          title="Wishlist"
        >
          <FaHeart />
        </button>

        <button
          className="nav-action cart"
          onClick={() => navigate("/cart")}
          title="Cart"
        >
          <FaShoppingCart />

          {cartCount > 0 && (
            <span className="cart-badge">
              {cartCount}
            </span>
          )}
        </button>

        <NotificationBell />

        <button
          className="nav-action profile"
          onClick={() => navigate("/profile")}
          title="Profile"
        >
          <FaUser />
        </button>
      </div>
    </nav>
  );
}
