import API_BASE from "../services/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTrash,
  FaMinus,
  FaPlus,
  FaBagShopping,
  FaCreditCard,
  FaTruckFast,
  FaReceipt,
  FaShieldHeart,
  FaTag,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useCart } from "../context/CartContext";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";
const VAT_RATE = 0.15;
const DELIVERY_FEE = 100;

export default function CartPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    cartItems = [],
    addToCart,
    removeFromCart,
    updateCartItem,
  } = useCart();

  const items = cartItems;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);

  useEffect(() => {
    const savedCoupon = localStorage.getItem("zuri_coupon");

    if (savedCoupon) {
      try {
        const parsed = JSON.parse(savedCoupon);

        setCouponApplied(parsed);
        setCouponCode(parsed.code || "");
        setDiscountAmount(Number(parsed.discount || 0));
        setCouponMessage(`Coupon ${parsed.code} applied ✅`);
      } catch {
        localStorage.removeItem("zuri_coupon");
      }
    }
  }, []);

  useEffect(() => {
    const reorderItems = JSON.parse(
      localStorage.getItem("reorder_items") || "[]"
    );

    if (!reorderItems.length) return;

    reorderItems.forEach((item) => {
      addToCart({
        ...item,
        id: item.product_id || item.id,
        quantity: item.quantity || 1,
      });
    });

    localStorage.removeItem("reorder_items");
    alert("Items added back to cart ✅");
  }, [addToCart]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const vat = subtotal * VAT_RATE;
    const totalBeforeDiscount = subtotal + vat + DELIVERY_FEE;
    const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);

    return {
      subtotal,
      vat,
      deliveryFee: DELIVERY_FEE,
      totalBeforeDiscount,
      discountAmount,
      finalTotal,
    };
  }, [items, discountAmount]);

  const applyCoupon = async () => {
    setCouponMessage("");

    if (!couponCode.trim()) {
      setCouponMessage("Enter a coupon code.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/coupons/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          subtotal: totals.subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDiscountAmount(0);
        setCouponApplied(null);
        localStorage.removeItem("zuri_coupon");
        setCouponMessage(data.error || "Invalid coupon.");
        return;
      }

      const discount = Number(data.discount || 0);
      const appliedCoupon = {
        code: data.code || couponCode.trim().toUpperCase(),
        discount,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      };

      setDiscountAmount(discount);
      setCouponApplied(appliedCoupon);
      setCouponMessage(`Coupon ${appliedCoupon.code} applied ✅`);

      localStorage.setItem("zuri_coupon", JSON.stringify(appliedCoupon));
    } catch (err) {
      console.error("COUPON ERROR:", err);
      setCouponMessage("Failed to apply coupon.");
    }
  };

  const clearCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setCouponApplied(null);
    setCouponMessage("");
    localStorage.removeItem("zuri_coupon");
  };

  const syncQuantity = async (item, quantity) => {
    if (!item.cart_item_id) return;

    try {
      await fetch(`${API_BASE}/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.cart_item_id,
          quantity,
        }),
      });
    } catch (err) {
      console.error("CART UPDATE ERROR:", err);
    }
  };

  const removeBackendItem = async (item, productId) => {
    if (!userId) return;

    if (item?.cart_item_id) {
      const response = await fetch(`${API_BASE}/cart/remove/${item.cart_item_id}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 404) return;
    }

    try {
      const cartResponse = await fetch(`${API_BASE}/cart/${userId}`);
      const backendItems = await cartResponse.json();

      if (Array.isArray(backendItems)) {
        const backendItem = backendItems.find((entry) => {
          const backendProductId = entry.product_id || entry.id;
          return Number(backendProductId) === Number(productId);
        });

        if (backendItem?.cart_item_id) {
          const response = await fetch(
            `${API_BASE}/cart/remove/${backendItem.cart_item_id}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok || response.status === 404) return;
        }
      }
    } catch (err) {
      console.error("CART LOOKUP REMOVE ERROR:", err);
    }

    const response = await fetch(
      `${API_BASE}/cart/remove-product/${userId}/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error("Backend cart product remove failed");
    }
  };

  const increaseQty = (id) => {
    const item = items.find((entry) => entry.id === id);
    const quantity = Number(item?.quantity || 1) + 1;

    updateCartItem?.(id, quantity);
    syncQuantity(item, quantity);
  };

  const decreaseQty = (id) => {
    const item = items.find((entry) => entry.id === id);
    const quantity = Math.max(1, Number(item?.quantity || 1) - 1);

    updateCartItem?.(id, quantity);
    syncQuantity(item, quantity);
  };

  const removeItem = async (id) => {
    const confirmRemove = window.confirm("Remove this item from your cart?");
    if (!confirmRemove) return;

    const item = items.find((entry) => entry.id === id);
    const productId = item?.product_id || item?.id || id;

    removeFromCart?.(productId);

    try {
      await removeBackendItem(item, productId);
    } catch (err) {
      console.error("CART REMOVE ERROR:", err);
    }
  };

  const goToCheckout = () => {
    localStorage.setItem("zuri_cart", JSON.stringify(items));

    navigate("/checkout", {
      state: {
        couponCode: couponApplied?.code || null,
        discountAmount,
        deliveryFee: DELIVERY_FEE,
        total: totals.finalTotal,
      },
    });
  };

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main className="cart-page">
        <button className="back-card" onClick={() => navigate("/products")}>
          <span>
            <FaArrowLeft />
          </span>

          <div>
            <strong>Back to Shop</strong>
            <small>Continue browsing Zuri products</small>
          </div>
        </button>

        <section className="cart-hero">
          <div className="cart-orb">
            <FaBagShopping />
          </div>

          <p>ZURI BAG</p>
          <h1>Your Luxury Cart</h1>
          <span>Review your beauty picks, coupon savings and delivery total.</span>
        </section>

        {items.length > 0 ? (
          <section className="cart-layout">
            <div className="cart-items">
              {items.map((item) => {
                const image =
                  item.image_url ||
                  item.image ||
                  item.image_url_2 ||
                  item.image_url_3 ||
                  item.image_url_4 ||
                  "";

                const lineTotal =
                  Number(item.price || 0) * Number(item.quantity || 1);

                return (
                  <article className="cart-card luxury-cart-card" key={item.id}>
                    <div className="cart-image">
                      {image ? (
                        <img
                          src={image}
                          alt={item.name || "Product"}
                          className="cart-product-img"
                        />
                      ) : (
                        <>
                          <FaBagShopping />
                          <span>ZURI</span>
                        </>
                      )}
                    </div>

                    <div className="cart-info">
                      <p>{item.category || "Beauty"}</p>
                      <h3>{item.name}</h3>
                      <small>{item.description || "Luxury beauty product"}</small>

                      <strong>R {Number(item.price || 0).toFixed(2)}</strong>

                      <div className="item-total-mobile">
                        Line total: R {lineTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="qty-box">
                      <button onClick={() => decreaseQty(item.id)}>
                        <FaMinus />
                      </button>

                      <span>{item.quantity || 1}</span>

                      <button onClick={() => increaseQty(item.id)}>
                        <FaPlus />
                      </button>
                    </div>

                    <div className="line-total">
                      <small>Total</small>
                      <strong>R {lineTotal.toFixed(2)}</strong>
                    </div>

                    <button
                      className="trash-btn"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <FaTrash />
                    </button>
                  </article>
                );
              })}
            </div>

            <aside className="summary-card luxury-summary">
              <p>ORDER SUMMARY</p>
              <h2>Checkout Details</h2>

              <div className="secure-mini">
                <FaShieldHeart />
                <span>Secure checkout with Paystack</span>
              </div>

              <div className="coupon-box">
                <p className="coupon-label">
                  <FaTag /> Have a coupon?
                </p>

                <div className="coupon-row">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="coupon-input"
                  />

                  <button type="button" className="coupon-btn" onClick={applyCoupon}>
                    Apply
                  </button>
                </div>

                {couponMessage && (
                  <div
                    className={
                      discountAmount > 0 ? "coupon-success" : "coupon-error"
                    }
                  >
                    {couponMessage}
                  </div>
                )}

                {discountAmount > 0 && (
                  <button
                    type="button"
                    className="clear-coupon-btn"
                    onClick={clearCoupon}
                  >
                    Remove coupon
                  </button>
                )}
              </div>

              {discountAmount > 0 && (
                <div className="saving-banner">
                  <strong>You saved R {discountAmount.toFixed(2)}</strong>
                  <span>with {couponApplied?.code || "your coupon"}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Subtotal</span>
                <strong>R {totals.subtotal.toFixed(2)}</strong>
              </div>

              <div className="summary-row">
                <span>VAT 15%</span>
                <strong>R {totals.vat.toFixed(2)}</strong>
              </div>

              <div className="summary-row">
                <span>Delivery</span>
                <strong>R {totals.deliveryFee.toFixed(2)}</strong>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row discount-row">
                  <span>Coupon Discount</span>
                  <strong>-R {discountAmount.toFixed(2)}</strong>
                </div>
              )}

              <div className="delivery-note">
                <FaTruckFast />
                <span>24-hour priority delivery in Cape Town & Joburg.</span>
              </div>

              <div className="tax-note">
                <FaReceipt />
                <span>VAT shown for admin reporting and checkout transparency.</span>
              </div>

              <div className="summary-total">
                <span>Total incl. VAT</span>
                <strong>R {totals.finalTotal.toFixed(2)}</strong>
              </div>

              <button className="checkout-btn luxury-checkout" onClick={goToCheckout}>
                <FaCreditCard />
                Proceed to Checkout
              </button>

              <button className="continue-btn" onClick={() => navigate("/products")}>
                Continue Shopping
              </button>
            </aside>
          </section>
        ) : (
          <section className="empty-cart luxury-empty">
            <div className="empty-orb">
              <FaBagShopping />
            </div>

            <h2>Your cart is empty</h2>

            <p>Add your favorite Zuri Elegance products to begin checkout.</p>

            <button onClick={() => navigate("/products")}>Shop Products</button>
          </section>
        )}
      </main>
    </>
  );
}

const css = `
.cart-page {
  min-height: 100vh;
  padding: 110px 20px 44px;
  background:
    radial-gradient(circle at top left, rgba(7,51,44,.12), transparent 30%),
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
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

.cart-hero {
  text-align: center;
  padding: 58px 20px;
  border-radius: 30px;
  color: #fff;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.35), transparent 35%),
    radial-gradient(circle at bottom right, rgba(255,255,255,.09), transparent 34%),
    linear-gradient(135deg, ${EMERALD}, ${WINE}, #241014);
  margin-bottom: 30px;
  box-shadow: 0 28px 70px rgba(7,51,44,.24);
  border: 1px solid rgba(247,231,206,.16);
}

.cart-orb {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 19px;
  display: grid;
  place-items: center;
  color: ${GOLD};
  background: rgba(255,255,255,.11);
  font-size: 25px;
}

.cart-hero p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  letter-spacing: 2px;
  font-weight: 900;
}

.cart-hero h1 {
  margin: 10px 0;
  font-size: 44px;
  font-family: Georgia, serif;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1.45fr .85fr;
  gap: 22px;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-card {
  display: grid;
  grid-template-columns: 120px 1fr auto auto;
  gap: 18px;
  align-items: center;
  padding: 16px;
  border-radius: 26px;
  background:
    linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,244,238,.92));
}

.cart-image {
  height: 112px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  gap: 6px;
  color: ${GOLD};
  background:
    radial-gradient(circle at center, rgba(163,133,96,.28), transparent 45%),
    linear-gradient(135deg, ${EMERALD}, ${WINE});
}

.cart-info h3 {
  margin: 8px 0 4px;
  color: #2b2023;
}

.cart-info strong {
  display: block;
  margin-top: 12px;
  color: ${WINE};
}

.qty-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(7,51,44,.07);
  padding: 8px;
  border-radius: 999px;
  border: 1px solid rgba(7,51,44,.12);
}

.qty-box button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: ${EMERALD};
  color: #fff;
  cursor: pointer;
}

.trash-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 14px;
  background: rgba(255,91,124,.14);
  color: #ff4d6d;
  cursor: pointer;
}

.summary-card {
  position: sticky;
  top: 105px;
  padding: 28px;
  border-radius: 28px;
  color: #fff;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,.30), transparent 40%),
    radial-gradient(circle at bottom right, rgba(255,255,255,.08), transparent 36%),
    linear-gradient(135deg, ${EMERALD}, ${WINE}, #241014);
  box-shadow: 0 24px 58px rgba(7,51,44,.24);
  border: 1px solid rgba(247,231,206,.16);
}

.summary-card > p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  letter-spacing: 1.8px;
  font-weight: 900;
}

.summary-card h2 {
  margin: 8px 0 20px;
  font-family: Georgia, serif;
  font-size: 28px;
}

.coupon-box {
  margin-bottom: 20px;
}

.coupon-label {
  margin-bottom: 8px;
  color: #fff;
  font-weight: 800;
}

.coupon-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.coupon-input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.08);
  color: #fff;
  border-radius: 14px;
  padding: 14px;
  outline: none;
  font-weight: 800;
}

.coupon-input::placeholder {
  color: rgba(255,255,255,.55);
}

.coupon-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 14px;
  padding: 0 18px;
  background: ${GOLD};
  color: #2b1114;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.coupon-success {
  margin-top: 10px;
  color: #d6f5d6;
  font-size: 13px;
  font-weight: 800;
}

.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,.12);
}

.summary-total {
  border-bottom: none;
  margin-top: 6px;
}

.summary-total strong {
  color: ${GOLD};
  font-size: 25px;
}

.delivery-note,
.tax-note {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 14px 0;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,.10);
  color: rgba(255,255,255,.82);
  font-size: 13px;
}

.checkout-btn {
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  border: none;
  border-radius: 16px;
  background: ${GOLD};
  color: #2b1114;
  font-weight: 900;
  cursor: pointer;
}

.continue-btn {
  width: 100%;
  margin-top: 10px;
  padding: 13px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.09);
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.empty-cart {
  text-align: center;
  background: #fff;
  border-radius: 26px;
  padding: 50px 20px;
  border: 1px solid rgba(7,51,44,.14);
  box-shadow: 0 18px 42px rgba(7,51,44,.10);
}

.cart-product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
}

.luxury-cart-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(7,51,44,.18);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(7,51,44,.10);
  transition: all .28s ease;
}

.luxury-cart-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 50px rgba(7,51,44,.18);
}

.luxury-cart-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      120deg,
      transparent,
      rgba(255,255,255,.18),
      transparent
    );

  transform: translateX(-120%);
  transition: .8s ease;
  pointer-events: none;
}

.luxury-cart-card:hover::after {
  transform: translateX(140%);
}

.line-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.line-total small {
  color: #888;
  font-weight: 700;
}

.line-total strong {
  color: ${WINE};
  font-size: 16px;
}

.item-total-mobile {
  display: none;
}

.secure-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.88);
  font-size: 13px;
}

.saving-banner {
  margin: 18px 0;
  padding: 16px;
  border-radius: 18px;
  background:
    linear-gradient(
      135deg,
      rgba(163,133,96,.24),
      rgba(255,255,255,.08)
    );

  border: 1px solid rgba(163,133,96,.20);
}

.saving-banner strong {
  display: block;
  color: ${GOLD};
  font-size: 18px;
}

.saving-banner span {
  color: rgba(255,255,255,.75);
  font-size: 13px;
}

.discount-row strong {
  color: #8CFFB3;
}

.coupon-error {
  margin-top: 10px;
  color: #ffb4b4;
  font-size: 13px;
  font-weight: 800;
}

.clear-coupon-btn {
  margin-top: 12px;
  border: none;
  background: transparent;
  color: ${GOLD};
  font-weight: 900;
  cursor: pointer;
}

.checkout-btn,
.continue-btn,
.coupon-btn,
.qty-box button,
.trash-btn {
  transition: all .25s ease;
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(163,133,96,.30);
}

.continue-btn:hover {
  background: rgba(255,255,255,.16);
}

.qty-box button:hover {
  transform: scale(1.08);
}

.trash-btn:hover {
  background: rgba(255,91,124,.22);
  transform: scale(1.08);
}

.checkout-btn {
  position: relative;
  overflow: hidden;
}

.checkout-btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -130%;
  width: 120%;
  height: 100%;

  background:
    linear-gradient(
      120deg,
      transparent,
      rgba(255,255,255,.25),
      transparent
    );

  transition: .8s ease;
}

.checkout-btn:hover::after {
  left: 140%;
}

.empty-orb {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 34px;
  color: ${GOLD};

  background:
    radial-gradient(circle at center, rgba(163,133,96,.28), transparent 50%),
    linear-gradient(135deg, ${WINE}, #2b1114);
}

.luxury-empty {
  box-shadow: 0 20px 50px rgba(80,36,42,.08);
}

.luxury-empty h2 {
  margin: 12px 0 8px;
  color: #2b2023;
  font-size: 34px;
  font-family: Georgia, serif;
}

.luxury-empty p {
  color: #777;
  max-width: 420px;
  margin: 0 auto 20px;
}

.luxury-empty button {
  border: none;
  border-radius: 16px;
  padding: 14px 22px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.luxury-empty button:hover {
  transform: translateY(-2px);
}

.back-card,
.checkout-btn,
.continue-btn,
.luxury-empty button {
  transition: all .25s ease;
}

.back-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(80,36,42,.10);
}

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }

  .cart-card {
  grid-template-columns: 92px 1fr;
  gap: 12px;
  padding: 14px;
}

.cart-image {
  height: 92px;
  border-radius: 18px;
}

.line-total {
  display: none;
}

.item-total-mobile {
  display: block;
  margin-top: 8px;
  color: ${WINE};
  font-weight: 900;
  font-size: 12px;
}

.qty-box {
  grid-column: 1 / 2;
  justify-content: center;
}

.trash-btn {
  grid-column: 2 / 3;
  justify-self: end;
}
}

@media (max-width: 480px) {
  .coupon-row {
    flex-direction: column;
  }

  .coupon-btn {
    width: 100%;
    padding: 14px;
  }

  .cart-page {
    padding: 95px 14px 34px;
  }

  .summary-card {
    padding: 22px;
  }

  .cart-hero h1 {
    font-size: 34px;
  }

  .cart-card {
  grid-template-columns: 82px 1fr;
  border-radius: 22px;
}

.cart-image {
  height: 82px;
}

.cart-info h3 {
  font-size: 14px;
  line-height: 1.2;
}

.cart-info small {
  font-size: 11px;
}

.qty-box {
  width: fit-content;
  padding: 6px;
}

.qty-box button {
  width: 26px;
  height: 26px;
}

.trash-btn {
  width: 38px;
  height: 38px;
}

.summary-total strong {
  font-size: 22px;
}

.checkout-btn {
  min-height: 52px;
}
}
`;
