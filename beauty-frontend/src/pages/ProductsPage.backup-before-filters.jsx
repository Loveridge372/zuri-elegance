import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaEye,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
} from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import HeroSlider from "../components/HeroSlider";
import { useCart } from "../context/CartContext";

const WINE = "#50242A";
const GOLD = "#A38560";
const API_BASE = "http://127.0.0.1:5000";

const categories = [
  { label: "All", terms: [] },
  { label: "Wigs", terms: ["wig", "wigs"] },
  { label: "Bundles", terms: ["bundle", "bundles"] },
  { label: "Closures", terms: ["closure", "closures"] },
  { label: "Frontals", terms: ["frontal", "frontals"] },
  { label: "Beauty", terms: ["beauty", "makeup", "skincare", "skin care", "hair care"] },
  { label: "Accessories", terms: ["accessory", "accessories", "bonnet", "brush", "tool"] },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [dealOnly, setDealOnly] = useState(false);

  const featuredRef = useRef(null);
  const filteredRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("PRODUCTS ERROR:", err);
        setProducts([]);
      });
  }, []);

  const searchFiltered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return products.filter((p) => {
      const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [products, search]);

  const categoryFiltered = useMemo(() => {
    const selected = categories.find((c) => c.label === activeCategory);
    if (!selected || activeCategory === "All") return searchFiltered;

    return searchFiltered.filter((p) => {
      const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();
      return selected.terms.some((term) => text.includes(term));
    });
  }, [searchFiltered, activeCategory]);

  const featuredProducts = searchFiltered.slice(0, 12);

  const loadCart = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user?.id) return;

  const res = await fetch(`${API_BASE}/cart/${user.id}`);
  const data = await res.json();
  setCartItems(Array.isArray(data) ? data : []);
    };

  const scrollRow = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: dir === "left" ? -650 : 650,
      behavior: "smooth",
    });
  };

  return (
    <>
      <style>{css}</style>

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <main style={styles.page}>
        <HeroSlider />

        <section style={styles.productsSection}>
          <div style={styles.productsTop}>
            <div>
              <p style={styles.kicker}>SHOP ZURI</p>
              <h2 style={styles.sectionTitle}>Shop The Edit</h2>
            </div>

            <input
              placeholder="Search luxury products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.search}
            />
          </div>

          <CarouselControls rowRef={featuredRef} scrollRow={scrollRow} />

          <ProductRow
            rowRef={featuredRef}
            products={featuredProducts}
            openQuickView={setQuickView}
            addToCart={addToCart}
          />
        </section>

        <section style={styles.boutiqueNavbar} className="shimmer">
          <div style={styles.crown}>
            <FaCrown />
          </div>

          <p style={styles.bannerKicker}>ZURI COLLECTION</p>
          <h2 style={styles.bannerTitle}>Boutique Collection</h2>
          <p style={styles.bannerText}>
            Choose your category and shop your signature look.
          </p>

          <div style={styles.categoryMenu}>
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={
                  activeCategory === cat.label
                    ? styles.categoryBtnActive
                    : styles.categoryBtn
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section style={styles.productsSection}>
          <div style={styles.productsTop}>
            <div>
              <p style={styles.kicker}>FILTERED EDIT</p>
              <h2 style={styles.sectionTitle}>{activeCategory} Products</h2>
            </div>

            <p style={styles.resultCount}>
              {categoryFiltered.length} item{categoryFiltered.length === 1 ? "" : "s"}
            </p>
          </div>

          <CarouselControls rowRef={filteredRef} scrollRow={scrollRow} />

          {categoryFiltered.length > 0 ? (
            <ProductRow
              rowRef={filteredRef}
              products={categoryFiltered}
              openQuickView={setQuickView}
              addToCart={addToCart}
            />
          ) : (
            <div style={styles.empty}>No products found for {activeCategory}.</div>
          )}
        </section>
        
      </main>

      {quickView && (
        <QuickView
          product={quickView}
          close={() => setQuickView(null)}
          addToCart={addToCart}
        />
      )}
    </>
  );
}

