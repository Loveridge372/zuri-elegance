
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { getUserId } from "../utils/auth";

import {
  FaArrowLeft,
  FaBox,
  FaTruck,
  FaCircleCheck,
  FaClock,
  FaRotate,
  FaTag,
} from "react-icons/fa6";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL;

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function OrdersPage() {
  const navigate = useNavigate();

  const userId = getUserId();

  const [orders, setOrders] =
    useState([]);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/orders/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((err) => {
        console.error(
          "ORDERS ERROR:",
          err
        );

        setError(
          "Could not load your orders."
        );
      })
      .finally(() =>
        setLoading(false)
      );
  }, [userId, navigate]);

  const getStatusIcon = (
    status
  ) => {
    if (status === "Delivered")
      return <FaCircleCheck />;

    if (
      status ===
      "Out for delivery"
    )
      return <FaTruck />;

    return <FaClock />;
  };

  const handleReorder = (
    order
  ) => {
    if (
      !order.items ||
      order.items.length === 0
    ) {
      alert(
        "This order has no items to reorder."
      );

      return;
    }

    localStorage.setItem(
      "reorder_items",
      JSON.stringify(order.items)
    );

    navigate("/products");
  };

  return (
    <>
      <style>{styles}</style>

      <Navbar
        toggleSidebar={() =>
          setSidebarOpen(true)
        }
      />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() =>
          setSidebarOpen(false)
        }
        navigate={navigate}
      />

      <main className="orders-page">
        <button
          className="back-btn"
          onClick={() =>
            navigate("/products")
          }
        >
          <FaArrowLeft />
          Back to Shop
        </button>

        <section className="hero">
          <p>ZURI ORDERS</p>

          <h1>My Orders</h1>

          <span>
            Track, review and manage
            your purchases
          </span>
        </section>

        {loading ? (
          <div className="empty">
            <FaClock size={34} />

            <p>
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <div className="empty">
            <FaBox size={40} />

            <p>{error}</p>

            <button
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <FaBox size={40} />

            <p>No orders yet</p>

            <button
              onClick={() =>
                navigate("/products")
              }
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <article
                className="order-card"
                key={order.id}
              >
                <div className="top">
                  <div>
                    <p>
                      ORDER #
                      {order.id}
                    </p>

                    <h3>
                      R{" "}
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </h3>
                  </div>

                  <div className="status">
                    {getStatusIcon(
                      order.delivery_status
                    )}

                    <span>
                      {order.delivery_status ||
                        "Processing"}
                    </span>
                  </div>
                </div>

                {order.items?.length >
                  0 && (
                  <div className="order-items">
                    {order.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="order-item"
                          key={`${order.id}-${index}`}
                        >
                          <div className="item-image">
                            {item.image_url ? (
                              <img
                                src={
                                  item.image_url
                                }
                                alt={
                                  item.name
                                }
                              />
                            ) : (
                              <FaBox />
                            )}
                          </div>

                          <div className="item-info">
                            <strong>
                              {item.name}
                            </strong>

                            <small>
                              Qty:{" "}
                              {item.quantity}
                            </small>
                          </div>

                          <b>
                            R{" "}
                            {Number(
                              item.price ||
                                0
                            ).toFixed(
                              2
                            )}
                          </b>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="info">
                  <div>
                    <small>
                      Date
                    </small>

                    <p>
                      {order.created_at
                        ? new Date(
                            order.created_at
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <small>
                      Reference
                    </small>

                    <p>
                      {order.reference ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <small>
                      Tracking
                    </small>

                    <p>
                      {order.tracking_number ||
                        "Pending"}
                    </p>
                  </div>

                  {order.coupon_code && (
                    <div>
                      <small>
                        Coupon Used
                      </small>

                      <p>
                        <FaTag />{" "}
                        {
                          order.coupon_code
                        }
                      </p>
                    </div>
                  )}

                  {Number(
                    order.discount_amount ||
                      0
                  ) > 0 && (
                    <div>
                      <small>
                        You Saved
                      </small>

                      <p>
                        R{" "}
                        {Number(
                          order.discount_amount
                        ).toFixed(
                          2
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button
                    onClick={() =>
                      navigate(
                        `/orders/${order.id}`
                      )
                    }
                  >
                    View Details
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      navigate(
                        `/tracking?ref=${order.reference}`
                      )
                    }
                  >
                    Track Order
                  </button>

                  <button
                    className="reorder-btn"
                    onClick={() =>
                      handleReorder(
                        order
                      )
                    }
                  >
                    <FaRotate />
                    Reorder
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

const styles = `
.orders-page {
  padding: 110px 20px;
  background:
    radial-gradient(circle at top left, rgba(7,51,44,0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(163,133,96,0.18), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
  min-height: 100vh;
}

.back-btn {
  background: ${EMERALD};
  color: #fff;
  border: 1px solid rgba(247,231,206,.16);
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
  box-shadow: 0 14px 30px rgba(7,51,44,.12);
}

.hero {
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.34), transparent 36%),
    radial-gradient(circle at bottom right, rgba(255,255,255,.09), transparent 34%),
    linear-gradient(135deg, ${EMERALD}, ${WINE}, #1f0f12);
  color: #fff;
  padding: 32px;
  border-radius: 28px;
  margin-bottom: 20px;
  box-shadow: 0 28px 70px rgba(7,51,44,0.24);
  border: 1px solid rgba(247,231,206,.16);
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
  color: rgba(255,255,255,0.78);
  font-weight: 700;
}

.orders-grid {
  display: grid;
  gap: 18px;
}

.order-card {
  background:
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,244,238,.92));
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 18px 42px rgba(7,51,44,0.10);
  border: 1px solid rgba(7,51,44,0.14);
  position: relative;
  overflow: hidden;
}

.order-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: linear-gradient(180deg, ${EMERALD}, ${GOLD}, ${WINE});
  pointer-events: none;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.top p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 1.5px;
}

.top h3 {
  margin: 6px 0 0;
  color: ${WINE};
  font-size: 26px;
  font-family: Georgia, serif;
}

.status {
  display: flex;
  gap: 8px;
  align-items: center;
  color: ${WINE};
  background: rgba(7,51,44,.07);
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 900;
  border: 1px solid rgba(7,51,44,.12);
}

.order-items {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

.order-item {
  display: grid;
  grid-template-columns: 62px 1fr auto;
  gap: 12px;
  align-items: center;
  background: rgba(7,51,44,.06);
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(7,51,44,.08);
}

.item-image {
  width: 62px;
  height: 62px;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, ${EMERALD}, ${WINE});
  color: ${GOLD};
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info strong {
  display: block;
  color: #2b2023;
}

.item-info small {
  color: #777;
  font-weight: 800;
}

.order-item b {
  color: ${EMERALD};
}

.info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 18px 0;
  gap: 12px;
}

.info small {
  color: ${GOLD};
  font-weight: 900;
}

.info p {
  margin: 6px 0 0;
  word-break: break-word;
  color: #2b2023;
  font-weight: 700;
}

.actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.actions button {
  padding: 13px;
  border-radius: 14px;
  border: none;
  font-weight: 900;
  cursor: pointer;
  background: linear-gradient(135deg, ${EMERALD}, ${WINE});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.actions .secondary {
  background: ${GOLD};
  color: #2b1114;
}

.actions .invoice-btn {
  background: #fff;
  color: ${EMERALD};
  border: 1px solid rgba(7,51,44,0.18);
}

.actions .reorder-btn {
  background: linear-gradient(135deg, ${GOLD}, #D6B37A);
  color: #2b1114;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
  color: ${EMERALD};
  font-weight: 900;
  box-shadow: 0 18px 42px rgba(7,51,44,0.10);
  border: 1px solid rgba(7,51,44,.14);
}

.empty button {
  margin-top: 12px;
  padding: 12px 20px;
  background: ${EMERALD};
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 900px) {
  .actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .orders-page {
    padding: 95px 14px 34px;
  }

  .hero {
    padding: 26px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .info {
    grid-template-columns: 1fr;
  }

  .top {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    grid-template-columns: 1fr;
  }

  .order-item {
    grid-template-columns: 56px 1fr;
  }

  .order-item b {
    grid-column: 2;
  }
}
`;
