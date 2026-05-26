import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminBeautyIntelligencePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/admin/beauty-intelligence").then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <AdminLayout title="Beauty Intelligence">
      <style>{css}</style>
      <section className="hero"><p>AI BEAUTY INTELLIGENCE</p><h1>Customer Beauty Trends</h1><span>{data?.total_analyses || 0} total AI analyses</span></section>
      {error && <div className="empty">{error}</div>}
      {!data ? <div className="empty">Loading intelligence...</div> : (
        <section className="grid">
          <Trend title="Top Skin Types" items={data.top_skin_types} />
          <Trend title="Top Hair Focuses" items={data.top_hair_focuses} />
          <Trend title="Top Beauty Goals" items={data.top_beauty_goals} />
          <Trend title="Product Keyword Trends" items={data.product_keyword_trends} />
          <Trend title="Inventory Suggestions" items={data.inventory_suggestions} />
          <Trend title="Most Requested Missing Products" items={data.most_requested_missing_products} />
        </section>
      )}
    </AdminLayout>
  );
}

function Trend({ title, items = [] }) {
  return <section className="panel"><h2>{title}</h2>{items.length ? items.map((item) => <div className="row" key={item.label || item.keyword}><span>{item.label || item.keyword}</span><strong>{item.count}</strong></div>) : <div className="empty small">No data yet.</div>}</section>;
}

const css = `
.hero,.panel,.empty{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff;margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:0}.row{display:flex;justify-content:space-between;padding:12px;border-radius:15px;background:#f8f4ee;margin-bottom:8px;font-weight:800}.row strong{color:${EMERALD}}.small{box-shadow:none;padding:12px}
@media(max-width:900px){.grid{grid-template-columns:1fr}}
`;