function CarouselControls({ rowRef, scrollRow }) {
  return (
    <div style={styles.rowControls}>
      <button style={styles.arrow} onClick={() => scrollRow(rowRef, "left")}>
        <FaChevronLeft />
      </button>
      <button style={styles.arrow} onClick={() => scrollRow(rowRef, "right")}>
        <FaChevronRight />
      </button>
    </div>
  );
}

function ProductRow({ rowRef, products, openQuickView, addToCart }) {
  return (
    <div ref={rowRef} style={styles.row} className="hideScrollbar">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          openQuickView={openQuickView}
          addToCart={addToCart}
        />
      ))}
    </div>
  );
}


function ProductCard({ product, openQuickView, addToCart }) {
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const toggleWishlist = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user?.id) {
      alert("Please login first.");
      return;
    }

    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        product_id: product.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Wishlist failed");
      return;
    }

    setLiked(data.liked);
  } catch (err) {
    console.error("WISHLIST ERROR:", err);
    alert("Wishlist error");
  }
};

  const images = [
  product.image_url,
  product.image_url_2,
  product.image_url_3,
  product.image_url_4,
  ].filter(Boolean);

  const image = hovered && images[1] ? images[1] : images[0] || "";

  const discount = Number(product.discount_percent || 0);
  const originalPrice = Number(product.price || 0);

  const finalPrice =
    discount > 0
      ? originalPrice * (1 - discount / 100)
      : originalPrice;

  const handleAddToCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (!userId) {
        alert("Please login first.");
        return;
      }

      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        throw new Error("Cart request failed");
      }

      addToCart(product);

      alert("Added to cart ✅");
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);
      alert("Failed to add to cart");
    }
  };

  return (
    <article
      style={styles.card}
      className="cardHover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrap}>
        {image ? (
          <img
            src={image}
            alt={product.name || "Product"}
            style={styles.image}
          />
        ) : (
          <div style={styles.noImage}>
            ZURI ELEGANCE
          </div>
        )}

        {product.promotion_text && (
          <div style={styles.promoBadge}>
            {product.promotion_text}
          </div>
        )}

        {discount > 0 && (
          <div style={styles.discountBadge}>
            {discount}% OFF
          </div>
        )}

        <button
          style={{
            ...styles.heart,
            ...(liked ? styles.heartActive : {}),
          }}
          className={liked ? "heartPop" : ""}
          onClick={toggleWishlist}
        >
          <FaHeart />
        </button>

        <button
          style={styles.eye}
          onClick={() => openQuickView(product)}
        >
          <FaEye />
        </button>
      </div>

      <div style={styles.cardBody}>
        <p style={styles.categoryText}>
          {product.category || "Hair"}
        </p>

        <h3 style={styles.productName}>
          {product.name}
        </h3>

        <p style={styles.productDesc}>
          {product.description || "Luxury beauty product."}
        </p>

        <div style={styles.cardBottom}>
          <div>
            {discount > 0 && (
              <span style={styles.oldPrice}>
                R {originalPrice.toFixed(2)}
              </span>
            )}

            <span style={styles.price}>
              R {finalPrice.toFixed(2)}
            </span>
          </div>

          <button
            style={styles.addBtn}
            onClick={handleAddToCart}
          >
            <FaShoppingCart />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

function QuickView({ product, close, addToCart }) {
  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
  ].filter(Boolean);

  const [activeImage, setActiveImage] = useState(images[0] || "");

  const handleAddToCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id;

      if (!userId) {
        alert("Please login first.");
        return;
      }

      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, product_id: product.id, quantity: 1 }),
      });

      if (!res.ok) throw new Error("Cart request failed");

      addToCart(product);
      alert("Added to cart ✅");
      close();
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);
      alert("Failed to add to cart");
    }
  };

  return (
    <div style={drawer.overlay} onClick={close}>
      <div style={drawer.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={drawer.close} onClick={close}>
          ✕
        </button>

        <div style={drawer.imageWrap}>
          {activeImage ? (
            <img src={activeImage} alt={product.name} style={drawer.image} />
          ) : (
            <div style={drawer.noImage}>ZURI ELEGANCE</div>
          )}
        </div>

        {images.length > 1 && (
          <div style={drawer.thumbs}>
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`thumb-${index}`}
                onClick={() => setActiveImage(img)}
                style={activeImage === img ? drawer.thumbActive : drawer.thumb}
              />
            ))}
          </div>
        )}

        <div style={drawer.content}>
          <p style={drawer.category}>{product.category || "Hair"}</p>

          <h2 style={drawer.title}>{product.name}</h2>

          <p style={drawer.desc}>
            {product.description || "Luxury beauty product."}
          </p>

          {product.promotion_text && (
            <div className="promo-badge">{product.promotion_text}</div>
          )}

          {Number(product.discount_percent) > 0 && (
            <div className="discount-badge">
              {product.discount_percent}% OFF
            </div>
          )}

          <p style={drawer.price}>
            R {Number(product.price || 0).toFixed(2)}
          </p>

          <button style={drawer.addBtn} onClick={handleAddToCart}>
            Add to Cart
          </button>

          <button
            style={{
              ...drawer.addBtn,
              marginTop: "12px",
              background: "#fff",
              color: "#50242A",
              border: "2px solid #50242A",
            }}
            onClick={() => (window.location.href = `/products/${product.id}`)}
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  );
}

 
const styles = {
  page: {
    padding: "0 20px 28px",
    background: "#f8f4ee",
    minHeight: "100vh",
  },
 
  productsSection: {
  marginBottom: "28px",
  overflow: "visible",
  paddingBottom: "30px",
},

  productsTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  kicker: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "1.5px",
    fontSize: "12px",
  },

  sectionTitle: {
    margin: "6px 0 0",
    color: "#2b2023",
    fontSize: "28px",
    fontWeight: "900",
  },

  search: {
    width: "280px",
    maxWidth: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    outline: "none",
    background: "#fff",
    color: "#2b2023",
    fontWeight: "800",
  },

  rowControls: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "10px",
  },

  arrow: {
    width: "40px",
    height: "40px",
    borderRadius: "999px",
    border: "none",
    background: "#fff",
    color: WINE,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(80,36,42,0.10)",
  },

  row: {
  display: "flex",
  gap: "18px",
  overflowX: "auto",
  overflowY: "visible",
  paddingBottom: "80px",
  scrollBehavior: "smooth",
  alignItems: "flex-start",
},
   
