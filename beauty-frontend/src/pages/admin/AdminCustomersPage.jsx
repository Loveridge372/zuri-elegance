import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaMagnifyingGlass, FaUser } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/admin/customers")
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => customers.filter((customer) => {
    const text = `${customer.full_name || ""} ${customer.email || ""} ${customer.phone || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  }), [customers, search]);

  return (
    <AdminLayout title="Customers Management">
      <style>{css}</style>
      <section className="hero">
        <div><p>CUSTOMERS</p><h1>Customer Profiles</h1><span>View orders, wishlist items and AI beauty history.</span></div>
        <FaUser />
      </section>
      <div className="search"><FaMagnifyingGlass /><input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {error && <div className="empty">{error}</div>}
      <section className="customers">
        {filtered.length ? filtered.map((customer) => (
          <article className="customer" key={customer.id}>
            <div><strong>{customer.full_name || "Customer"}</strong><small>{customer.email}</small><span>{customer.phone || "No phone"} • {customer.city || "No city"}</span></div>
            <button onClick={() => navigate(`/admin/customers/${customer.id}`)}><FaEye /> View</button>
          </article>
        )) : <div className="empty">No customers found.</div>}
      </section>
    </AdminLayout>
  );
}

const css = `
.hero{display:flex;justify-content:space-between;align-items:center;padding:30px;border-radius:30px;color:#fff;background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);box-shadow:0 24px 60px rgba(7,51,44,.22);margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;font-size:38px;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:700}.hero>svg{font-size:42px;color:${GOLD}}
.search{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid rgba(7,51,44,.14);border-radius:16px;padding:0 14px;color:${EMERALD};margin-bottom:16px}.search input{width:100%;border:none;background:transparent;padding:15px;font-weight:800;outline:none}
.customers{display:grid;gap:12px}.customer,.empty{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:22px;padding:18px;box-shadow:0 14px 34px rgba(7,51,44,.08)}.customer strong,.customer small,.customer span{display:block}.customer strong{color:${WINE}}.customer small{color:${EMERALD};font-weight:900}.customer span{color:#75686a;font-weight:800}.customer button{border:none;border-radius:14px;padding:12px 14px;background:${EMERALD};color:#fff;font-weight:900;display:flex;gap:8px;cursor:pointer}.empty{color:${WINE};font-weight:900}
@media(max-width:700px){.hero,.customer{flex-direction:column;align-items:flex-start}.hero h1{font-size:32px}}
`;
