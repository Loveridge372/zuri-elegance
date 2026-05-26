import { FaMinus, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const WINE = "#50242A";
const GOLD = "#A38560";

export default function CartDrawer({ open, onClose, cart, setCart, navigate }) {
  if (!open) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const updateQty = async (item, quantity) => {
    if (quantity < 1) return;

    await fetch(`${API_BASE}/cart/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity }),
    });

    setCart((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, quantity } : x))
    );
  };

  const removeItem = async (itemId) => {
    await fetch(`${API_BASE}/cart/remove/${itemId}`, {
      method: "DELETE",
    });

    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <aside style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <button style={styles.close} onClick={onClose}>
          <FaXmark />
        </button>

        <p style={styles.kicker}>ZURI BAG</p>
        <h2 style={styles.title}>Your Cart</h2>

        {cart.length === 0 ? (
          <div style={styles.empty}>Your cart is empty.</div>
        ) : (
          <div style={styles.items}>
            {cart.map((item) => (
              <div style={styles.item} key={item.id}>
                <div style={styles.imageBox}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={styles.image} />
                  ) : (
                    <span>ZE</span>
                  )}
                </div>

                <div style={styles.info}>
                  <strong>{item.name}</strong>
                  <small>R {Number(item.price || 0).toFixed(2)}</small>

                  <div style={styles.qty}>
                    <button onClick={() => updateQty(item, item.quantity - 1)}>
                      <FaMinus />
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => updateQty(item, item.quantity + 1)}>
                      <FaPlus />
                    </button>

                    <button style={styles.trash} onClick={() => removeItem(item.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.total}>
            <span>Subtotal</span>
            <strong>R {subtotal.toFixed(2)}</strong>
          </div>

          <button
            style={styles.checkout}
            onClick={() => {
              onClose();
              navigate("/checkout");
            }}
          >
            Checkout
          </button>

          <button style={styles.shop} onClick={onClose}>
            Continue Shopping
          </button>
        </div>
      </aside>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 6000,
    display: "flex",
    justifyContent: "flex-end",
  },

  drawer: {
    width: "min(420px, 92vw)",
    height: "100vh",
    background: "#fffaf7",
    padding: "24px",
    boxShadow: "-20px 0 60px rgba(0,0,0,0.22)",
    position: "relative",
    overflowY: "auto",
  },

  close: {
    position: "absolute",
    top: "18px",
    right: "18px",
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "none",
    background: "#fff",
    color: WINE,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
  },

  kicker: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "2px",
    fontSize: "12px",
  },

  title: {
    margin: "8px 0 22px",
    fontFamily: "Georgia, serif",
    fontSize: "34px",
    color: "#2b2023",
  },

  empty: {
    background: "#f8f4ee",
    padding: "24px",
    borderRadius: "20px",
    color: WINE,
    fontWeight: "900",
  },

  items: {
    display: "grid",
    gap: "14px",
    paddingBottom: "190px",
  },

  item: {
    display: "grid",
    gridTemplateColumns: "82px 1fr",
    gap: "14px",
    background: "#fff",
    padding: "12px",
    borderRadius: "20px",
    boxShadow: "0 10px 24px rgba(80,36,42,0.08)",
  },

  imageBox: {
    width: "82px",
    height: "82px",
    borderRadius: "16px",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: GOLD,
    fontWeight: "900",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  info: {
    display: "grid",
    gap: "6px",
  },

  qty: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  trash: {
    marginLeft: "auto",
    color: "#c0394a",
  },

  total: {
    display: "flex",
    justifyContent: "space-between",
    color: WINE,
    fontWeight: "900",
    fontSize: "19px",
    marginBottom: "12px",
  },

  footer: {
    position: "fixed",
    bottom: 0,
    right: 0,
    width: "min(420px, 92vw)",
    background: "#fffaf7",
    padding: "18px 24px",
    boxShadow: "0 -12px 30px rgba(0,0,0,0.08)",
  },

  checkout: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  shop: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "13px",
    marginTop: "10px",
    background: "#f8f4ee",
    color: WINE,
    fontWeight: "900",
    cursor: "pointer",
  },
};
