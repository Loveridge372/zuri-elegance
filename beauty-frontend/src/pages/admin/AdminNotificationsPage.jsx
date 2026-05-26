import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminNotificationsPage() {
  const [customers, setCustomers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ send_all: true, user_id: "", type: "general", title: "", message: "" });
  const [message, setMessage] = useState("");

  const load = () => {
    adminFetch("/admin/customers").then((data) => setCustomers(Array.isArray(data) ? data : []));
    adminFetch("/admin/notifications").then((data) => setNotifications(Array.isArray(data) ? data : []));
  };

  useEffect(() => { load(); }, []);

  const send = async (event) => {
    event.preventDefault();
    try {
      const data = await adminFetch("/admin/notifications/send", { method: "POST", body: JSON.stringify(form) });
      setMessage(`${data.sent_count} notification(s) sent.`);
      setForm({ send_all: true, user_id: "", type: "general", title: "", message: "" });
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AdminLayout title="Admin Notifications">
      <style>{css}</style>
      <section className="hero"><p>NOTIFICATIONS</p><h1>Send Customer Messages</h1><span>General, order, promo, AI recommendation and stock updates.</span></section>
      <section className="grid">
        <form className="panel" onSubmit={send}>
          <h2>Compose Notification</h2>
          <label><input type="checkbox" checked={form.send_all} onChange={(e) => setForm({ ...form, send_all: e.target.checked })} /> Send to all users</label>
          {!form.send_all && <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}><option value="">Choose customer</option>{customers.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.email}</option>)}</select>}
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["general","order","promo","AI recommendation","stock"].map((type) => <option key={type}>{type}</option>)}</select>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          {message && <div className="notice">{message}</div>}
          <button>Send Notification</button>
        </form>
        <section className="panel">
          <h2>Sent Notifications</h2>
          {notifications.map((item) => <div className="notification" key={item.id}><strong>{item.title}</strong><span>{item.type} • {item.customer_name || item.customer_email}</span><p>{item.message}</p></div>)}
        </section>
      </section>
    </AdminLayout>
  );
}

const css = `
.hero,.panel{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff;margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}.grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:16px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:0}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(7,51,44,.14);border-radius:15px;padding:13px;margin-bottom:10px;background:#f8f4ee;font-weight:800}textarea{min-height:120px}label{display:flex;gap:8px;align-items:center;font-weight:900;margin-bottom:10px}label input{width:auto;margin:0}.panel button{border:none;border-radius:14px;padding:13px 16px;background:${EMERALD};color:#fff;font-weight:900}.notice,.notification{padding:13px;border-radius:15px;background:#f8f4ee;margin-bottom:10px}.notification strong,.notification span{display:block}.notification span{color:${EMERALD};font-weight:900}.notification p{font-weight:800;color:#5d5254}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
`;
