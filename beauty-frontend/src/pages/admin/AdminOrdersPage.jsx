import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaMagnifyingGlass, FaTruckFast } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";
const statuses = ["Paid", "Processing", "Packed", "Out for Delivery", "Delivered", "Cancelled"];

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [message, setMessage] = useState("");

  const loadOrders = () =>
    adminFetch("/admin/orders")
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setMessage(err.message));

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = `${order.id} ${order.customer_name || ""} ${order.customer_email || ""} ${order.reference || ""} ${order.tracking_number || ""}`.toLowerCase();
      const delivery = normalizeStatus(order.delivery_status || order.status);
      return text.includes(search.toLowerCase()) && (filter === "All" || delivery === filter);
    });
  }, [orders, search, filter]);

  const updateOrder = async (order, deliveryStatus) => {
    try {
      await adminFetch(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: deliveryStatus === "Paid" ? "Paid" : order.status,
          delivery_status: deliveryStatus,
          generate_tracking: ["Packed", "Out for Delivery", "Delivered"].includes(deliveryStatus),
        }),
      });
      setMessage(`Order #${order.id} updated.`);
      loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AdminLayout title="Orders Management">
      <style>{css}</style>
      <section className="hero">
        <div>
          <p>ORDER CONTROL</p>
          <h1>Manage Customer Orders</h1>
          <span>Update delivery status, generate tracking numbers and notify customers.</span>
        </div>
        <div className="count"><FaTruckFast /><strong>{orders.length}</strong></div>
      </section>

      <section className="toolbar">
        <div className="search"><FaMagnifyingGlass /><input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </section>
      {message && <div className="message">{message}</div>}

      <section className="orders">
        {filteredOrders.length ? filteredOrders.map((order) => (
          <article className="order" key={order.id}>
            <div className="order-top">
              <div>
                <p>ORDER #{order.id}</p>
                <h2>{money(order.total)}</h2>
                <span>{order.customer_name || "Customer"} • {order.customer_email || "No email"}</span>
                <small>{order.customer_phone || "No phone"} • {order.delivery_address || "No delivery address"}</small>
              </div>
              <div className="badges">
                <span>{order.status || "Pending"}</span>
                <span>{order.delivery_status || "Processing"}</span>
              </div>
            </div>
            <div className="meta">
              <div><small>Reference</small><strong>{order.reference || "N/A"}</strong></div>
              <div><small>Tracking</small><strong>{order.tracking_number || "Missing"}</strong></div>
              <div><small>Coupon</small><strong>{order.coupon_code || "None"}</strong></div>
              <div><small>Discount</small><strong>{money(order.discount_amount)}</strong></div>
            </div>
            <div className="items">
              {(order.items || []).map((item) => (
                <div key={item.id}>
                  <span>{item.name}</span>
                  <strong>Qty {item.quantity} • {money(item.price)}</strong>
                </div>
              ))}
            </div>
            <div className="actions">
              {statuses.map((status) => (
                <button key={status} onClick={() => updateOrder(order, status)}>{status}</button>
              ))}
              <button className="details" onClick={() => navigate(`/admin/orders/${order.id}`)}><FaEye /> Details</button>
            </div>
          </article>
        )) : <div className="empty">No orders found.</div>}
      </section>
    </AdminLayout>
  );
}

function normalizeStatus(value = "") {
  const normalized = value.toLowerCase();
  if (normalized.includes("out")) return "Out for Delivery";
  if (normalized.includes("deliver")) return "Delivered";
  if (normalized.includes("pack")) return "Packed";
  if (normalized.includes("cancel")) return "Cancelled";
  if (normalized.includes("paid")) return "Paid";
  return "Processing";
}

const css = `
.hero{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:30px;border-radius:30px;color:#fff;background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);box-shadow:0 24px 60px rgba(7,51,44,.22)}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px;font-size:12px}.hero h1{margin:8px 0;font-family:Georgia,serif;font-size:38px}.hero span{color:rgba(255,255,255,.78);font-weight:700}.count{width:86px;height:86px;border-radius:24px;background:rgba(255,255,255,.12);display:grid;place-items:center;color:${GOLD}}.count strong{font-size:28px;color:#fff}
.toolbar{display:grid;grid-template-columns:1fr 220px;gap:12px;margin:18px 0}.search{display:flex;align-items:center;gap:9px;border:1px solid rgba(7,51,44,.14);border-radius:16px;background:#fff;padding:0 13px;color:${EMERALD}}.search input,select{width:100%;box-sizing:border-box;border:none;background:transparent;padding:14px;font-weight:800}select{border:1px solid rgba(7,51,44,.14);border-radius:16px;background:#fff}
.message,.empty{padding:14px;border-radius:16px;background:#fff;color:${WINE};font-weight:900;margin-bottom:12px}.orders{display:grid;gap:14px}.order{padding:20px;border-radius:24px;background:rgba(255,255,255,.94);border:1px solid rgba(7,51,44,.12);box-shadow:0 18px 42px rgba(7,51,44,.09)}.order-top{display:flex;justify-content:space-between;gap:14px}.order p{margin:0;color:${GOLD};font-size:12px;font-weight:900;letter-spacing:1.5px}.order h2{margin:7px 0;color:${WINE};font-family:Georgia,serif}.order span,.order small{display:block;color:#75686a;font-weight:800}.badges{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}.badges span{padding:9px 12px;border-radius:999px;background:rgba(7,51,44,.08);color:${EMERALD};font-weight:900}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}.meta div,.items div{padding:12px;border-radius:16px;background:#f8f4ee}.meta small{display:block;color:${GOLD};font-weight:900}.meta strong{color:${WINE}}.items{display:grid;gap:8px}.items div{display:flex;justify-content:space-between;gap:10px}.items strong{color:${EMERALD}}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.actions button{border:none;border-radius:13px;padding:10px 12px;background:${EMERALD};color:#fff;font-weight:900;cursor:pointer}.actions .details{background:${GOLD};color:#2b1114;display:flex;gap:7px;align-items:center}
@media(max-width:900px){.toolbar,.meta{grid-template-columns:1fr}.hero,.order-top{flex-direction:column}.hero h1{font-size:32px}.items div{display:block}}
`;