imageWrap: {
  height: "260px",
  position: "relative",
  overflow: "hidden",
  background: "#f1ebe6",
},

image: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "0.4s ease",
},

eye: {
  position: "absolute",
  bottom: "12px",
  right: "12px",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "#fff",
  color: WINE,
  cursor: "pointer",
  zIndex: 20,
},

card: {
  minWidth: "280px",
  maxWidth: "280px",
  background: "#fff",
  borderRadius: "20px",
  position: "relative",
  boxShadow: "0 10px 24px rgba(0,0,0,0.07)",
  border: "1px solid rgba(80,36,42,0.08)",
  transition: "0.3s ease",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
},

cardBody: {
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
},

cardBottom: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  marginTop: "auto",
  paddingTop: "12px",
},

productDesc: {
  fontSize: "12px",
  color: "#777",
  minHeight: "38px",
  lineHeight: "1.45",
  margin: "8px 0 12px",
},

  noImage: {
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "2px",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
  },

  promoBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: WINE,
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "900",
    zIndex: 5,
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  discountBadge: {
    position: "absolute",
    top: "46px",
    left: "12px",
    background: GOLD,
    color: "#2b1114",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "900",
    zIndex: 5,
  },

  heart: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "none",
    background: "#fff",
    color: WINE,
    cursor: "pointer",
    zIndex: 5,
  },

  heartActive: {
    background: WINE,
    color: "#fff",
  },

  categoryText: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    fontSize: "11px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  productName: {
    margin: "6px 0 0",
    fontSize: "16px",
    fontWeight: "900",
    color: "#2b2023",
    lineHeight: "1.2",
  },

  oldPrice: {
    display: "block",
    color: "#999",
    textDecoration: "line-through",
    fontSize: "12px",
    fontWeight: "800",
  },

  price: {
    display: "block",
    color: WINE,
    fontWeight: "900",
    fontSize: "15px",
  },

  addBtn: {
    minWidth: "82px",
    height: "36px",
    padding: "0 10px",
    borderRadius: "12px",
    border: "none",
    background: WINE,
    color: "#fff",
    cursor: "pointer",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "12px",
  },

  boutiqueNavbar: {
    margin: "8px auto 30px",
    padding: "30px 24px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "100%",
    color: "#fff",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    boxShadow: "0 18px 42px rgba(80,36,42,0.25)",
    overflow: "hidden",
    position: "relative",
  },

  crown: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    margin: "0 auto 12px",
    background: "rgba(255,255,255,0.10)",
    color: GOLD,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  bannerKicker: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "2px",
    fontSize: "12px",
  },

  bannerTitle: {
    margin: "8px 0 0",
    fontSize: "34px",
    fontFamily: "Georgia, serif",
    fontWeight: "900",
  },

  bannerText: {
    margin: "8px auto 0",
    color: "#f7e9df",
    maxWidth: "520px",
  },

  categoryMenu: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  categoryBtn: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800",
  },

  categoryBtnActive: {
    border: "1px solid rgba(163,133,96,0.8)",
    background: GOLD,
    color: "#2b1114",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "900",
    boxShadow: "0 0 20px rgba(163,133,96,0.35)",
  },

  resultCount: {
    color: WINE,
    fontWeight: "900",
  },

  empty: {
    background: "#fff",
    padding: "30px",
    borderRadius: "18px",
    color: WINE,
    fontWeight: "900",
  },
};


