import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaBagShopping,
  FaCircleCheck,
  FaFileInvoice,
  FaReceipt,
  FaShieldHalved,
  FaTriangleExclamation,
  FaTruckFast,
} from "react-icons/fa6";
import Seo from "../components/Seo";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

function getStoredPaymentReference() {
  return (
    localStorage.getItem("zuri_pending_payment_reference") ||
    sessionStorage.getItem("zuri_pending_payment_reference")
  );
}

function getStoredUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || null;
  } catch {
    return null;
  }
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") ||
    searchParams.get("ref") ||
    searchParams.get("trxref") ||
    getStoredPaymentReference();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const findLatestOrder = async () => {
      const userId = getStoredUserId();

      if (!userId) {
        return null;
      }

      const res = await fetch(`${API_BASE}/orders/${userId}`);
      const orders = await res.json();

      if (!res.ok || !Array.isArray(orders)) {
        return null;
      }

      return (
        orders.find((item) => item.reference && item.status === "Paid") ||
        orders.find((item) => item.reference && item.status === "Pending Payment") ||
        orders.find((item) => item.reference) ||
        null
      );
    };

    const verifyPayment = async () => {
      const latestOrder = reference ? null : await findLatestOrder();

      if (latestOrder?.status === "Paid") {
        localStorage.removeItem("zuri_cart");
        localStorage.removeItem("zuri_pending_payment_reference");
        sessionStorage.removeItem("zuri_pending_payment_reference");
        setOrder(latestOrder);
        setLoading(false);
        return;
      }

      const paymentReference = reference || latestOrder?.reference || "";

      if (!paymentReference) {
        setError("Missing payment reference.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/paystack/verify-order-payment?reference=${paymentReference}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Payment verification failed.");
          return;
        }

        localStorage.removeItem("zuri_cart");
        localStorage.removeItem("zuri_pending_payment_reference");
        sessionStorage.removeItem("zuri_pending_payment_reference");
        setOrder(data.order || null);
      } catch (err) {
        console.error("PAYMENT VERIFY ERROR:", err);
        setError("Could not verify payment. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference]);

  const downloadInvoice = () => {
    if (!order?.id) {
      alert("Invoice is not ready yet.");
      return;
    }

    window.open(`${API_BASE}/orders/${order.id}/invoice`, "_blank");
  };

  const isReady = !loading && !error;

  return (
    <>
      <Seo
        title={isReady ? "Payment Successful | Zuri Elegance" : "Verifying Payment | Zuri Elegance"}
        description="Zuri Elegance secure payment confirmation and order tracking."
      />
      <style>{css}</style>
      <main className="success-page">
        <section className="success-shell">
          <div className="confirmation-panel">
            {loading ? (
              <>
                <div className="loader" />
                <p className="kicker">VERIFYING PAYMENT</p>
                <h1>Confirming Your Order</h1>
                <p className="message">Please wait while we securely confirm your Paystack payment.</p>
              </>
            ) : error ? (
              <>
                <FaTriangleExclamation className="error-icon" />
                <p className="kicker">PAYMENT CHECK</p>
                <h1>Verification Issue</h1>
                <p className="message">{error}</p>
                <div className="button-row">
                  <button onClick={() => navigate("/checkout")}>Back to Checkout</button>
                  <button className="secondary" onClick={() => navigate("/products")}>Continue Shopping</button>
                </div>
              </>
            ) : (
              <>
                <FaCircleCheck className="success-icon" />
                <p className="kicker">PAYMENT SUCCESSFUL</p>
                <h1>Order Confirmed</h1>
                <p className="message">
                  Thank you. Your Zuri Elegance order is confirmed and moving into processing.
                </p>

                <div className="timeline">
                  <div className="step active"><FaShieldHalved /><span>Paid</span></div>
                  <div className="line" />
                  <div className="step"><FaBagShopping /><span>Preparing</span></div>
                  <div className="line" />
                  <div className="step"><FaTruckFast /><span>Delivery</span></div>
                </div>

                <div className="button-row">
                  <button onClick={downloadInvoice}><FaFileInvoice /> Invoice</button>
                  <button onClick={() => navigate(`/tracking?ref=${order?.reference}`)}><FaTruckFast /> Track Order</button>
                </div>
                <div className="button-row">
                  <button className="secondary" onClick={() => navigate("/orders")}>My Orders</button>
                  <button className="light" onClick={() => navigate("/products")}>Continue Shopping</button>
                </div>
              </>
            )}
          </div>

          {isReady && (
            <aside className="order-panel">
              <div className="order-head">
                <FaReceipt />
                <div>
                  <p>ORDER SUMMARY</p>
                  <h2>#{order?.id || "Confirmed"}</h2>
                </div>
              </div>

              <div className="summary-grid">
                <Info label="Reference" value={order?.reference || reference || "Pending"} />
                <Info label="Tracking" value={order?.tracking_number || "Processing"} />
                <Info label="Status" value={order?.status || "Paid"} />
                <Info label="Total" value={`R ${Number(order?.total || 0).toFixed(2)}`} />
              </div>

              {order?.items?.length > 0 && (
                <div className="items">
                  <h3>Items</h3>
                  {order.items.map((item, index) => (
                    <div className="item" key={`${item.product_id || item.name}-${index}`}>
                      <div className="item-img">
                        {item.image_url ? <img src={item.image_url} alt={item.name} /> : <FaBagShopping />}
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <small>Qty {item.quantity}</small>
                      </div>
                      <b>R {Number(item.price || 0).toFixed(2)}</b>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}
        </section>
      </main>
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const css = `
.success-page {
  min-height: 100vh;
  padding: 32px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 16% 12%, rgba(163,133,96,.20), transparent 30%),
    radial-gradient(circle at 86% 8%, rgba(7,51,44,.16), transparent 28%),
    linear-gradient(180deg, #fbf7f1, #f3ece3);
  font-family: Inter, Arial, sans-serif;
}

.success-shell {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 410px;
  gap: 18px;
  align-items: stretch;
}

.confirmation-panel,
.order-panel {
  background: rgba(255,255,255,.95);
  border: 1px solid rgba(80,36,42,.10);
  border-radius: 26px;
  box-shadow: 0 24px 70px rgba(80,36,42,.14);
}

.confirmation-panel {
  min-height: 520px;
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.confirmation-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(80,36,42,.08), transparent 34%),
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%);
  pointer-events: none;
}

.confirmation-panel > * {
  position: relative;
  z-index: 1;
}

.order-panel {
  padding: 22px;
  align-self: start;
}

.success-icon,
.error-icon {
  width: 68px;
  height: 68px;
  padding: 17px;
  border-radius: 22px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.success-icon {
  color: #2b1114;
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  box-shadow: 0 18px 34px rgba(163,133,96,.26);
}

.error-icon {
  color: #fff;
  background: #c0394a;
}

.kicker,
.order-head p {
  margin: 0;
  color: ${GOLD};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 2px;
}

.confirmation-panel h1 {
  margin: 10px 0;
  color: ${WINE};
  font-family: Georgia, serif;
  font-size: clamp(38px, 6vw, 62px);
  line-height: .96;
}

.message {
  max-width: 620px;
  margin: 0 0 6px;
  color: #6f6264;
  font-weight: 800;
  line-height: 1.7;
}

.timeline {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
  gap: 10px;
  margin: 30px 0 22px;
}

.step {
  display: grid;
  place-items: center;
  gap: 8px;
  color: #7d6f72;
  font-size: 12px;
  font-weight: 900;
}

.step svg {
  width: 46px;
  height: 46px;
  padding: 13px;
  border-radius: 16px;
  background: #f8f4ee;
  color: ${WINE};
  box-sizing: border-box;
}

.step.active svg {
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  color: #2b1114;
}

.line {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(163,133,96,.58), #eadfd6);
}

.button-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

button {
  min-height: 50px;
  border: none;
  border-radius: 15px;
  padding: 14px 16px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  box-shadow: 0 12px 26px rgba(80,36,42,.16);
}

button.secondary {
  background: linear-gradient(135deg, ${GOLD}, #f7e7ce);
  color: #2b1114;
}

button.light {
  background: #f0e8df;
  color: #2b2023;
  box-shadow: none;
}

.order-head {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 18px;
}

.order-head > svg {
  width: 54px;
  height: 54px;
  padding: 14px;
  border-radius: 18px;
  background: ${EMERALD};
  color: ${GOLD};
  box-sizing: border-box;
}

.order-head h2 {
  margin: 4px 0 0;
  color: ${WINE};
  font-family: Georgia, serif;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.info {
  padding: 13px;
  border-radius: 15px;
  background: #f8f4ee;
  border: 1px solid rgba(80,36,42,.05);
}

.info span,
.info strong {
  display: block;
}

.info span {
  color: #75686a;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .7px;
}

.info strong {
  margin-top: 5px;
  color: ${WINE};
  font-size: 13px;
  word-break: break-word;
}

.items {
  margin-top: 18px;
}

.items h3 {
  margin: 0 0 10px;
  color: ${WINE};
  font-family: Georgia, serif;
}

.item {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid #eadfd6;
}

.item-img {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  overflow: hidden;
  background: ${WINE};
  color: ${GOLD};
  display: grid;
  place-items: center;
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item strong {
  display: block;
  color: #2b2023;
  line-height: 1.25;
}

.item small {
  color: #777;
  font-weight: 800;
}

.item b {
  color: ${WINE};
  font-size: 13px;
}

.loader {
  width: 54px;
  height: 54px;
  margin-bottom: 18px;
  border-radius: 50%;
  border: 4px solid #eadfd6;
  border-top-color: ${WINE};
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .success-page {
    padding: 16px;
    align-items: start;
  }

  .success-shell {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .confirmation-panel,
  .order-panel {
    border-radius: 22px;
  }

  .confirmation-panel {
    min-height: auto;
    padding: 26px 18px;
  }

  .success-icon,
  .error-icon {
    width: 58px;
    height: 58px;
    padding: 14px;
    border-radius: 19px;
  }

  .confirmation-panel h1 {
    font-size: 38px;
  }

  .message {
    font-size: 14px;
    line-height: 1.6;
  }

  .timeline {
    grid-template-columns: 1fr;
    justify-items: stretch;
    gap: 8px;
    margin: 22px 0 16px;
  }

  .step {
    grid-template-columns: 44px 1fr;
    justify-items: start;
    padding: 9px;
    border-radius: 16px;
    background: #f8f4ee;
  }

  .step svg {
    width: 42px;
    height: 42px;
  }

  .line {
    display: none;
  }

  .button-row,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .order-panel {
    padding: 18px;
  }

  .item {
    grid-template-columns: 50px 1fr;
  }

  .item-img {
    width: 50px;
    height: 50px;
  }

  .item b {
    grid-column: 2;
    margin-top: -4px;
  }
}
`;
