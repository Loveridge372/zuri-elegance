import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaTruckFast,
} from "react-icons/fa6";
import { FaCartShopping, FaShieldHalved } from "react-icons/fa6";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WINE = "#50242A";
const GOLD = "#A38560";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find(
          (item) => String(item.id) === String(id)
        );

        setProducts(list);
        setProduct(found || null);

        if (found) {
          const firstImage = getProductImages(found)[0] || "";
          setActiveImage(firstImage);
          setQuantity(Number(found.stock || 0) > 0 ? 1 : 0);
        }
      })
      .catch((err) =>
        console.error("PRODUCT DETAILS ERROR:", err)
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch(`${API_BASE}/products/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch((err) =>
        console.error("PRODUCT REVIEWS ERROR:", err)
      );
  }, [id]);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE}/wishlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setWishlistIds(
          Array.isArray(data)
            ? data.map((item) => item.id)
            : []
        );
      })
      .catch((err) =>
        console.error("PRODUCT WISHLIST ERROR:", err)
      );
  }, [userId]);

  const images = useMemo(
    () => getProductImages(product),
    [product]
  );

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter(
        (item) =>
          item.id !== product.id &&
          item.category === product.category
      )
      .slice(0, 4);
  }, [product, products]);

  const stock = Number(product?.stock || 0);
  const inStock = stock > 0;
  const isWishlisted = product
    ? wishlistIds.includes(product.id)
    : false;

  const discount = Number(product?.discount_percent || 0);
  const originalPrice = Number(product?.price || 0);
  const finalPrice =
    discount > 0
      ? originalPrice * (1 - discount / 100)
      : originalPrice;

  const aiScore = getAiScore(product);
  const averageRating = Number(product?.average_rating || 0);
  const reviewCount = Number(product?.review_count || 0);

  const changeQuantity = (nextQuantity) => {
    if (!inStock) return;

    setQuantity(
      Math.max(1, Math.min(nextQuantity, stock))
    );
  };

  const addToCart = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const res = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: product.id,
        quantity,
      }),
    });

    if (!res.ok) {
      alert("Failed to add to cart");
      return;
    }

    alert("Added to cart");
  };

  const toggleWishlist = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const response = await fetch(
      `${API_BASE}/wishlist/toggle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Wishlist error");
      return;
    }

    setWishlistIds((prev) =>
      data.liked
        ? [...new Set([...prev, product.id])]
        : prev.filter((itemId) => itemId !== product.id)
    );
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!userId) {
      navigate("/login");
      return;
    }

    const response = await fetch(
      `${API_BASE}/products/${product.id}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          rating: reviewRating,
          comment: reviewText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to submit review");
      return;
    }

    setReviewText("");

    const refreshed = await fetch(
      `${API_BASE}/products/${product.id}/reviews`
    );
    const refreshedData = await refreshed.json();
    setReviews(
      Array.isArray(refreshedData) ? refreshedData : []
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="detail-page">
          <style>{css}</style>
          <section className="detail-empty">
            Loading product...
          </section>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="detail-page">
          <style>{css}</style>
          <button
            className="back-btn"
            onClick={() => navigate("/products")}
          >
            <FaArrowLeft /> Back to Shop
          </button>
          <section className="detail-empty">
            Product not found.
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <Navbar />

      <main className="detail-page">
        <button
          className="back-btn"
          onClick={() => navigate("/products")}
        >
          <FaArrowLeft /> Back to Shop
        </button>

        <section className="detail-hero">
          <div>
            <p>ZURI PRODUCT</p>
            <h1>{product.name}</h1>
            <span>
              {product.category || "Luxury Beauty"}
            </span>
          </div>

          <div className="ai-badge">
            <strong>{aiScore}%</strong>
            <small>{getAiLabel(aiScore)}</small>
          </div>
        </section>

        <section className="detail-layout">
          <div className="gallery-panel">
            <div className="main-image-wrap">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                />
              ) : (
                <div className="no-image">
                  ZURI ELEGANCE
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumb-row">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={
                      activeImage === image
                        ? "thumb active"
                        : "thumb"
                    }
                    onClick={() => setActiveImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="info-panel">
            <div className="tag-row">
              {product.promotion_text && (
                <span>{product.promotion_text}</span>
              )}
              {discount > 0 && (
                <span>{discount}% OFF</span>
              )}
              <span
                className={
                  inStock ? "stock good" : "stock bad"
                }
              >
                {inStock
                  ? `${stock} in stock`
                  : "Sold out"}
              </span>
            </div>

            <h2>{product.name}</h2>
            <p className="description">
              {product.description ||
                "Premium beauty product selected for a polished luxury finish."}
            </p>

            <div className="rating-line">
              <FaStar />
              <strong>{averageRating || 0}</strong>
              <span>({reviewCount} reviews)</span>
            </div>

            <div className="price-box">
              {discount > 0 && (
                <span>R {originalPrice.toFixed(2)}</span>
              )}
              <strong>R {finalPrice.toFixed(2)}</strong>
            </div>

            <div className="spec-grid">
              <Spec label="Length" value={product.length} />
              <Spec label="Density" value={product.density} />
              <Spec
                label="Lace Type"
                value={product.lace_type}
              />
            </div>

            <div className="quantity-row">
              <span>Quantity</span>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(quantity - 1)
                  }
                  disabled={!inStock || quantity <= 1}
                >
                  -
                </button>
                <strong>{quantity}</strong>
                <button
                  type="button"
                  onClick={() =>
                    changeQuantity(quantity + 1)
                  }
                  disabled={
                    !inStock || quantity >= stock
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-row">
              <button
                className="cart-btn"
                disabled={!inStock}
                onClick={addToCart}
              >
                <FaCartShopping /> Add To Cart
              </button>

              <button
                className={
                  isWishlisted
                    ? "wish-btn active"
                    : "wish-btn"
                }
                onClick={toggleWishlist}
              >
                {isWishlisted ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            <div className="promise-block">
              <div>
                <FaTruckFast />
                <span>
                  Delivery in 24-48 hours where available.
                </span>
              </div>
              <div>
                <FaShieldHalved />
                <span>
                  Secure checkout with Paystack protection.
                </span>
              </div>
            </div>
          </aside>
        </section>

        <section className="reviews-section">
          <div className="section-head">
            <p>CLIENT NOTES</p>
            <h2>Reviews</h2>
          </div>

          <form
            className="review-form"
            onSubmit={submitReview}
          >
            <label>
              Rating
              <select
                value={reviewRating}
                onChange={(event) =>
                  setReviewRating(
                    Number(event.target.value)
                  )
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} stars
                  </option>
                ))}
              </select>
            </label>

            <label>
              Review
              <textarea
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value)
                }
                placeholder="Share your thoughts..."
              />
            </label>

            <button type="submit">Submit Review</button>
          </form>

          <div className="review-list">
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id}>
                  <div>
                    <strong>
                      {review.customer_name || "Customer"}
                    </strong>
                    <span>
                      <FaStar /> {review.rating}
                    </span>
                  </div>
                  <p>
                    {review.comment ||
                      "No comment provided."}
                  </p>
                </article>
              ))
            ) : (
              <div className="quiet-card">
                No reviews yet.
              </div>
            )}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="related-section">
            <div className="section-head">
              <p>COMPLETE THE LOOK</p>
              <h2>Related Products</h2>
            </div>

            <div className="related-grid">
              {relatedProducts.map((item) => {
                const image = getProductImages(item)[0];

                return (
                  <article
                    key={item.id}
                    onClick={() =>
                      navigate(`/products/${item.id}`)
                    }
                  >
                    {image ? (
                      <img src={image} alt={item.name} />
                    ) : (
                      <div className="related-empty">
                        ZURI
                      </div>
                    )}
                    <div>
                      <p>{item.category || "Beauty"}</p>
                      <h3>{item.name}</h3>
                      <strong>
                        R{" "}
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function Spec({ label, value }) {
  return (
    <div className="spec-card">
      <small>{label}</small>
      <strong>{value || "Not specified"}</strong>
    </div>
  );
}

function getProductImages(product) {
  if (!product) return [];

  return [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
  ].filter(Boolean);
}

function getAiScore(product) {
  const score = Number(product?.ai_match_score);

  if (Number.isFinite(score)) {
    return Math.max(65, Math.min(Math.round(score), 99));
  }

  if (Number(product?.average_rating || 0) >= 4.5) {
    return 94;
  }

  return 88;
}

function getAiLabel(score) {
  if (score >= 97) return "Luxury Match";
  if (score >= 92) return "Glow Approved";
  if (score >= 85) return "Style Pick";
  return "Recommended";
}

const css = `
.detail-page{
  padding:110px 20px 46px;
  min-height:100vh;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    #f8f4ee;
  color:#2b2023;
}

.back-btn{
  border:none;
  background:${WINE};
  color:#fff;
  padding:13px 17px;
  border-radius:16px;
  font-weight:900;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:8px;
  margin-bottom:18px;
}

.detail-hero{
  padding:34px;
  border-radius:30px;
  background:linear-gradient(135deg, ${WINE}, #1f0f12);
  color:#fff;
  margin-bottom:24px;
  box-shadow:0 22px 55px rgba(80,36,42,.25);
  display:flex;
  justify-content:space-between;
  gap:20px;
  align-items:flex-end;
}

.detail-hero p,
.section-head p{
  margin:0;
  color:${GOLD};
  font-weight:900;
  letter-spacing:2px;
  font-size:12px;
}

.detail-hero h1,
.section-head h2{
  margin:8px 0;
  font-family:Georgia,serif;
  font-size:42px;
}

.detail-hero span{
  color:rgba(255,255,255,.75);
  font-weight:800;
}

.ai-badge{
  width:104px;
  height:104px;
  border-radius:999px;
  background:linear-gradient(135deg, ${GOLD}, #F7E7CE);
  color:#2b1114;
  display:grid;
  place-items:center;
  text-align:center;
  box-shadow:0 18px 34px rgba(0,0,0,.2);
}

.ai-badge strong{
  font-size:28px;
  line-height:1;
}

.ai-badge small{
  font-size:10px;
  font-weight:900;
  letter-spacing:.8px;
}

.detail-layout{
  display:grid;
  grid-template-columns:1.08fr .92fr;
  gap:26px;
  align-items:start;
}

.gallery-panel,
.info-panel,
.reviews-section,
.related-section{
  background:#fff;
  border-radius:30px;
  padding:20px;
  box-shadow:0 18px 42px rgba(80,36,42,.12);
  border:1px solid rgba(80,36,42,.08);
}

.main-image-wrap{
  height:620px;
  border-radius:24px;
  background:#f1ebe6;
  display:grid;
  place-items:center;
  overflow:hidden;
}

.main-image-wrap img{
  width:100%;
  height:100%;
  object-fit:contain;
}

.no-image,
.related-empty,
.detail-empty{
  display:grid;
  place-items:center;
  color:${GOLD};
  font-weight:900;
  background:linear-gradient(135deg, ${WINE}, #2b1114);
  border-radius:24px;
  min-height:220px;
}

.thumb-row{
  display:flex;
  gap:12px;
  margin-top:16px;
  overflow-x:auto;
}

.thumb{
  width:86px;
  height:86px;
  border-radius:16px;
  border:2px solid transparent;
  padding:0;
  overflow:hidden;
  opacity:.58;
  cursor:pointer;
  background:#f8f4ee;
}

.thumb.active{
  opacity:1;
  border-color:${WINE};
}

.thumb img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.info-panel{
  padding:28px;
}

.tag-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.tag-row span{
  border-radius:999px;
  padding:7px 12px;
  background:#f8f4ee;
  color:${WINE};
  font-size:11px;
  font-weight:900;
}

.tag-row .good{
  color:#128c56;
}

.tag-row .bad{
  color:#b42318;
}

.info-panel h2{
  font-family:Georgia,serif;
  font-size:34px;
  color:${WINE};
  margin:18px 0 8px;
}

.description{
  color:#75686a;
  line-height:1.7;
  font-weight:700;
}

.rating-line{
  display:flex;
  align-items:center;
  gap:7px;
  color:${GOLD};
  font-weight:900;
}

.rating-line span{
  color:#75686a;
}

.price-box{
  margin:22px 0;
}

.price-box span{
  display:block;
  color:#999;
  text-decoration:line-through;
  font-weight:800;
}

.price-box strong{
  color:${WINE};
  font-size:32px;
  font-weight:900;
}

.spec-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
}

.spec-card{
  padding:14px;
  border-radius:16px;
  background:#f8f4ee;
  border:1px solid #eadfd6;
}

.spec-card small{
  color:${GOLD};
  font-weight:900;
}

.spec-card strong{
  display:block;
  color:${WINE};
  margin-top:6px;
}

.quantity-row{
  margin-top:18px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  font-weight:900;
  color:${WINE};
}

.quantity-row div{
  display:flex;
  align-items:center;
  border:1px solid #eadfd6;
  border-radius:999px;
  overflow:hidden;
}

.quantity-row button{
  width:38px;
  height:38px;
  border:none;
  background:#f8f4ee;
  color:${WINE};
  font-size:18px;
  font-weight:900;
  cursor:pointer;
}

.quantity-row strong{
  min-width:42px;
  text-align:center;
}

.action-row{
  display:grid;
  grid-template-columns:1fr 54px;
  gap:12px;
  margin-top:18px;
}

.cart-btn,
.wish-btn,
.review-form button{
  border:none;
  border-radius:18px;
  padding:16px;
  font-weight:900;
  cursor:pointer;
}

.cart-btn{
  background:linear-gradient(135deg, ${WINE}, #2b1114);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
}

.cart-btn:disabled{
  opacity:.5;
  cursor:not-allowed;
}

.wish-btn{
  background:#f8eaea;
  color:${WINE};
}

.wish-btn.active{
  background:${WINE};
  color:#fff;
}

.promise-block{
  margin-top:18px;
  display:grid;
  gap:10px;
}

.promise-block div{
  display:flex;
  gap:10px;
  align-items:center;
  color:#75686a;
  font-weight:800;
}

.promise-block svg{
  color:${GOLD};
}

.reviews-section,
.related-section{
  margin-top:26px;
}

.review-form{
  display:grid;
  grid-template-columns:160px 1fr auto;
  gap:12px;
  align-items:end;
  margin-top:16px;
}

.review-form label{
  color:${WINE};
  font-weight:900;
  display:grid;
  gap:7px;
}

.review-form select,
.review-form textarea{
  border:1px solid #eadfd6;
  border-radius:16px;
  background:#f8f4ee;
  padding:13px;
  color:#2b2023;
  font-weight:800;
}

.review-form textarea{
  min-height:46px;
  resize:vertical;
}

.review-form button{
  background:${WINE};
  color:#fff;
}

.review-list{
  display:grid;
  gap:12px;
  margin-top:18px;
}

.review-list article,
.quiet-card{
  padding:16px;
  border-radius:18px;
  background:#f8f4ee;
  color:#75686a;
  font-weight:800;
}

.review-list article div{
  display:flex;
  justify-content:space-between;
  gap:10px;
  color:${WINE};
}

.review-list article span{
  color:${GOLD};
}

.related-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
  margin-top:16px;
}

.related-grid article{
  border-radius:20px;
  overflow:hidden;
  background:#f8f4ee;
  cursor:pointer;
  transition:transform .25s ease, box-shadow .25s ease;
}

.related-grid article:hover{
  transform:translateY(-4px);
  box-shadow:0 16px 30px rgba(80,36,42,.14);
}

.related-grid img,
.related-empty{
  width:100%;
  height:180px;
  object-fit:cover;
  border-radius:0;
  min-height:180px;
}

.related-grid article div{
  padding:13px;
}

.related-grid p{
  margin:0;
  color:${GOLD};
  font-size:10px;
  font-weight:900;
  letter-spacing:1px;
  text-transform:uppercase;
}

.related-grid h3{
  color:${WINE};
  font-size:15px;
  margin:7px 0;
}

.related-grid strong{
  color:${WINE};
}

@media (max-width:900px){
  .detail-layout{
    grid-template-columns:1fr;
  }

  .related-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .review-form{
    grid-template-columns:1fr;
  }
}

@media (max-width:700px){
  .detail-page{
    padding:94px 12px 34px;
  }

  .detail-hero{
    padding:24px;
    border-radius:24px;
    align-items:flex-start;
  }

  .detail-hero h1{
    font-size:31px;
  }

  .ai-badge{
    width:82px;
    height:82px;
  }

  .ai-badge strong{
    font-size:22px;
  }

  .gallery-panel,
  .info-panel,
  .reviews-section,
  .related-section{
    border-radius:24px;
    padding:14px;
  }

  .main-image-wrap{
    height:360px;
  }

  .info-panel h2{
    font-size:28px;
  }

  .spec-grid{
    grid-template-columns:1fr;
  }

  .related-grid img,
  .related-empty{
    height:140px;
    min-height:140px;
  }
}
`;
