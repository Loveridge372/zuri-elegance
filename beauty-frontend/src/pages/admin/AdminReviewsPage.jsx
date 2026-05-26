import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [rating, setRating] = useState("All");
  const [message, setMessage] = useState("");

  const load = () => adminFetch("/admin/reviews").then((data) => {
    setReviews(data.reviews || []);
    setStats(data.product_stats || []);
  }).catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => reviews.filter((review) => rating === "All" || Number(review.rating) === Number(rating)),
    [reviews, rating]
  );

  const setApproval = async (id, isApproved) => {
    await adminFetch(`/admin/reviews/${id}/approval`, {
      method: "PATCH",
      body: JSON.stringify({ is_approved: isApproved }),
    });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    await adminFetch(`/admin/reviews/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminLayout title="Reviews Management">
      <style>{css}</style>
      <section className="hero"><p>REVIEWS</p><h1>Product Feedback</h1><span>Approve, hide or delete customer reviews before they show publicly.</span></section>
      {message && <div className="empty">{message}</div>}
      <select value={rating} onChange={(e) => setRating(e.target.value)}><option>All</option>{[5,4,3,2,1].map((n) => <option key={n}>{n}</option>)}</select>
      <section className="grid">
        <div className="panel">
          <h2>Reviews</h2>
          {filtered.map((review) => (
            <article className="review" key={review.id}>
              <strong>{review.product_name}</strong>
              <span>{review.rating} stars - {review.customer_name} - {review.is_approved ? "Approved" : "Pending"}</span>
              <p>{review.comment || "No comment"}</p>
              <div className="actions">
                <button onClick={() => setApproval(review.id, true)}>Approve</button>
                <button onClick={() => setApproval(review.id, false)}>Hide</button>
                <button className="danger" onClick={() => remove(review.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
        <div className="panel"><h2>Approved Ratings</h2>{stats.map((item) => <div className="row" key={item.product_id}><span>{item.product_name}</span><strong>{item.average_rating} ({item.review_count})</strong></div>)}</div>
      </section>
    </AdminLayout>
  );
}

const css = `
.hero,.panel,.empty{background:#fff;border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:24px;box-shadow:0 18px 42px rgba(7,51,44,.09);color:${WINE}}.hero{background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);color:#fff;margin-bottom:16px}.hero p{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px}.hero h1{font-family:Georgia,serif;margin:8px 0}.hero span{color:rgba(255,255,255,.78);font-weight:800}select{width:220px;border:1px solid rgba(7,51,44,.14);border-radius:15px;padding:13px;margin-bottom:16px;font-weight:900}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:16px}.panel h2{font-family:Georgia,serif;color:${WINE};margin-top:0}.review,.row{padding:14px;border-radius:16px;background:#f8f4ee;margin-bottom:10px}.review strong,.review span{display:block}.review span{color:${EMERALD};font-weight:900}.review p{color:#5c5053;font-weight:800}.actions{display:flex;flex-wrap:wrap;gap:8px}.review button{border:none;border-radius:12px;padding:10px 12px;background:${EMERALD};color:#fff;font-weight:900;cursor:pointer}.review .danger{background:#b14343}.row{display:flex;justify-content:space-between}.row strong{color:${EMERALD}}
@media(max-width:900px){.grid{grid-template-columns:1fr}select{width:100%}}
`;
