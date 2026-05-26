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

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setError("Missing payment reference.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/paystack/verify-order-payment?reference=${reference}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Payment verification failed.");
          return;
        }

        localStorage.removeItem("zuri_cart");
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
.success-page{min-height:100vh;padding:28px;display:grid;place-items:center;background:radial-gradient(circle at top right,rgba(163,133,96,.22),transparent 34%),linear-gradient(180deg,#fbf7f1,#f8f4ee);font-family:Inter,Arial,sans-serif}.success-shell{width:min(1120px,100%);display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:18px}.confirmation-panel,.order-panel{background:rgba(255,255,255,.94);border:1px solid rgba(80,36,42,.08);border-radius:28px;box-shadow:0 24px 70px rgba(80,36,42,.16)}.confirmation-panel{padding:42px;display:flex;flex-direction:column;justify-content:center;text-align:left;min-height:520px}.order-panel{padding:22px;height:fit-content}.success-icon,.error-icon{font-size:64px;margin-bottom:14px}.success-icon{color:${GOLD}}.error-icon{color:#c0394a}.kicker,.order-head p{margin:0;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:2px}.confirmation-panel h1{margin:10px 0;color:${WINE};font-family:Georgia,serif;font-size:48px;line-height:1}.message{max-width:620px;color:#6f6264;font-weight:800;line-height:1.7}.timeline{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:10px;margin:28px 0}.step{display:grid;place-items:center;gap:8px;color:#8b7a7d;font-weight:900}.step svg{width:44px;height:44px;padding:12px;border-radius:16px;background:#f8f4ee;color:${WINE}}.step.active svg{background:linear-gradient(135deg,${GOLD},#f7e7ce);color:#2b1114}.line{height:3px;border-radius:999px;background:#eadfd6}.button-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}button{border:none;border-radius:16px;padding:15px;background:${WINE};color:#fff;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px}button.secondary{background:${GOLD};color:#2b1114}button.light{background:#f0e8df;color:#2b2023}.order-head{display:flex;align-items:center;gap:13px;margin-bottom:18px}.order-head>svg{width:52px;height:52px;padding:13px;border-radius:17px;background:${EMERALD};color:${GOLD}}.order-head h2{margin:4px 0 0;color:${WINE};font-family:Georgia,serif}.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.info{padding:13px;border-radius:16px;background:#f8f4ee}.info span,.info strong{display:block}.info span{color:#75686a;font-size:11px;font-weight:900;text-transform:uppercase}.info strong{margin-top:5px;color:${WINE};font-size:13px;word-break:break-word}.items{margin-top:18px}.items h3{margin:0 0 10px;color:${WINE};font-family:Georgia,serif}.item{display:grid;grid-template-columns:54px 1fr auto;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #eadfd6}.item-img{width:54px;height:54px;border-radius:14px;overflow:hidden;background:${WINE};color:${GOLD};display:grid;place-items:center}.item-img img{width:100%;height:100%;object-fit:cover}.item strong{display:block;color:#2b2023}.item small{color:#777;font-weight:800}.item b{color:${WINE};font-size:13px}.loader{width:48px;height:48px;margin-bottom:18px;border-radius:50%;border:4px solid #eadfd6;border-top-color:${WINE};animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.success-page{padding:16px}.success-shell{grid-template-columns:1fr}.confirmation-panel{min-height:auto;padding:30px 20px}.confirmation-panel h1{font-size:36px}.timeline{grid-template-columns:1fr;justify-items:start}.line{display:none}.button-row,.summary-grid{grid-template-columns:1fr}.item{grid-template-columns:54px 1fr}.item b{grid-column:2}}
`;
