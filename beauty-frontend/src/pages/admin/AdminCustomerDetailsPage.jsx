import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminCustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    adminFetch(`/admin/customers/${id}`).then(setData).catch(console.error);
  }, [id]);

  if (!data) {
    return <AdminLayout title="Customer Details"><style>{css}</style><div className="empty">Loading customer...</div></AdminLayout>;
  }

  const { customer, orders = [], wishlist = [], beauty_analyses = [] } = data;

  return (
    <AdminLayout title={customer.full_name || "Customer Details"}>
      <style>{css}</style>
      <button className="back" onClick={() => navigate("/admin/customers")}>Back to Customers</button>
      <section className="hero">
        <p>CUSTOMER PROFILE</p>
        <h1>{customer.full_name || "Customer"}</h1>
        <span>{customer.email} • {customer.phone || "No phone"}</span>
      </section>
      <section className="grid">
        <Panel title="Orders">{orders.map((order) => <Row key={order.id} left={`#${order.id}`} right={money(order.total)} />)}</Panel>
        <Panel title="Wishlist">{wishlist.map((product) => <Row key={product.id} left={product.name} right={product.category || "Product"} />)}</Panel>
        <Panel title="Beauty Analysis History">{beauty_analyses.map((item) => <Row key={item.id} left={item.beauty_goal || "Analysis"} right={item.skin_type || "Profile"} />)}</Panel>
      </section>
    </AdminLayout>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2>{children?.length ? children : <div className="empty small">No data yet.</div>}</section>;
}

function Row({ left, right }) {
  return <div className="row"><span>{left}</span><strong>{right}</strong></div>;
}

const css = `
.back{border:none;border-radius:14px;padding:12px 16px;background:${EMERALD};color:#fff;font-weight:900;margin-bottom:14px}.hero,.panel,.empty{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:0}.row{display:flex;justify-content:space-between;gap:10px;padding:12px;border-radius:15px;background:#f8f4ee;margin-bottom:8px}.row strong{color:${EMERALD}}.small{box-shadow:none;padding:12px}
@media(max-width:1000px){.grid{grid-template-columns:1fr}}
`;
