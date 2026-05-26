
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FaBagShopping,
  FaCartShopping,
  FaCircleXmark,
  FaHeadset,
  FaRotateRight,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const reference = params.get("reference");

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <main className="failed-page">
        <section className="card">
          <div className="icon-wrap">
            <FaCircleXmark />
          </div>

          <p className="kicker">PAYMENT NOT COMPLETED</p>
          <h1>Payment Failed</h1>

          <p className="message">
            Your payment was not successful or may have been cancelled. No order payment was captured. You can retry checkout securely or return to your cart.
          </p>

          {reference && (
            <div className="reference">
              <span>Payment Reference</span>
              <strong>{reference}</strong>
            </div>
          )}

          <div className="actions">
            <button onClick={() => navigate("/checkout")}>
              <FaRotateRight /> Retry Checkout
            </button>

            <button className="secondary" onClick={() => navigate("/cart")}>
              <FaCartShopping /> View Cart
            </button>
          </div>

          <button className="shop-link" onClick={() => navigate("/products")}>
            <FaBagShopping /> Continue Shopping
          </button>

          <div className="support-note">
            <FaHeadset />
            <span>
              If money left your account, keep your reference and contact support so we can verify it.
            </span>
          </div>
        </section>
      </main>
    </>
  );
}

const styles = `
.failed-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,0.20), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
  display: grid;
  place-items: center;
  padding: 110px 20px 40px;
}

.card {
  width: 100%;
  max-width: 560px;
  background: white;
  padding: 42px;
  border-radius: 32px;
  text-align: center;
  box-shadow: 0 24px 70px rgba(80,36,42,0.16);
  border: 1px solid rgba(80,36,42,0.08);
}

.icon-wrap {
  width: 76px;
  height: 76px;
  margin: 0 auto 18px;
  border-radius: 24px;
  background: rgba(192,57,74,0.12);
  color: #c0394a;
  display: grid;
  place-items: center;
  font-size: 42px;
}

.kicker {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
}

h1 {
  margin: 10px 0;
  color: ${WINE};
  font-family: Georgia, serif;
  font-size: 38px;
}

.message {
  color: #6f6264;
  font-weight: 700;
  line-height: 1.6;
}

.reference {
  margin: 22px 0;
  padding: 16px;
  border-radius: 18px;
  background: #f8f4ee;
  word-break: break-word;
}

.reference span {
  display: block;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
}

.reference strong {
  display: block;
  margin-top: 6px;
  color: ${WINE};
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  padding: 14px;
  border-radius: 16px;
  border: none;
  background: ${WINE};
  color: white;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.actions .secondary {
  background: ${GOLD};
  color: #2b1114;
}

.shop-link {
  margin-top: 12px;
  width: 100%;
  border: 1px solid rgba(80,36,42,.14);
  background: #f8f4ee;
  color: ${WINE};
  border-radius: 16px;
  padding: 14px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.support-note {
  margin-top: 20px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(163,133,96,.12);
  color: #6f6264;
  font-weight: 800;
  display: flex;
  gap: 10px;
  text-align: left;
}

.support-note svg {
  color: ${GOLD};
  flex-shrink: 0;
  margin-top: 2px;
}

@media (max-width: 560px) {
  .card {
    padding: 30px 20px;
  }

  .actions {
    flex-direction: column;
  }

  h1 {
    font-size: 31px;
  }
}
`;
