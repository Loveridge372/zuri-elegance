import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaLock,
  FaTruckFast,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLocationDot,
  FaCreditCard,
  FaReceipt,
  FaTicket,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  getLoggedInUser,
  getUserId,
} from "../utils/auth";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

const VAT_RATE = 0.15;
const DELIVERY_FEE = 100;

export default function CheckoutPage() {
  const navigate = useNavigate();

  const user = getLoggedInUser();
  const userId = getUserId();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] =
    useState(true);

  const [paying, setPaying] =
    useState(false);

  const [couponData, setCouponData] =
    useState(null);

  const [form, setForm] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "Cape Town",
    address: user?.address || "",
    notes: "",
    deliveryWindow:
      "ASAP - within 24 hours",
  });

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/cart/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCart(data);
          localStorage.setItem("zuri_cart", JSON.stringify(data));
          return;
        }

        const savedCart =
          localStorage.getItem("zuri_cart");

        if (savedCart) {
          try {
            const parsedCart =
              JSON.parse(savedCart);

            setCart(
              Array.isArray(parsedCart)
                ? parsedCart
                : []
            );
          } catch (err) {
            console.warn(
              "Saved cart invalid:",
              err
            );
            setCart([]);
          }
        } else {
          setCart([]);
        }
      })
      .catch((err) =>
        console.error(
          "CHECKOUT CART ERROR:",
          err
        )
      )
      .finally(() =>
        setLoadingCart(false)
      );
  }, [userId, navigate]);

  useEffect(() => {
    const savedCoupon =
      localStorage.getItem(
        "zuri_coupon"
      );

    if (savedCoupon) {
      try {
        const parsed =
          JSON.parse(savedCoupon);

        setCouponData(parsed);
      } catch (err) {
        console.error(
          "COUPON LOAD ERROR:",
          err
        );
      }
    }
  }, []);

  const subtotal = cart.reduce(
  (sum, item) =>
    sum +
    Number(item.final_price || item.price || 0) *
      Number(item.quantity || 1),
  0
);

const vat = subtotal * VAT_RATE;

const discount = Number(couponData?.discount || 0);

const total = Math.max(
  subtotal + vat + DELIVERY_FEE - discount,
  0
);

