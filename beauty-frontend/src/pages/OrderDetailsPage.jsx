
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getUserId } from "../utils/auth";
import {
  FaArrowLeft,
  FaTruck,
  FaCircleCheck,
  FaClock,
  FaBox,
  FaTriangleExclamation,
  FaFileInvoice,
} from "react-icons/fa6";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WINE = "#50242A";
const GOLD = "#A38560";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [order, setOrder] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/orders/details/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }
        setOrder(data);
      })
      .catch((err) => {
        console.error("ORDER DETAILS ERROR:", err);
        setError("Could not load order details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReorder = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    for (const item of order.items || []) {
      await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: item.product_id,
          quantity: item.quantity,
        }),
      });
    }

    navigate("/cart");
  };

  const downloadInvoice = () => {
    if (!order?.id) return;
    window.open(`${API_BASE}/orders/${order.id}/invoice`, "_blank");
  };

  const getStatusIcon = () => {
    if (order?.delivery_status === "Delivered") return <FaCircleCheck />;
    if (order?.delivery_status === "Out for delivery") return <FaTruck />;
    return <FaClock />;
  };

  return (
    <>
      <style>{styles}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="details-page">
        <button className="back-btn" onClick={() => navigate("/orders")}>
          <FaArrowLeft /> Back to Orders
        </button>

        {loading ? (
          <section className="state-card">
            <FaClock />
            <h2>Loading order...</h2>
            <p>Please wait while we fetch your order details.</p>
          </section>
        ) : error ? (
          <section className="state-card">
            <FaTriangleExclamation />
            <h2>Order Issue</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/orders")}>Back to Orders</button>
          </section>
        ) : (
          <>
            <section className="hero">
              <p>ORDER DETAILS</p>
              <h1>Order #{order.id}</h1>
              <span>{order.status || "Pending Payment"}</span>
            </section>

            <div className="grid">
              <div className="card">
                <h3>Delivery</h3>

                <div className="status">
                  {getStatusIcon()}
                  <span>{order.delivery_status || "Processing"}</span>
                </div>

                <p><strong>Reference:</strong> {order.reference || "N/A"}</p>
                <p><strong>Tracking:</strong> {order.tracking_number || "Pending"}</p>
                <p><strong>Address:</strong> {order.delivery_address || "No delivery address saved"}</p>

                <button className="invoice-btn" onClick={downloadInvoice}>
                  <FaFileInvoice /> Download Invoice
                </button>
              </div>

              <div className="card">
                <h3>Items</h3>

                {(order.items || []).length > 0 ? (
                  (order.items || []).map((item, i) => (
                    <div className="item" key={i}>
                      <div className="item-img">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          <FaBox />
                        )}
                      </div>

                      <div>
                        <p>{item.name}</p>
                        <small>Qty: {item.quantity}</small>
                      </div>

                      <strong>R {Number(item.price || 0).toFixed(2)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="no-items">No items found for this order.</div>
                )}

                <div className="total">
                  Total: R {Number(order.total || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="actions">
              <button onClick={() => navigate(`/tracking?ref=${order.reference}`)}>
                Track Order
              </button>

              <button className="secondary" onClick={handleReorder}>
                Reorder Items
              </button>

              <button className="invoice-action" onClick={downloadInvoice}>
                <FaFileInvoice /> Invoice
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

const styles = `
.details-page {
  padding: 110px 20px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,0.18), transparent 34%),
    #f8f4ee;
  min-height: 100vh;
}

.back-btn {
  background: ${WINE};
  color: #fff;
  border: none;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
}

.hero {
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: white;
  padding: 32px;
  border-radius: 28px;
  margin-bottom: 20px;
  box-shadow: 0 22px 55px rgba(80,36,42,0.22);
}

.hero p {
  color: ${GOLD};
  font-weight: 900;
  font-size: 12px;
  margin: 0;
  letter-spacing: 2px;
}

.hero h1 {
  margin: 8px 0;
  font-size: 40px;
  font-family: Georgia, serif;
}

.hero span {
  color: rgba(255,255,255,0.8);
  font-weight: 800;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card,
.state-card {
  background: rgba(255,255,255,0.92);
  padding: 22px;
  border-radius: 24px;
  box-shadow: 0 14px 36px rgba(80,36,42,0.10);
  border: 1px solid rgba(80,36,42,0.08);
}

.state-card {
  text-align: center;
  color: ${WINE};
  padding: 60px 20px;
}

.state-card svg {
  color: ${GOLD};
  font-size: 38px;
}

.state-card h2 {
  margin: 14px 0 8px;
  font-family: Georgia, serif;
}

.state-card p {
  color: #75686a;
  font-weight: 700;
}

.state-card button {
  margin-top: 14px;
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.card h3 {
  color: ${WINE};
  margin-top: 0;
  font-family: Georgia, serif;
  font-size: 25px;
}

.card p {
  color: #2b2023;
  line-height: 1.6;
}

.card strong {
  color: ${WINE};
}

.status {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 900;
  color: ${WINE};
  background: #f8f4ee;
  padding: 10px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.invoice-btn {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 14px;
  padding: 13px;
  background: ${GOLD};
  color: #2b1114;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.item {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.item-img {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: ${WINE};
  color: ${GOLD};
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item p {
  margin: 0;
  font-weight: 900;
  color: #2b2023;
}

.item small {
  color: #777;
  font-weight: 800;
}

.item strong {
  color: ${WINE};
}

.no-items {
  padding: 16px;
  border-radius: 18px;
  background: #f8f4ee;
  color: ${WINE};
  font-weight: 900;
}

.total {
  margin-top: 14px;
  font-weight: 900;
  color: ${WINE};
  font-size: 18px;
  text-align: right;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.actions button {
  flex: 1;
  padding: 13px;
  border-radius: 14px;
  border: none;
  background: ${WINE};
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.actions .secondary {
  background: ${GOLD};
  color: #2b1114;
}

.actions .invoice-action {
  background: #eee;
  color: #2b2023;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 800px) {
  .details-page {
    padding: 95px 14px 34px;
  }

  .hero {
    padding: 26px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .item {
    grid-template-columns: 56px 1fr;
  }

  .item strong {
    grid-column: 2;
  }
}
`;