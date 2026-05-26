import { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = () =>
    adminFetch("/admin/brands")
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch((err) => setMessage(err.message));

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    if (!editing) return;

    try {
      await adminFetch(`/admin/brands/${encodeURIComponent(editing)}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setMessage("Brand updated.");
      setEditing(null);
      setName("");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const remove = async (brandName) => {
    if (!window.confirm(`Remove brand "${brandName}" from all products?`)) return;

    try {
      await adminFetch(`/admin/brands/${encodeURIComponent(brandName)}`, {
        method: "DELETE",
      });
      setMessage("Brand removed from products.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AdminLayout title="Brands Management">
      <style>{css}</style>
      <section className="hero">
        <p>BRANDS</p>
        <h1>Brand Directory</h1>
        <span>Edit brand names across all products. Add new brands from Admin Products.</span>
      </section>

      {message && <div className="notice">{message}</div>}

      {editing && (
        <form className="panel edit-panel" onSubmit={save}>
          <h2>Edit Brand</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button>Save Brand</button>
        </form>
      )}

      <section className="brand-grid">
        {brands.length ? (
          brands.map((brand) => (
            <article className="brand-card" key={brand.name}>
              <div className="brand-img">
                {brand.image_url ? <img src={brand.image_url} alt={brand.name} /> : "ZE"}
              </div>
              <div>
                <strong>{brand.name}</strong>
                <span>{brand.product_count} product{brand.product_count === 1 ? "" : "s"}</span>
              </div>
              <div className="actions">
                <button onClick={() => { setEditing(brand.name); setName(brand.name); }}><FaPen /></button>
                <button className="danger" onClick={() => remove(brand.name)}><FaTrash /></button>
              </div>
            </article>
          ))
        ) : (
          <div className="notice">No brands yet. Add brand names to products first.</div>
        )}
      </section>
    </AdminLayout>
  );
}

const css = `
.hero,.panel,.notice{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff;margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}.notice{margin-bottom:14px;font-weight:900}.edit-panel{margin-bottom:16px}.edit-panel h2{margin-top:0;color:${WINE};font-family:Georgia,serif}input{width:100%;box-sizing:border-box;border:1px solid rgba(7,51,44,.14);border-radius:15px;background:#fffaf5;padding:13px;margin-bottom:10px;font-weight:900;color:#1f1719}.brand-grid{display:grid;gap:12px}.brand-card{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:center;padding:13px;border-radius:18px;background:#fff;border:1px solid rgba(7,51,44,.12);box-shadow:0 14px 32px rgba(7,51,44,.08)}.brand-img{width:74px;height:74px;border-radius:16px;background:${EMERALD};color:${GOLD};display:grid;place-items:center;overflow:hidden;font-weight:900}.brand-img img{width:100%;height:100%;object-fit:cover}.brand-card strong,.brand-card span{display:block}.brand-card strong{color:${WINE};font-family:Georgia,serif;font-size:22px}.brand-card span{color:${EMERALD};font-weight:900}.actions{display:flex;gap:8px}.actions button,.edit-panel button{border:none;border-radius:13px;padding:12px 14px;background:${EMERALD};color:#fff;font-weight:900;cursor:pointer}.actions .danger{background:#b14343}
@media(max-width:700px){.brand-card{grid-template-columns:64px 1fr}.actions{grid-column:1/-1}}
`;
