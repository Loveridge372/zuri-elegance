import { useEffect, useMemo, useState } from "react";
import { FaFloppyDisk, FaGift, FaMagnifyingGlass, FaPlus } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";
const STATUSES = ["Paid", "Delivered", "Processing"];

const emptyAdjustment = {
  user_id: "",
  points: "",
  reason: "",
};

export default function AdminRewardsPage() {
  const [settings, setSettings] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = () =>
    adminFetch("/admin/rewards")
      .then((data) => {
        setSettings(data.settings || {});
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      })
      .catch((err) => setMessage(err.message));

  useEffect(() => {
    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return customers;

    return customers.filter((customer) => (
      `${customer.full_name || ""} ${customer.email || ""} ${customer.tier || ""}`
        .toLowerCase()
        .includes(text)
    ));
  }, [customers, search]);

  const updateSetting = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const toggleStatus = (status) => {
    const selected = settings?.eligible_statuses || [];
    updateSetting(
      "eligible_statuses",
      selected.includes(status)
        ? selected.filter((item) => item !== status)
        : [...selected, status]
    );
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      const data = await adminFetch("/admin/rewards", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(data.settings);
      setMessage("Reward settings saved.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();
    try {
      await adminFetch("/admin/rewards/adjustments", {
        method: "POST",
        body: JSON.stringify(adjustment),
      });
      setAdjustment(emptyAdjustment);
      setMessage("Customer points updated.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AdminLayout title="Rewards Management">
      <style>{css}</style>

      <section className="hero">
        <div>
          <p>REWARDS</p>
          <h1>Loyalty Control Center</h1>
          <span>Control how customers earn points, unlock rewards and move between tiers.</span>
        </div>
        <div className="hero-stat">
          <FaGift />
          <strong>{customers.reduce((sum, customer) => sum + Number(customer.points_balance || 0), 0)}</strong>
          <span>Total Active Points</span>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="grid">
        <form className="panel settings-panel" onSubmit={saveSettings}>
          <div className="panel-head">
            <div>
              <p>RULES</p>
              <h2>Reward Settings</h2>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={!!settings?.is_enabled}
                onChange={(e) => updateSetting("is_enabled", e.target.checked)}
              />
              Enabled
            </label>
          </div>

          <div className="fields">
            <Field label="Points per Rand" value={settings?.points_per_rand ?? ""} onChange={(value) => updateSetting("points_per_rand", value)} step="0.01" />
            <Field label="Bonus per Order" value={settings?.points_per_order ?? ""} onChange={(value) => updateSetting("points_per_order", value)} />
            <Field label="Points per Voucher" value={settings?.reward_threshold ?? ""} onChange={(value) => updateSetting("reward_threshold", value)} />
            <Field label="Voucher Value" value={settings?.voucher_value ?? ""} onChange={(value) => updateSetting("voucher_value", value)} />
            <Field label="Minimum Order Total" value={settings?.min_order_total ?? ""} onChange={(value) => updateSetting("min_order_total", value)} />
          </div>

          <div className="status-box">
            <span>Eligible order statuses</span>
            <div>
              {STATUSES.map((status) => (
                <label key={status}>
                  <input
                    type="checkbox"
                    checked={(settings?.eligible_statuses || []).includes(status)}
                    onChange={() => toggleStatus(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className="tier-grid">
            <Field label="Glow Tier Points" value={settings?.glow_tier_points ?? ""} onChange={(value) => updateSetting("glow_tier_points", value)} />
            <Field label="Gold Tier Points" value={settings?.gold_tier_points ?? ""} onChange={(value) => updateSetting("gold_tier_points", value)} />
            <Field label="Diamond Tier Points" value={settings?.diamond_tier_points ?? ""} onChange={(value) => updateSetting("diamond_tier_points", value)} />
          </div>

          <button className="primary"><FaFloppyDisk /> Save Rules</button>
        </form>

        <form className="panel" onSubmit={saveAdjustment}>
          <div className="panel-head">
            <div>
              <p>MANUAL CONTROL</p>
              <h2>Adjust Customer Points</h2>
            </div>
          </div>

          <select
            value={adjustment.user_id}
            onChange={(e) => setAdjustment({ ...adjustment, user_id: e.target.value })}
          >
            <option value="">Choose customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name || customer.email} - {customer.points_balance} pts
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Points, e.g. 50 or -25"
            value={adjustment.points}
            onChange={(e) => setAdjustment({ ...adjustment, points: e.target.value })}
          />
          <textarea
            placeholder="Reason"
            value={adjustment.reason}
            onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
          />

          <button className="primary"><FaPlus /> Apply Adjustment</button>
        </form>
      </section>

      <section className="panel customers-panel">
        <div className="customers-head">
          <div>
            <p>CUSTOMERS</p>
            <h2>Reward Balances</h2>
          </div>
          <div className="search">
            <FaMagnifyingGlass />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." />
          </div>
        </div>

        <div className="customer-list">
          {filteredCustomers.length ? filteredCustomers.map((customer) => (
            <article className="customer" key={customer.id}>
              <div>
                <h3>{customer.full_name || "Unnamed Customer"}</h3>
                <span>{customer.email}</span>
              </div>
              <Stat label="Tier" value={customer.tier} />
              <Stat label="Balance" value={`${customer.points_balance} pts`} />
              <Stat label="Adjustments" value={`${customer.adjustment_points} pts`} />
              <Stat label="Rewards" value={money(customer.voucher_value)} />
              <Stat label="Spend" value={money(customer.lifetime_spend)} />
            </article>
          )) : <div className="notice">No customers found.</div>}
        </div>
      </section>
    </AdminLayout>
  );
}

function Field({ label, value, onChange, step = "1" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const css = `
.hero,.panel,.notice{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:24px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}
.hero{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:16px;background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff}
.hero p,.panel-head p,.customers-head p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px;font-size:12px}
.hero h1,.panel h2{font-family:Georgia,serif;margin:8px 0;color:inherit}
.hero span{color:rgba(255,255,255,.78);font-weight:800}
.hero-stat{min-width:190px;border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:16px;background:rgba(255,255,255,.08)}
.hero-stat svg{color:${GOLD};font-size:24px}
.hero-stat strong,.hero-stat span{display:block}
.hero-stat strong{font-size:34px;font-family:Georgia,serif}
.notice{margin-bottom:14px;background:#f8f4ee;font-weight:900}
.grid{display:grid;grid-template-columns:1.4fr .8fr;gap:16px;margin-bottom:16px}
.panel-head,.customers-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:16px}
.panel h2,.customers-head h2{color:${WINE};margin:5px 0 0}
.fields,.tier-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.tier-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px}
.field span,.status-box>span{display:block;color:${WINE};font-size:12px;font-weight:900;margin-bottom:6px}
input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(7,51,44,.14);border-radius:14px;background:#fffaf5;padding:12px;margin-bottom:10px;font-weight:800;color:#1f1719}
textarea{min-height:120px;resize:vertical}
.switch,.status-box label{display:flex;align-items:center;gap:8px;font-weight:900;color:${WINE}}
.switch input,.status-box input{width:auto;margin:0}
.status-box{border:1px solid rgba(80,36,42,.08);border-radius:18px;padding:14px;background:#fffaf5;margin-top:12px}
.status-box div{display:flex;gap:10px;flex-wrap:wrap}
.primary{border:none;border-radius:14px;padding:13px 16px;background:${EMERALD};color:#fff;font-weight:900;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
.customers-panel{padding-bottom:16px}
.search{display:flex;align-items:center;gap:8px;min-width:260px;border:1px solid rgba(7,51,44,.12);border-radius:15px;background:#fffaf5;padding:0 12px}
.search input{border:none;background:transparent;margin:0;padding:12px 0;outline:none}
.customer-list{display:grid;gap:10px}
.customer{display:grid;grid-template-columns:1.4fr repeat(5,1fr);gap:12px;align-items:center;border:1px solid rgba(80,36,42,.08);border-radius:18px;padding:14px;background:#fffaf5}
.customer h3{margin:0;color:${WINE};font-family:Georgia,serif}
.customer span,.stat span{display:block;color:#75686a;font-size:12px;font-weight:900}
.stat strong{display:block;color:${EMERALD};font-weight:900}
@media(max-width:1100px){.grid,.fields,.tier-grid,.customer{grid-template-columns:1fr}.hero,.panel-head,.customers-head{flex-direction:column}.search{width:100%;min-width:0}}
`;