const subtotalExVat = subtotal;

  const handlePay = async () => {
    console.log(
      "PAY BUTTON CLICKED"
    );

    if (!userId) {
      navigate("/login");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (
      !form.fullName ||
      !form.email ||
      !form.phone ||
      !form.city ||
      !form.address
    ) {
      alert(
        "Please complete your full delivery details."
      );
      return;
    }

    setPaying(true);

    try {
      const deliveryAddress = `${form.address}, ${form.city}. Delivery: ${form.deliveryWindow}. Notes: ${
        form.notes || "None"
      }`;

      const payRes = await fetch(
        `${API_BASE}/paystack/initialize-order-payment`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: userId,
            email: form.email,
            amount: total,
            delivery_address:
              deliveryAddress,

            coupon_code:
              couponData?.code || null,

            discount_amount:
              discount,

            items: cart.map(
              (item) => ({
                product_id:
                  item.product_id ||
                  item.id,

                quantity:
                  item.quantity || 1,

                price:
                  item.final_price ||
                  item.price ||
                  0,
              })
            ),
          }),
        }
      );

      const payData =
        await payRes.json();

      console.log(
        "PAYSTACK RESPONSE:",
        payData
      );

      if (
        !payRes.ok ||
        !payData.authorization_url
      ) {
        alert(
          payData.error ||
            "Payment failed to start."
        );

        return;
      }

      localStorage.removeItem(
        "zuri_coupon"
      );

      if (payData.reference) {
        localStorage.setItem(
          "zuri_pending_payment_reference",
          payData.reference
        );
        sessionStorage.setItem(
          "zuri_pending_payment_reference",
          payData.reference
        );
      }

      window.location.href =
        payData.authorization_url;
    } catch (err) {
      console.error(
        "PAYSTACK CHECKOUT ERROR:",
        err
      );

      alert(
        "Payment error. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <style>{css}</style>

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

      <main className="checkout-page">
        <button
          className="back-card"
          onClick={() =>
            navigate("/cart")
          }
        >
          <span>
            <FaArrowLeft />
          </span>

          <div>
            <strong>
              Back to Cart
            </strong>

            <small>
              Review your items before
              payment
            </small>
          </div>
        </button>

        <section className="checkout-hero">
          <div>
            <p>SECURE CHECKOUT</p>

            <h1>
              Complete Your Order
            </h1>

            <span>
              Confirm delivery details
              and continue to secure
              Paystack payment.
            </span>
          </div>

          <div className="secure-badge">
            <FaLock />
            Paystack Secure
          </div>
        </section>

        <section className="delivery-strip">
          <div className="delivery-icon">
            <FaTruckFast />
          </div>

          <div>
            <strong>
              24-Hour Delivery Promise
            </strong>

            <p>
              Cape Town & Johannesburg
              priority delivery where
              available.
            </p>
          </div>
        </section>

        <section className="checkout-layout">
          <form className="checkout-card">
            <p className="section-kicker">
              DELIVERY DETAILS
            </p>

            <h2>
              Shipping Information
            </h2>

            <div className="form-grid">
              <Field
                icon={<FaUser />}
                label="Full Name"
                value={form.fullName}
                onChange={(v) =>
                  setForm({
                    ...form,
                    fullName: v,
                  })
                }
              />

              <Field
                icon={<FaEnvelope />}
                label="Email Address"
                value={form.email}
                onChange={(v) =>
                  setForm({
                    ...form,
                    email: v,
                  })
                }
              />

              <Field
                icon={<FaPhone />}
                label="Phone Number"
                placeholder="+27 71 234 5678 or +44 7700 900123"
                value={form.phone}
                onChange={(v) =>
                  setForm({
                    ...form,
                    phone: v,
                  })
                }
              />

              <Field
                icon={
                  <FaLocationDot />
                }
                label="City"
                value={form.city}
                onChange={(v) =>
                  setForm({
                    ...form,
                    city: v,
                  })
                }
              />
            </div>

            <label>
              Delivery Address
            </label>

            <textarea
              placeholder="Street address, suburb, building name..."
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address:
                    e.target.value,
                })
              }
            />

            <label>
              Delivery Window
            </label>

            <select
              value={
                form.deliveryWindow
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryWindow:
                    e.target.value,
                })
              }
            >
              <option>
                ASAP - within 24 hours
              </option>

              <option>
                Morning delivery
              </option>

              <option>
                Afternoon delivery
              </option>

              <option>
                Evening delivery
              </option>
            </select>

            <label>
              Special Instructions
            </label>

            <textarea
              className="small-textarea"
              placeholder="Apartment number, landmarks, delivery notes..."
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target.value,
                })
              }
            />

            <button
              type="button"
              className="pay-main"
              onClick={handlePay}
              disabled={paying}
            >
              <FaCreditCard />

              {paying
                ? "Starting payment..."
                : "Pay Securely Now"}
            </button>
          </form>

          <aside className="summary-card">
            <p className="section-kicker">
              ORDER SUMMARY
            </p>

            <h2>Your Bag</h2>

            {couponData && (
              <div className="coupon-applied">
                <FaTicket />

                <span>
                  Coupon Applied:{" "}
                  <strong>
                    {couponData.code}
                  </strong>
                </span>
              </div>
            )}

            {loadingCart ? (
              <div className="summary-empty">
                Loading cart...
              </div>
            ) : cart.length > 0 ? (
              <div className="product-list">
                {cart.map((item) => (
                  <div
                    className="summary-product"
                    key={
                      item.id ||
                      item.product_id
                    }
                  >
                    <div className="product-img">
                      {item.image_url ||
                      item.image ? (
                        <img
                          src={
                            item.image_url ||
                            item.image
                          }
                          alt={
                            item.name
                          }
                        />
                      ) : (
                        <span>
                          ZURI
                        </span>
                      )}
                    </div>

                    <div className="product-info">
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        Qty:{" "}
                        {item.quantity ||
                          1}
                      </small>
                    </div>

                    <b>
                      R{" "}
                      {(
                        Number(
                          item.final_price ||
                            item.price ||
                            0
                        ) *
                        Number(
                          item.quantity ||
                            1
                        )
                      ).toFixed(2)}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="summary-empty">
                Your cart is empty.
              </div>
            )}

            <div className="summary-row">
              <span>
                Subtotal excl. VAT
              </span>

              <strong>
                R{" "}
                {subtotalExVat.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                VAT 15% included
              </span>

              <strong>
                R {vat.toFixed(2)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>

              <strong>
                R{" "}
                {DELIVERY_FEE.toFixed(
                  2
                )}
              </strong>
            </div>

            {discount > 0 && (
              <div className="summary-row">
                <span>
                  Coupon Discount
                </span>

                <strong>
                  -R{" "}
                  {discount.toFixed(
                    2
                  )}
                </strong>
              </div>
            )}

            <div className="summary-total">
              <span>
                Total incl. VAT
              </span>

              <strong>
                R {total.toFixed(2)}
              </strong>
            </div>

            <div className="tax-note">
              <FaReceipt />

              <span>
                VAT shown for checkout
                transparency and admin
                reporting.
              </span>
            </div>

            <button
              type="button"
              className="pay-sticky"
              onClick={handlePay}
              disabled={paying}
            >
              <FaLock />

              {paying
                ? "Processing..."
                : "Continue to Paystack"}
            </button>

            <div className="promise">
              <FaTruckFast />

              <span>
                Premium delivery in
                Cape Town & Joburg
                within 24 hours where
                available.
              </span>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

function Field({
  icon,
  label,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label>{label}</label>

      <div className="input-wrap">
        {icon}

        <input
          type={label.toLowerCase().includes("phone") ? "tel" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />
      </div>
    </div>
  );
}

const css = `
.checkout-page {
  min-height: 100vh;
  padding: 110px 20px 44px;
  background:
    radial-gradient(circle at top left, rgba(7,51,44,.12), transparent 30%),
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
  font-family: Inter, Arial, sans-serif;
}

.back-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  padding: 14px 18px;
  border-radius: 18px;
  border: 1px solid rgba(7,51,44,.22);
  background: linear-gradient(135deg, #fff, #f2e8dc);
  color: ${EMERALD};
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(7,51,44,.08);
}

.back-card > span {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: ${EMERALD};
  color: #fff;
  display: grid;
  place-items: center;
}

.checkout-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 40px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.34), transparent 36%),
    radial-gradient(circle at bottom right, rgba(255,255,255,.09), transparent 34%),
    linear-gradient(135deg, ${EMERALD}, ${WINE}, #241014);
  color: #fff;
  box-shadow: 0 28px 70px rgba(7,51,44,.24);
  border: 1px solid rgba(247,231,206,.16);
  margin-bottom: 22px;
}

.checkout-hero p,
.section-kicker {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.checkout-hero h1 {
  margin: 10px 0;
  font-family: Georgia, serif;
  font-size: 46px;
  line-height: 1;
}

.secure-badge,
.delivery-strip {
  display: flex;
  align-items: center;
  gap: 14px;
}

.secure-badge {
  padding: 14px 17px;
  border-radius: 18px;
  background: rgba(255,255,255,.11);
  border: 1px solid rgba(255,255,255,.14);
  font-weight: 900;
}

.delivery-strip {
  margin-bottom: 22px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,.86);
  box-shadow: 0 14px 34px rgba(80,36,42,.10);
  color: ${WINE};
}

.delivery-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: ${EMERALD};
  color: ${GOLD};
  font-size: 23px;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1.35fr .75fr;
  gap: 24px;
  align-items: start;
}

.checkout-card,
.summary-card {
  background:
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,244,238,.92));
  border-radius: 30px;
  padding: 28px;
  box-shadow: 0 18px 42px rgba(7,51,44,.10);
  border: 1px solid rgba(7,51,44,.12);
}

.checkout-card h2,
.summary-card h2 {
  margin: 8px 0 20px;
  color: #2b2023;
  font-family: Georgia, serif;
  font-size: 31px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  display: block;
  margin: 12px 0 7px;
  color: ${WINE};
  font-weight: 900;
  font-size: 13px;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f4ee;
  border: 1px solid rgba(7,51,44,.14);
  border-radius: 16px;
  padding: 0 13px;
  color: ${GOLD};
}

.input-wrap input,
textarea,
select {
  width: 100%;
  box-sizing: border-box;
  border: none;
  outline: none;
  background: transparent;
  padding: 15px 0;
  color: #2b2023;
  font-weight: 700;
}

textarea,
select {
  border: 1px solid #eadfd6;
  border-radius: 17px;
  padding: 15px;
  background: #f8f4ee;
  min-height: 95px;
}

select {
  min-height: auto;
}

.small-textarea {
  min-height: 74px;
}

.pay-main,
.pay-sticky {
  width: 100%;
  margin-top: 18px;
  border: none;
  background: linear-gradient(135deg, ${EMERALD}, ${WINE}, #241014);
  color: #fff;
  padding: 16px;
  border-radius: 18px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  box-shadow: 0 16px 34px rgba(7,51,44,.22);
}

.pay-main:disabled,
.pay-sticky:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.summary-card {
  position: sticky;
  top: 105px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-product {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.product-img {
  width: 56px;
  height: 56px;
  border-radius: 15px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, ${EMERALD}, ${WINE});
  color: ${GOLD};
  font-size: 11px;
  font-weight: 900;
}

.product-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info strong {
  display: block;
  color: #2b2023;
}

.product-info small {
  color: #777;
  font-weight: 700;
}

.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid #eee;
  color: #6e6265;
}

.summary-total {
  border-bottom: none;
  font-size: 21px;
  color: ${EMERALD};
  font-weight: 900;
}

.summary-total strong {
  color: ${GOLD};
}

.tax-note,
.promise {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #f8f4ee;
  color: #6e6265;
  font-weight: 800;
  font-size: 13px;
}

.tax-note svg,
.promise svg {
  color: ${GOLD};
}

.summary-empty {
  padding: 18px;
  border-radius: 18px;
  background: #f8f4ee;
  color: ${WINE};
  font-weight: 900;
  margin-bottom: 14px;
}

.coupon-applied {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 13px 14px;
  border-radius: 16px;
  background: rgba(163,133,96,.12);
  color: ${EMERALD};
  font-weight: 900;
}

.summary-card {
  overflow: hidden;
}

.summary-card::before {
  content: "";
  display: block;
  height: 4px;
  margin: -28px -28px 24px;
  background: linear-gradient(90deg, ${EMERALD}, ${GOLD}, ${WINE});
}

.pay-main,
.pay-sticky {
  position: relative;
  overflow: hidden;
}

.pay-main::after,
.pay-sticky::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 120%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,.24), transparent);
  transition: .8s ease;
}

.pay-main:hover::after,
.pay-sticky:hover::after {
  left: 140%;
}

.input-wrap:focus-within,
textarea:focus,
select:focus {
  border-color: ${EMERALD};
  box-shadow: 0 0 0 3px rgba(7,51,44,.12);
}

@media (max-width: 950px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }
}

@media (max-width: 700px) {
  .checkout-page {
    padding: 95px 14px 34px;
  }

  .checkout-hero {
    padding: 30px 22px;
    flex-direction: column;
    align-items: flex-start;
  }

  .checkout-hero h1 {
    font-size: 34px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
`;
