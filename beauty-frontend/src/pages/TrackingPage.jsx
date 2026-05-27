import API_BASE from "../services/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaClock,
  FaMagnifyingGlass,
  FaMapLocationDot,
  FaReceipt,
  FaTruckFast,
  FaCircleCheck,
  FaCreditCard,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function TrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const countdown = useMemo(() => {
    if (!order?.created_at) return "24h window active";

    const created = new Date(order.created_at).getTime();
    const deadline = created + 24 * 60 * 60 * 1000;
    const diff = deadline - Date.now();

    if (diff <= 0) return "Delivery window reached";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${mins}m remaining`;
  }, [order]);

  const handleTrackWithValue = async (value) => {
    setError("");
    setOrder(null);

    if (!value.trim()) {
      setError("Please enter your tracking number or payment reference.");
      return;
    }

    setLoading(true);

    try {
      const search = value.trim();

      const res = await fetch(
        `${API_BASE}/track-order?tracking_number=${encodeURIComponent(search)}&reference=${encodeURIComponent(search)}`
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Order not found.");
        return;
      }

      setOrder(data);
    } catch (err) {
      console.error("TRACKING ERROR:", err);
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      setQuery(ref);
      handleTrackWithValue(ref);
    }
  }, []);

  const handleTrack = async () => {
    await handleTrackWithValue(query);
  };

  const status = order?.delivery_status || order?.status || "Processing";
  const timelineSteps = getTimelineSteps(order);

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="tracking-page">
        <button className="back-btn" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Shop
        </button>

        <section className="hero">
          <p>ZURI DELIVERY</p>
          <h1>Track Your Order</h1>
          <span>Use your tracking number or payment reference to follow your delivery.</span>
        </section>

        <section className="track-card">
          <div className="search-row">
            <div className="input-wrap">
              <FaMagnifyingGlass />
              <input
                placeholder="Example: TRK-00001 or ZE_reference"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <button onClick={handleTrack} disabled={loading}>
              {loading ? "Tracking..." : "Track Order"}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </section>

        {order && (
          <section className="result-grid">
            <div className="status-card">
              <div className="status-top">
                <div>
                  <p>DELIVERY STATUS</p>
                  <h2>{status}</h2>
                </div>

                <div className="timer">
                  <FaClock />
                  <span>{countdown}</span>
                </div>
              </div>

              <div className="timeline">
                {timelineSteps.map((step) => (
                  <Step key={step.title} {...step} />
                ))}
              </div>
            </div>

            <aside className="details-card">
              <h3>Order Details</h3>

              <Info icon={<FaReceipt />} label="Reference" value={order.reference || "N/A"} />
              <Info icon={<FaTruckFast />} label="Tracking Number" value={order.tracking_number || "Pending"} />
              <Info icon={<FaMapLocationDot />} label="Delivery Address" value={order.delivery_address || "No address"} />

              <div className="total">
                <span>Total</span>
                <strong>R {Number(order.total || 0).toFixed(2)}</strong>
              </div>

              {order.items?.length > 0 && (
                <div className="items">
                  <h4>Items</h4>

                  {order.items.map((item, index) => (
                    <div className="item" key={index}>
                      <div className="item-img">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          <FaBoxOpen />
                        )}
                      </div>

                      <span>{item.name} × {item.quantity}</span>

                      <strong>R {Number(item.price || 0).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </section>
        )}
      </main>
    </>
  );
}

function Step({ icon, title, active, current }) {
  return (
    <div
      className={
        current
          ? "step active current"
          : active
            ? "step active"
            : "step"
      }
    >
      <div>{icon}</div>
      <span>{title}</span>
    </div>
  );
}

function normalizeStatus(value = "") {
  return String(value).trim().toLowerCase();
}

function getTimelineSteps(order) {
  const paymentStatus = normalizeStatus(order?.status);
  const deliveryStatus = normalizeStatus(order?.delivery_status);

  const currentIndex =
    deliveryStatus === "delivered"
      ? 4
      : deliveryStatus === "out for delivery"
        ? 3
        : deliveryStatus === "packed"
          ? 2
          : deliveryStatus === "processing"
            ? 1
            : paymentStatus === "paid"
              ? 0
              : -1;

  return [
    {
      icon: <FaCreditCard />,
      title: "Paid",
    },
    {
      icon: <FaClock />,
      title: "Processing",
    },
    {
      icon: <FaBoxOpen />,
      title: "Packed",
    },
    {
      icon: <FaTruckFast />,
      title: "Out for delivery",
    },
    {
      icon: <FaCircleCheck />,
      title: "Delivered",
    },
  ].map((step, index) => ({
    ...step,
    active: currentIndex >= index,
    current: currentIndex === index,
  }));
}

function Info({ icon, label, value }) {
  return (
    <div className="info-row">
      <div className="info-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <p>{value}</p>
      </div>
    </div>
  );
}

const css = `
.tracking-page {
  min-height: 100vh;
  padding: 110px 20px 42px;
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
  background: ${WINE};
  color: #fff;
  padding: 13px 17px;
  border-radius: 15px;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
}

.hero {
  padding: 38px;
  border-radius: 32px;
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: #fff;
  box-shadow: 0 24px 60px rgba(80,36,42,.25);
  margin-bottom: 22px;
}

.hero p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.hero h1 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 44px;
}

.hero span {
  color: rgba(255,255,255,.75);
  font-weight: 700;
}

.track-card,
.status-card,
.details-card {
  background: rgba(255,255,255,.88);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 42px rgba(80,36,42,.12);
  border: 1px solid rgba(80,36,42,.08);
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f4ee;
  border: 1px solid #eadfd6;
  border-radius: 16px;
  padding: 0 14px;
  color: ${GOLD};
}

.input-wrap input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 15px 0;
  font-weight: 800;
}

