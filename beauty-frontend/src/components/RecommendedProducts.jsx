
import { useEffect, useRef, useState } from "react";
import {
  FaCrown,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaHeart,
  FaArrowRight,
  FaTimes,
  FaStar,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const WINE = "#50242A";
const GOLD = "#A38560";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function RecommendedProducts() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const rowRef = useRef(null);

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState([]);
  const [selectedProduct, setSelectedProduct] =
    useState(null);
  const [selectedImage, setSelectedImage] =
    useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/recommendations/${userId}`)
      .then((res) => res.json())

      .then((data) => {
        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          setProducts(data);
        }
      })

      .catch((err) =>
        console.error(
          "RECOMMENDATIONS ERROR:",
          err
        )
      )

      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE}/wishlist/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const ids = Array.isArray(data)
          ? data.map((item) => item.id)
          : [];

        setLikedIds(ids);
      })
      .catch((err) =>
        console.error(
          "RECOMMENDATIONS WISHLIST ERROR:",
          err
        )
      );
  }, [userId]);

  const scrollRow = (direction) => {
    if (!rowRef.current) return;

    rowRef.current.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const toggleLike = async (productId) => {
    try {
      if (!userId) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(
        `${API_BASE}/wishlist/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            product_id: productId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Wishlist error");
        return;
      }

      setLikedIds((prev) =>
        data.liked
          ? [...new Set([...prev, productId])]
          : prev.filter((id) => id !== productId)
      );
    } catch (err) {
      console.error(
        "TOGGLE RECOMMENDATION WISHLIST ERROR:",
        err
      );
    }
  };

  const handleAdd = async (product) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        alert("Failed to add to cart");
        return;
      }
    } catch (err) {
      console.error("RECOMMENDATION CART ERROR:", err);
      alert("Failed to add to cart");
      return;
    }

    addToCart({
      ...product,
      quantity: 1,
    });

    alert("Added to cart ✅");
  };

  const getFallbackMatchScore = (index) => {
    if (index === 0) return 98;

    if (index === 1) return 95;

    if (index === 2) return 92;

    return 88;
  };

  const getMatchScore = (product, index) => {
    const rawScore =
      product?.ai_match_score ??
      product?.match_score ??
      product?.score;

    const score = Number.parseFloat(rawScore);

    if (Number.isFinite(score)) {
      return Math.max(
        65,
        Math.min(Math.round(score), 99)
      );
    }

    return getFallbackMatchScore(index);
  };

  const getMatchLabel = (score) => {
    if (score >= 97) return "Luxury Match";

    if (score >= 92) return "Glow Approved";

    if (score >= 85) return "Trending Pick";

    return "Recommended";
  };

  const getAiBadge = (score) => {
    if (score >= 97) return "PERFECT MATCH";

    if (score >= 92) return "GLOW APPROVED";

    if (score >= 85) return "STYLE PICK";

    return "AI PICK";
  };

  const getAiReason = (product) => {
    if (product?.ai_match_reason) {
      return product.ai_match_reason;
    }

    const text = `
      ${product.name || ""}
      ${product.category || ""}
      ${product.description || ""}
    `.toLowerCase();

    if (text.includes("wig")) {
      return "Chosen for your premium hair profile.";
    }

    if (text.includes("closure")) {
      return "Recommended for a polished beauty finish.";
    }

    if (
      text.includes("skin") ||
      text.includes("glow")
    ) {
      return "Matched to your glow-focused beauty profile.";
    }

    return "Selected from your latest AI beauty analysis.";
  };

  const getBadgeStyle = (score) => {
    if (score >= 95) {
      return {
        background: `linear-gradient(135deg, ${GOLD}, #F7E7CE)`,
        color: "#2b1114",
      };
    }

    if (score >= 90) {
      return {
        background: `linear-gradient(135deg, ${WINE}, #7A3B46)`,
        color: "#fff",
      };
    }

    return {
      background:
        "linear-gradient(135deg,#d8d0c8,#f4efe8)",
      color: "#2b2023",
    };
  };

  const getCardGlow = (score) => {
    if (score >= 95) {
      return {
        boxShadow:
          "0 22px 55px rgba(163,133,96,.34)",
      };
    }

    if (score >= 90) {
      return {
        boxShadow:
          "0 18px 45px rgba(80,36,42,.24)",
      };
    }

    return {};
  };

  const getProductImage = (product) =>
    product?.image_url ||
    product?.image_url_2 ||
    product?.image_url_3 ||
    product?.image_url_4 ||
    "";

  const getProductImages = (product) =>
    [
      product?.image_url,
      product?.image_url_2,
      product?.image_url_3,
      product?.image_url_4,
    ].filter(Boolean);

  const closePreview = () => {
    setSelectedProduct(null);
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <section style={styles.section}>
        <p style={styles.kicker}>
          <FaCrown />
          AI BEAUTY PICKS
        </p>

        <h2 style={styles.title}>
          Recommended For You
        </h2>

        <div style={styles.row}>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              style={styles.skeletonCard}
              className="skeleton-card"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!loading && !products.length) {
    return (
      <section style={styles.emptySection}>
        <FaCrown style={styles.emptyIcon} />

        <h2 style={styles.emptyTitle}>
          Unlock AI Recommendations
        </h2>

        <p style={styles.emptyText}>
          Run your AI Beauty Match to unlock
          personalized beauty picks.
        </p>

        <button
          style={styles.emptyBtn}
          onClick={() =>
            navigate("/beauty-analysis")
          }
        >
          Start AI Beauty Match
        </button>
      </section>
    );
  }

  return (
    <>
      <style>{css}</style>

      <section
        className="recommend-section"
        style={styles.section}
      >
        <div style={styles.header}>
          <div>
            <p style={styles.kicker}>
              <FaCrown />
              AI BEAUTY PICKS
            </p>

            <h2 style={styles.title}>
              Recommended For You
            </h2>

            <span style={styles.subtitle}>
              Based on your latest AI beauty
              profile.
            </span>
          </div>

          <div style={styles.controls}>
            <button
              style={styles.arrow}
              onClick={() =>
                scrollRow("left")
              }
            >
              <FaChevronLeft />
            </button>

            <button
              style={styles.arrow}
              onClick={() =>
                scrollRow("right")
              }
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div
          ref={rowRef}
          className="recommend-row"
          style={styles.row}
        >
          {products.map((product, index) => {
            const image = getProductImage(product);

            const price = Number(
              product.price || 0
            );

            const rating = Number(
              product.average_rating || 0
            );

            const reviewCount = Number(
              product.review_count || 0
            );

            const isLiked =
              likedIds.includes(product.id);

            const matchScore =
              getMatchScore(product, index);

            return (
              <article
                key={product.id}
                className="recommend-card"
                style={{
                  ...styles.card,
                  ...getCardGlow(matchScore),
                }}
              >
                <div
                  className="recommend-image-wrap"
                  style={styles.imageWrap}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={product.name}
                      style={styles.image}
                    />
                  ) : (
                    <div style={styles.noImage}>
                      ZURI
                    </div>
                  )}

                  <span
                    style={{
                      ...styles.aiBadge,
                      ...getBadgeStyle(
                        matchScore
                      ),
                    }}
                  >
                    {getAiBadge(matchScore)}
                  </span>

                  <button
                    style={{
                      ...styles.heart,
                      ...(isLiked
                        ? styles.heartActive
                        : {}),
                    }}
                    onClick={() =>
                      toggleLike(product.id)
                    }
                  >
                    <FaHeart />
                  </button>

                  <button
                    type="button"
                    className="recommend-quick-view"
                    onClick={() =>
                      setSelectedProduct({
                        ...product,
                        recommendIndex: index,
                      })
                    }
                  >
                    Quick View
                    <FaArrowRight />
                  </button>
                </div>

                <div style={styles.body}>
                  <p style={styles.category}>
                    {product.category || "Beauty"}
                  </p>

                  <h3 style={styles.name}>
                    {product.name}
                  </h3>

                  <p style={styles.reason}>
                    {getAiReason(product)}
                  </p>

                  <div style={styles.ratingRow}>
                    <span>
                      <FaStar />
                      {" "}
                      {rating || 0}
                    </span>

                    <small>
                      ({reviewCount})
                    </small>
                  </div>

                  <div
                    className="recommend-confidence"
                    style={styles.confidence}
                  >
                    <div
                      style={
                        styles.confidenceLeft
                      }
                    >
                      <div
                        style={{
                          ...styles.matchRing,
                          background: `conic-gradient(
                            ${GOLD}
                            ${
                              matchScore * 3.6
                            }deg,
                            rgba(255,255,255,.18) 0deg
                          )`,
                        }}
                      >
                        <div
                          style={
                            styles.matchRingInner
                          }
                        >
                          {matchScore}%
                        </div>
                      </div>

                      <span>
                        AI Match
                      </span>
                    </div>

                    <strong>
                      {getMatchLabel(
                        matchScore
                      )}
                    </strong>
                  </div>

                  <div
                    className="recommend-bottom"
                    style={styles.bottom}
                  >
                    <strong style={styles.price}>
                      R {price.toFixed(2)}
                    </strong>

                    <div
                      className="recommend-actions"
                      style={styles.actions}
                    >
                      <button
                        style={styles.viewBtn}
                        onClick={() =>
                          setSelectedProduct(
                            {
                              ...product,
                              recommendIndex:
                                index,
                            }
                          )
                        }
                      >
                        View
                        <FaArrowRight />
                      </button>

                      <button
                        className="recommend-add-btn"
                        style={styles.btn}
                        onClick={() =>
                          handleAdd(product)
                        }
                      >
                        <FaShoppingCart />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedProduct && (
        <div
          className="previewOverlay"
          onClick={closePreview}
        >
          <div
            className="previewModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="previewClose"
              onClick={closePreview}
            >
              <FaTimes />
            </button>

            <div className="previewImage">
              {getProductImages(selectedProduct)
                .length ? (
                <div className="previewImageGrid">
                  {getProductImages(
                    selectedProduct
                  ).map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      className="previewImageTile"
                      onClick={() =>
                        setSelectedImage(image)
                      }
                    >
                      <img
                        src={image}
                        alt={`${selectedProduct.name} ${
                          index + 1
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <span>ZURI</span>
              )}
            </div>

            <div className="previewInfo">
              <p>AI BEAUTY MATCH</p>

              <h2>
                {selectedProduct.name}
              </h2>

              <span>
                {selectedProduct.category ||
                  "Beauty"}
              </span>

              <div className="previewAiMeta">
                <div>
                  {getMatchScore(
                    selectedProduct,
                    selectedProduct
                      .recommendIndex || 0
                  )}
                  %
                </div>

                <section>
                  <strong>
                    {getMatchLabel(
                      getMatchScore(
                        selectedProduct,
                        selectedProduct
                          .recommendIndex || 0
                      )
                    )}
                  </strong>

                  <small>
                    {getAiBadge(
                      getMatchScore(
                        selectedProduct,
                        selectedProduct
                          .recommendIndex || 0
                      )
                    )}
                  </small>
                </section>
              </div>

              <strong>
                R{" "}
                {Number(
                  selectedProduct.price || 0
                ).toFixed(2)}
              </strong>

              <div
                style={{
                  marginTop: "18px",
                  color: "#666",
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}
              >
                {getAiReason(selectedProduct)}
              </div>

              <button
                onClick={() => {
                  handleAdd(
                    selectedProduct
                  );

                  closePreview();
                }}
              >
                <FaShoppingCart />
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fullImageOverlay"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="fullImageClose"
            onClick={() => setSelectedImage(null)}
          >
            <FaTimes />
          </button>

          <img
            src={selectedImage}
            alt={selectedProduct?.name || "Product"}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

const styles = {
  section: {
    margin: "28px 0",
    padding: "28px",
    borderRadius: "32px",
    background: `
      radial-gradient(circle at top right, rgba(163,133,96,.26), transparent 35%),
      linear-gradient(135deg, #2A0F16, ${WINE}, #241014)
    `,
    color: "#fff",
    boxShadow:
      "0 24px 60px rgba(80,36,42,.26)",
    overflow: "hidden",
  },

  emptySection: {
    margin: "28px 0",
    padding: "50px 24px",
    borderRadius: "30px",
    textAlign: "center",
    background: `
      radial-gradient(circle at top right, rgba(163,133,96,.26), transparent 35%),
      linear-gradient(135deg, #2A0F16, ${WINE}, #241014)
    `,
    color: "#fff",
  },

  emptyIcon: {
    fontSize: "48px",
    color: GOLD,
    marginBottom: "16px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "32px",
    fontFamily: "Georgia, serif",
  },

  emptyText: {
    color: "rgba(255,255,255,.74)",
    maxWidth: "500px",
    margin: "12px auto 20px",
    lineHeight: 1.6,
    fontWeight: 700,
  },

  emptyBtn: {
    border: "none",
    borderRadius: "16px",
    padding: "14px 22px",
    background: `linear-gradient(135deg, ${GOLD}, #D8B878)`,
    color: "#2b1114",
    fontWeight: 900,
    cursor: "pointer",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-end",
    marginBottom: "20px",
  },

  kicker: {
    margin: 0,
    color: GOLD,
    fontWeight: 900,
    letterSpacing: "1.7px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  title: {
    margin: "8px 0 5px",
    fontFamily: "Georgia, serif",
    fontSize: "34px",
    lineHeight: 1,
  },

  subtitle: {
    color: "rgba(255,255,255,.72)",
    fontWeight: 700,
    fontSize: "13px",
  },

  controls: {
    display: "flex",
    gap: "10px",
  },

  arrow: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border:
      "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.12)",
    color: "#fff",
    cursor: "pointer",
  },

  row: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    overflowY: "hidden",
    scrollSnapType: "x mandatory",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
    paddingBottom: "10px",
  },

  card: {
    flex: "0 0 clamp(220px, 78vw, 260px)",
    minWidth:
      "clamp(220px, 78vw, 260px)",
    maxWidth: "260px",
    boxSizing: "border-box",
    background: "rgba(255,255,255,.94)",
    color: "#2b2023",
    borderRadius: "24px",
    overflow: "hidden",
    border:
      "1px solid rgba(255,255,255,.24)",
    scrollSnapAlign: "start",
  },

  imageWrap: {
    height: "175px",
    position: "relative",
    overflow: "hidden",
    background: "#f8f4ee",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: ".45s ease",
  },

  noImage: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: WINE,
    color: GOLD,
    fontWeight: 900,
  },

  aiBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: ".6px",
  },

  heart: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "none",
    background: "#fff",
    color: WINE,
    cursor: "pointer",
  },

  heartActive: {
    background: WINE,
    color: "#fff",
  },

  body: {
    padding: "14px",
  },

  category: {
    margin: 0,
    color: GOLD,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },

  name: {
    margin: "7px 0 5px",
    fontSize: "15px",
    lineHeight: 1.2,
    fontWeight: 900,
  },

  reason: {
    margin: "0 0 9px",
    color: WINE,
    fontSize: "11px",
    fontWeight: 800,
    opacity: 0.72,
    lineHeight: 1.4,
  },

  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: GOLD,
    fontSize: "12px",
    fontWeight: 900,
    marginBottom: "10px",
  },

  confidence: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    borderRadius: "14px",
    background: "#f8f4ee",
    color: WINE,
    marginBottom: "12px",
  },

  confidenceLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px",
    fontWeight: 900,
  },

  matchRing: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
  },

  matchRingInner: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "10px",
    fontWeight: 900,
    color: WINE,
  },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  price: {
    color: WINE,
    fontSize: "16px",
    flex: "1 1 auto",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  viewBtn: {
    border: `1px solid ${WINE}`,
    borderRadius: "13px",
    padding: "9px 11px",
    background: "#fff",
    color: WINE,
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
  },

  btn: {
    border: "none",
    borderRadius: "13px",
    padding: "9px 10px",
    background: WINE,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "12px",
  },

  skeletonCard: {
    flex: "0 0 clamp(220px, 78vw, 260px)",
    minWidth:
      "clamp(220px, 78vw, 260px)",
    maxWidth: "260px",
    height: "315px",
    borderRadius: "24px",
    background:
      "linear-gradient(90deg, rgba(255,255,255,.12), rgba(255,255,255,.25), rgba(255,255,255,.12))",
  },
};

