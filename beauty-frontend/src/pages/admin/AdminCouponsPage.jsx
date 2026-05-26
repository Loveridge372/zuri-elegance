import { useEffect, useState } from "react";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

const emptyForm = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  is_active: true,
  expiry_date: "",
  usage_limit: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = () =>
    adminFetch("/admin/coupons")
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .catch((err) => setMessage(err.message));

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    try {
      await adminFetch(editingId ? `/admin/coupons/${editingId}` : "/admin/coupons", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setMessage(editingId ? "Coupon updated." : "Coupon created.");
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    await adminFetch(`/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminLayout title="Coupons Management">
      <style>{css}</style>
      <section className="hero">
        <p>COUPONS</p>
        <h1>Promo Code Control</h1>
        <span>Create discounts with expiry dates and usage limits.</span>
      </section>

      <section className="grid">
        <form className="panel" onSubmit={save}>
          <h2>{editingId ? "Edit Coupon" : "Create Coupon"}</h2>
          <input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input type="number" placeholder="Discount value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
          <input type="date" value={form.expiry_date || ""} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          <input type="number" placeholder="Usage limit" value={form.usage_limit || ""} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
          <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
          {message && <div className="notice">{message}</div>}
          <button><FaPlus /> {editingId ? "Save Coupon" : "Create Coupon"}</button>
        </form>

        <section className="panel">
          <h2>Existing Coupons</h2>
          {coupons.length ? coupons.map((coupon) => (
            <article className="coupon" key={coupon.id}>
              <div>
                <strong>{coupon.code}</strong>
                <span>{coupon.discount_type} - {coupon.discount_value}</span>
                <small>
                  {coupon.is_active ? "Active" : "Inactive"} - Used {coupon.usage_count || 0}
                  {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""} time(s) - Expires {coupon.expiry_date || "Never"} - Discount R {Number(coupon.discount_total || 0).toFixed(2)}
                </small>
              </div>
              <div className="actions">
                <button onClick={() => { setEditingId(coupon.id); setForm({ ...emptyForm, ...coupon }); }}><FaPen /></button>
                <button className="danger" onClick={() => remove(coupon.id)}><FaTrash /></button>
              </div>
            </article>
          )) : <div className="notice">No coupons yet.</div>}
        </section>
      </section>
    </AdminLayout>
  );
}

const css = `
.hero,.panel{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff;margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}.grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:16px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:0}input,select{width:100%;box-sizing:border-box;border:1px solid rgba(7,51,44,.14);border-radius:15px;background:#fffaf5;padding:13px;margin-bottom:10px;font-weight:800;color:#1f1719}label{display:flex;gap:8px;font-weight:900;margin-bottom:10px}label input{width:auto}.panel button{border:none;border-radius:13px;padding:12px 14px;background:${EMERALD};color:#fff;font-weight:900;display:inline-flex;gap:8px;cursor:pointer}.notice,.coupon{padding:13px;border-radius:16px;background:#f8f4ee;margin-bottom:10px}.coupon{display:flex;justify-content:space-between;gap:12px}.coupon strong,.coupon span,.coupon small{display:block}.coupon strong{color:${WINE}}.coupon span{color:${EMERALD};font-weight:900}.coupon small{color:#75686a;font-weight:800;line-height:1.5}.actions{display:flex;gap:8px}.actions .danger{background:#b14343}
@media(max-width:900px){.grid{grid-template-columns:1fr}.coupon{flex-direction:column}}
`;