.search-row button {
  border: none;
  border-radius: 16px;
  background: ${WINE};
  color: #fff;
  padding: 0 22px;
  font-weight: 900;
  cursor: pointer;
}

.error {
  margin-top: 14px;
  color: #c0394a;
  font-weight: 900;
}

.result-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 22px;
  align-items: start;
}

.status-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.status-top p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.status-top h2 {
  margin: 8px 0 0;
  font-family: Georgia, serif;
  font-size: 34px;
  color: #2b2023;
}

.timer {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 16px;
  border-radius: 999px;
  background: #f8f4ee;
  color: ${WINE};
  font-weight: 900;
}

.timeline {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.step {
  text-align: center;
  padding: 22px 12px;
  border-radius: 22px;
  background: #f8f4ee;
  color: #999;
  font-weight: 900;
  opacity: .55;
}

.step div {
  font-size: 28px;
  margin-bottom: 10px;
}

.step.active {
  opacity: 1;
  color: ${WINE};
  background: linear-gradient(135deg, rgba(163,133,96,.24), rgba(255,255,255,.9));
  box-shadow: inset 0 0 0 1px rgba(163,133,96,.22);
}

.step.current {
  outline: 3px solid rgba(163,133,96,.28);
  transform: translateY(-3px);
}

.details-card h3 {
  margin-top: 0;
  font-family: Georgia, serif;
  font-size: 28px;
  color: #2b2023;
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid #eee;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: ${WINE};
  color: ${GOLD};
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.info-row small {
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 1px;
}

.info-row p {
  margin: 4px 0 0;
  color: #2b2023;
  font-weight: 800;
}

.total {
  display: flex;
  justify-content: space-between;
  padding: 18px 0;
  color: ${WINE};
  font-size: 20px;
  font-weight: 900;
}

.items h4 {
  color: #2b2023;
}

.item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  color: #6e6265;
  border-top: 1px solid #eee;
}

.item-img {
  width: 56px;
  height: 56px;
  border-radius: 14px;
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

@media (max-width: 900px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .search-row button {
    padding: 15px;
  }

  .timeline {
    grid-template-columns: 1fr;
  }
}
`;