const drawer = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.58)",
    zIndex: 5000,
    display: "flex",
    alignItems: "flex-end",
  },

  sheet: {
    width: "100%",
    maxHeight: "92vh",
    background: "#fff",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    overflowY: "auto",
    position: "relative",
  },

  close: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "none",
    background: "#fff",
    color: "#50242A",
    fontWeight: "900",
    cursor: "pointer",
    zIndex: 10,
  },

  imageWrap: {
  width: "100%",
  height: "520px",
  background: "#f8f4ee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",
},

image: {
  maxWidth: "100%",
  maxHeight: "100%",
  width: "auto",
  height: "auto",
  objectFit: "contain",
  objectPosition: "center center",
  display: "block",
},

  noImage: {
    height: "360px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #50242A, #2b1114)",
    color: "#A38560",
    fontWeight: "900",
    letterSpacing: "2px",
  },

  thumbs: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    overflowX: "auto",
    justifyContent: "center",
  },

  thumb: {
    width: "64px",
    height: "64px",
    objectFit: "cover",
    borderRadius: "14px",
    opacity: 0.55,
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "0.3s ease",
  },

  thumbActive: {
    width: "72px",
    height: "72px",
    objectFit: "cover",
    borderRadius: "14px",
    border: "2px solid #50242A",
    opacity: 1,
    cursor: "pointer",
  },

  content: {
    padding: "20px",
  },

  category: {
    color: "#A38560",
    fontWeight: "900",
    fontSize: "12px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },

  title: {
    margin: "8px 0",
    color: "#2b2023",
    fontSize: "30px",
    fontFamily: "Georgia, serif",
    fontWeight: "900",
  },

  desc: {
    color: "#75686a",
    lineHeight: "1.6",
  },

  price: {
    color: "#50242A",
    fontWeight: "900",
    fontSize: "24px",
    margin: "14px 0",
  },

  addBtn: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    background: "linear-gradient(135deg, #50242A, #2b1114)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
};


const css = `
.cardHover:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 38px rgba(80,36,42,0.18) !important;
}

.cardHover:hover img {
  transform: scale(1.06);
}

.heartPop {
  animation: pop 0.3s ease;
}

@keyframes pop {
  50% { transform: scale(1.3); }
}

.hideScrollbar::-webkit-scrollbar {
  display: none;
}

.shimmer::after {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.18), transparent);
  animation: shimmer 5s infinite;
}

@keyframes shimmer {
  to { left: 120%; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
`;