const css = `
.recommend-row::-webkit-scrollbar{
  display:none;
}

.recommend-row{
  scrollbar-width:none;
}

.recommend-card{
  transition:all .32s ease;
  will-change:transform;
}

.recommend-card:hover{
  transform:translateY(-8px);
}

.recommend-card:hover img{
  transform:scale(1.06);
}

.recommend-image-wrap::before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(
    180deg,
    transparent 25%,
    rgba(43,17,20,.56)
  );
  opacity:0;
  transition:opacity .32s ease;
  pointer-events:none;
  z-index:1;
}

.recommend-image-wrap::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(
      115deg,
      transparent 0%,
      rgba(255,255,255,.08) 36%,
      rgba(247,231,206,.42) 48%,
      rgba(255,255,255,.1) 60%,
      transparent 100%
    );
  transform:translateX(-120%);
  transition:transform .75s ease;
  pointer-events:none;
  z-index:2;
}

.recommend-card:hover .recommend-image-wrap::before{
  opacity:1;
}

.recommend-card:hover .recommend-image-wrap::after{
  transform:translateX(120%);
}

.recommend-image-wrap > span,
.recommend-image-wrap > button{
  z-index:3;
}

.recommend-quick-view{
  position:absolute;
  left:14px;
  right:14px;
  bottom:14px;
  border:none;
  border-radius:14px;
  padding:10px 12px;
  background:rgba(255,255,255,.92);
  color:#50242A;
  font-weight:900;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  opacity:0;
  transform:translateY(12px);
  transition:all .28s ease;
  box-shadow:0 14px 26px rgba(0,0,0,.18);
}

.recommend-card:hover .recommend-quick-view{
  opacity:1;
  transform:translateY(0);
}

.recommend-quick-view:focus-visible{
  opacity:1;
  transform:translateY(0);
  outline:3px solid rgba(163,133,96,.55);
  outline-offset:2px;
}

.recommend-actions button,
.previewInfo button{
  transition:transform .22s ease, box-shadow .22s ease;
}

.recommend-actions button:hover,
.previewInfo button:hover{
  transform:translateY(-2px);
  box-shadow:0 12px 24px rgba(80,36,42,.18);
}

.recommend-add-btn{
  position:relative;
  overflow:hidden;
}

.recommend-add-btn::after{
  content:"";
  position:absolute;
  top:-40%;
  bottom:-40%;
  width:48%;
  left:-70%;
  background:linear-gradient(
    115deg,
    transparent,
    rgba(255,255,255,.5),
    transparent
  );
  transform:skewX(-22deg);
  transition:left .65s ease;
  pointer-events:none;
}

.recommend-add-btn:hover::after{
  left:125%;
}

.previewOverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.65);
  display:grid;
  place-items:center;
  z-index:99999;
  padding:18px;
}

.previewModal{
  width:min(780px,96vw);
  background:#fff;
  border-radius:28px;
  overflow:hidden;
  display:grid;
  grid-template-columns:1fr 1fr;
  position:relative;
}

.previewClose{
  position:absolute;
  top:14px;
  right:14px;
  z-index:2;
  border:none;
  border-radius:999px;
  width:36px;
  height:36px;
  background:#fff;
  color:#50242A;
  font-size:20px;
  cursor:pointer;
}

.previewImage{
  min-height:420px;
  background:#50242A;
  display:grid;
  place-items:center;
  overflow:hidden;
}

.previewImageGrid{
  width:100%;
  height:100%;
  min-height:420px;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:5px;
  padding:5px;
  box-sizing:border-box;
}

.previewImageTile{
  border:none;
  padding:0;
  background:transparent;
  cursor:zoom-in;
  overflow:hidden;
  border-radius:14px;
}

.previewImageTile img{
  width:100%;
  height:100%;
  object-fit:cover;
  min-height:0;
  transition:transform .28s ease;
}

.previewImageTile:hover img{
  transform:scale(1.04);
}

.previewImageTile:only-child{
  grid-column:1 / -1;
}

.previewImage span{
  color:#A38560;
  font-weight:900;
  letter-spacing:2px;
}

.previewInfo{
  padding:38px;
  display:flex;
  flex-direction:column;
  justify-content:center;
}

.previewInfo p{
  color:#A38560;
  font-weight:900;
  letter-spacing:2px;
  font-size:12px;
}

.previewInfo h2{
  font-family:Georgia,serif;
  color:#50242A;
  font-size:34px;
  margin:8px 0;
}

.previewInfo span{
  color:#777;
  font-weight:800;
}

.previewAiMeta{
  margin-top:18px;
  padding:13px;
  border-radius:18px;
  background:#f8f4ee;
  display:flex;
  align-items:center;
  gap:13px;
  color:#50242A;
}

.previewAiMeta > div{
  width:54px;
  height:54px;
  border-radius:999px;
  background:linear-gradient(135deg,#A38560,#F7E7CE);
  display:grid;
  place-items:center;
  font-weight:900;
  color:#2b1114;
}

.previewAiMeta section{
  display:flex;
  flex-direction:column;
  gap:4px;
}

.previewAiMeta section strong{
  margin:0;
  font-size:16px;
  color:#50242A;
}

.previewAiMeta small{
  color:#A38560;
  font-size:10px;
  font-weight:900;
  letter-spacing:1.2px;
}

.previewInfo strong{
  margin:24px 0;
  color:#50242A;
  font-size:24px;
}

.previewInfo button{
  margin-top:24px;
  border:none;
  border-radius:16px;
  padding:14px;
  background:#50242A;
  color:#fff;
  font-weight:900;
  cursor:pointer;
}

.fullImageOverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.86);
  display:grid;
  place-items:center;
  z-index:100000;
  padding:22px;
}

.fullImageOverlay img{
  max-width:min(1100px,96vw);
  max-height:92vh;
  object-fit:contain;
  border-radius:22px;
  box-shadow:0 26px 80px rgba(0,0,0,.42);
}

.fullImageClose{
  position:fixed;
  top:18px;
  right:18px;
  z-index:100001;
  border:none;
  border-radius:999px;
  width:42px;
  height:42px;
  background:#fff;
  color:#50242A;
  font-size:22px;
  cursor:pointer;
  display:grid;
  place-items:center;
}

.skeleton-card{
  animation:shimmer 1.3s infinite linear;
}

@keyframes shimmer{
  0%{
    opacity:.55;
  }

  50%{
    opacity:1;
  }

  100%{
    opacity:.55;
  }
}

@media (max-width:700px){

  .recommend-section{
    padding:22px 12px !important;
  }

  .recommend-section h2{
    font-size:30px !important;
    line-height:1.05 !important;
  }

  .recommend-section > div:first-child{
    align-items:flex-start !important;
  }

  .recommend-section > div:first-child > div:last-child{
    display:none !important;
  }

  .recommend-row{
    display:grid !important;
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    gap:12px !important;
    overflow:visible !important;
    scroll-snap-type:none !important;
  }

  .recommend-card{
    width:100% !important;
    min-width:0 !important;
    max-width:none !important;
    flex:none !important;
  }

  .recommend-card:hover{
    transform:none;
  }

  .recommend-card .recommend-image-wrap{
    height:145px !important;
  }

  .recommend-quick-view{
    display:none !important;
  }

  .recommend-card h3{
    font-size:14px !important;
  }

  .recommend-confidence{
    align-items:flex-start !important;
    flex-direction:column !important;
  }

  .recommend-confidence strong{
    font-size:11px !important;
  }

  .recommend-bottom{
    align-items:flex-start !important;
    flex-direction:column !important;
  }

  .recommend-actions{
    width:100% !important;
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
  }

  .recommend-card button{
    min-width:0;
  }

  .previewModal{
    grid-template-columns:1fr;
  }

  .previewImage{
    min-height:280px;
  }

  .previewImageGrid{
    min-height:280px;
  }
}
`;
