import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaChartLine,
  FaCrown,
  FaReceipt,
  FaTags,
  FaTruckFast,
  FaUsers,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminFetch("/admin/dashboard-summary"),
      adminFetch("/admin/analytics"),
    ])
      .then(([summaryData, analyticsData]) => {
        setSummary(summaryData);
        setAnalytics(analyticsData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const chart = analytics?.revenue_chart || [];
  const maxRevenue = useMemo(
    () => Math.max(...chart.map((item) => Number(item.revenue || 0)), 1),
    [chart]
  );

  return (
    <AdminLayout title="Dashboard Overview">
      <style>{css}</style>

      <section className="admin-hero">
        <div>
          <p>ZURI COMMAND CENTER</p>
          <h1>Luxury Store Intelligence</h1>
          <span>Sales, orders, beauty AI, inventory and customers at a glance.</span>
        </div>
        <div className="hero-mark">
          <FaCrown />
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {!summary ? (
        <div className="admin-empty">Loading dashboard...</div>
      ) : (
        <>
          <section className="stat-grid">
            <Stat icon={<FaChartLine />} label="Total Revenue" value={money(summary.total_revenue)} />
            <Stat icon={<FaReceipt />} label="Total Orders" value={summary.total_orders} />
            <Stat icon={<FaTruckFast />} label="Pending Orders" value={summary.pending_orders} />
            <Stat icon={<FaCrown />} label="Paid Orders" value={summary.paid_orders} />
            <Stat icon={<FaTruckFast />} label="Delivered" value={summary.delivered_orders} />
            <Stat icon={<FaBoxOpen />} label="Products" value={summary.total_products} />
            <Stat icon={<FaTags />} label="Brands" value={summary.total_brands || 0} />
            <Stat icon={<FaBoxOpen />} label="Low Stock" value={summary.low_stock_products} warning />
            <Stat icon={<FaUsers />} label="Customers" value={summary.total_customers} />
            <Stat icon={<FaWandMagicSparkles />} label="AI Analyses" value={summary.total_ai_analyses} />
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <p className="kicker">REVENUE CHART</p>
              <h2>Last 7 Days</h2>
              <div className="chart">
                {chart.map((item) => (
                  <div className="bar-wrap" key={item.label}>
                    <div
                      className="bar"
                      style={{ height: `${Math.max((Number(item.revenue || 0) / maxRevenue) * 180, 12)}px` }}
                    />
                    <strong>{item.label}</strong>
                    <small>{money(item.revenue)}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <p className="kicker">LOW STOCK PRODUCTS</p>
              <h2>Restock Watch</h2>
              {(summary.low_stock || []).length ? (
                summary.low_stock.map((product) => (
                  <div className="row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.brand || "No brand"} • {product.category || "Product"}</small>
                    </div>
                    <span>{product.stock || 0} left</span>
                  </div>
                ))
              ) : (
                <div className="admin-empty">No low-stock products.</div>
              )}
            </div>
          </section>

          <section className="panel">
            <p className="kicker">RECENT ORDERS</p>
            <h2>Latest Store Activity</h2>
            <div className="table">
              {(summary.recent_orders || []).map((order) => (
                <div className="table-row" key={order.id}>
                  <strong>#{order.id}</strong>
                  <span>{order.customer_name || "Customer"}</span>
                  <span>{order.status}</span>
                  <b>{money(order.total)}</b>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

function Stat({ icon, label, value, warning }) {
  return (
    <article className={warning ? "stat warning" : "stat"}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const css = `
.admin-hero {
  display:flex;
  justify-content:space-between;
  gap:18px;
  padding:34px;
  border-radius:30px;
  color:#fff;
  background:radial-gradient(circle at top left, rgba(163,133,96,.32), transparent 36%), linear-gradient(135deg, ${EMERALD}, ${WINE}, #1f0f12);
  box-shadow:0 28px 70px rgba(7,51,44,.24);
}
.admin-hero p,.kicker{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px;font-size:12px}
.admin-hero h1{margin:8px 0;font-family:Georgia,serif;font-size:42px}
.admin-hero span{color:rgba(255,255,255,.78);font-weight:700}
.hero-mark{width:72px;height:72px;border-radius:24px;background:rgba(255,255,255,.12);display:grid;place-items:center;color:${GOLD};font-size:30px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:18px 0}
.stat,.panel{background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(248,244,238,.92));border:1px solid rgba(7,51,44,.12);border-radius:24px;padding:20px;box-shadow:0 18px 42px rgba(7,51,44,.09)}
.stat div{width:44px;height:44px;border-radius:15px;background:${EMERALD};color:${GOLD};display:grid;place-items:center}
.stat span{display:block;margin-top:12px;color:#746568;font-weight:900;font-size:12px}
.stat strong{display:block;margin-top:4px;color:${WINE};font-family:Georgia,serif;font-size:28px}
.stat.warning strong{color:#b14343}
.dashboard-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-bottom:18px}
.panel h2{margin:7px 0 18px;color:${WINE};font-family:Georgia,serif}
.chart{height:230px;display:flex;align-items:end;gap:12px}
.bar-wrap{flex:1;text-align:center;color:${WINE};font-size:11px;font-weight:900}
.bar{margin:0 auto 8px;width:100%;max-width:42px;border-radius:14px 14px 5px 5px;background:linear-gradient(180deg,${GOLD},${EMERALD})}
.bar-wrap small{display:block;color:#8a7a7d}
.row,.table-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px;border-radius:16px;background:#f8f4ee;margin-bottom:10px}
.row small{display:block;color:#827579;font-weight:800}.row span{color:${EMERALD};font-weight:900}
.table{display:grid;gap:10px}.table-row{grid-template-columns:90px 1fr 160px 120px;margin:0}.table-row b{color:${EMERALD}}
.admin-empty,.admin-error{padding:18px;border-radius:18px;background:#fff;color:${WINE};font-weight:900}.admin-error{color:#b14343}
@media(max-width:900px){.dashboard-grid,.table-row{grid-template-columns:1fr}.admin-hero{flex-direction:column}.admin-hero h1{font-size:34px}}
`;
