import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch(`/admin/orders/${id}`)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <AdminLayout title={`Order #${id}`}>
      <style>{css}</style>
      <button className="back" onClick={() => navigate("/admin/orders")}>Back to Orders</button>
      {error && <div className="empty">{error}</div>}
      {!order ? <div className="empty">Loading order...</div> : (
        <section className="panel">
          <p>ORDER DETAILS</p>
          <h1>{money(order.total)}</h1>
          <div className="grid">
            <Info label="Customer" value={order.customer_name} />
            <Info label="Email" value={order.customer_email} />
            <Info label="Phone" value={order.customer_phone} />
            <Info label="Status" value={order.status} />
            <Info label="Delivery" value={order.delivery_status} />
            <Info label="Tracking" value={order.tracking_number || "Missing"} />
            <Info label="Coupon" value={order.coupon_code || "None"} />
            <Info label="Discount" value={money(order.discount_amount)} />
          </div>
          <h2>Ordered Items</h2>
          {(order.items || []).map((item) => (
            <div className="item" key={item.id}>
              <span>{item.name}</span>
              <strong>Qty {item.quantity} • {money(item.price)}</strong>
            </div>
          ))}
          <h2>Delivery Address</h2>
          <div className="address">{order.delivery_address || "No address saved."}</div>
        </section>
      )}
    </AdminLayout>
  );
}

function Info({ label, value }) {
  return <div className="info"><small>{label}</small><strong>{value || "N/A"}</strong></div>;
}

const css = `
.back{border:none;border-radius:14px;padding:12px 16px;background:${EMERALD};color:#fff;font-weight:900;cursor:pointer;margin-bottom:14px}
.panel,.empty{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}
.panel p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.panel h1{font-family:Georgia,serif;color:${WINE};font-size:42px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:22px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.info,.item,.address{padding:14px;border-radius:16px;background:#f8f4ee}.info small{display:block;color:${GOLD};font-weight:900}.info strong,.item strong{color:${EMERALD}}.item{display:flex;justify-content:space-between;margin-bottom:8px;font-weight:800}
@media(max-width:900px){.grid{grid-template-columns:1fr}.item{display:block}}
`;
