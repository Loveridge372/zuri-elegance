import API_BASE from "../services/api";
import { useEffect, useMemo, useRef, useState } from "react";
import RecommendedProducts from "../components/RecommendedProducts";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaArrowRight,
} from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import HeroSlider from "../components/HeroSlider";
import Seo from "../components/Seo";
import { useCart } from "../context/CartContext";

const WINE = "#50242A";
const GOLD = "#A38560";

const categories = [
  { label: "All", terms: [] },
  { label: "Wigs", terms: ["wig", "wigs"] },
  { label: "Bundles", terms: ["bundle", "bundles"] },
  { label: "Closures", terms: ["closure", "closures"] },
  { label: "Frontals", terms: ["frontal", "frontals"] },
  {
    label: "Beauty",
    terms: ["beauty", "makeup", "skincare", "skin care", "hair care"],
  },
  {
    label: "Accessories",
    terms: ["accessory", "accessories", "bonnet", "brush", "tool"],
  },
];

const hairInventoryTerms = [
  "wig",
  "wigs",
  "bundle",
  "bundles",
  "closure",
  "closures",
  "frontal",
  "frontals",
  "hairpiece",
  "hairpieces",
  "weave",
  "extensions",
  "lace",
  "virgin hair",
  "raw hair",
];

const careProductTerms = [
  "beauty",
  "makeup",
  "skincare",
  "skin care",
  "hair care",
  "shampoo",
  "conditioner",
  "serum",
  "oil",
  "spray",
  "cream",
  "lotion",
  "mask",
  "edge",
  "bonnet",
  "brush",
  "tool",
  "accessory",
  "cosmetic",
];

const getProductSearchText = (product) =>
  `${product.name || ""} ${product.brand || ""} ${product.description || ""} ${product.category || ""} ${product.subcategory || ""}`.toLowerCase();

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const featuredRef = useRef(null);
  const filteredRef = useRef(null);
  const luxeRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then((res) => res.json())
      .then((data) => {
        const availableProducts = Array.isArray(data)
          ? data.filter((product) => Number(product.stock || 0) > 0)
          : [];

        setProducts(availableProducts);
      })
      .catch((err) => {
        console.error("PRODUCTS ERROR:", err);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        if (!userId) return;

        const response = await fetch(`${API_BASE}/wishlist/${userId}`);
        const data = await response.json();

        const ids = Array.isArray(data) ? data.map((item) => item.id) : [];
        setWishlistIds(ids);
      } catch (err) {
        console.error("WISHLIST LOAD ERROR:", err);
      }
    };

    fetchWishlist();
  }, [userId]);

  useEffect(() => {
    const reorderItems = JSON.parse(localStorage.getItem("reorder_items") || "[]");

    if (!reorderItems.length) return;

    reorderItems.forEach((item) => {
      addToCart({
        ...item,
        id: item.product_id || item.id,
        quantity: item.quantity || 1,
      });
    });

    localStorage.removeItem("reorder_items");
    alert("Items added back to cart ✅");
  }, [addToCart]);

  const toggleWishlist = async (productId) => {
    try {
      if (!userId) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(`${API_BASE}/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Wishlist error");
        return;
      }

      setWishlistIds((prev) =>
        data.liked
          ? [...new Set([...prev, productId])]
          : prev.filter((id) => id !== productId)
      );
    } catch (err) {
      console.error("TOGGLE WISHLIST ERROR:", err);
    }
  };

 const loadReviews = async (productId) => {
  try {
    const response = await fetch(
      `${API_BASE}/products/${productId}/reviews`
    );

    const data = await response.json();

    if (response.ok) {
      setReviews(data);
    }
  } catch (err) {
    console.error("LOAD REVIEWS ERROR:", err);
  }
};

 const submitReview = async (productId) => {
  try {
    if (!userId) {
      alert("Please login first");
      return;
    }

    const response = await fetch(
      `${API_BASE}/products/${productId}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

    alert("Review submitted ✨");

    setReviewText("");
    setReviewRating(5);

    loadReviews(productId);
  } catch (err) {
    console.error("SUBMIT REVIEW ERROR:", err);
  }
};

  const subcategories = useMemo(() => {
    const values = products
      .map((product) => product.subcategory)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [products]);

  const brands = useMemo(() => {
    const values = products
      .map((product) => product.brand)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [products]);

  useEffect(() => {
    const selectedBrand = new URLSearchParams(location.search).get("brand");

    if (selectedBrand && brands.includes(selectedBrand)) {
      setBrandFilter(selectedBrand);
    }
  }, [brands, location.search]);

  const searchFiltered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return products.filter((p) => {
      const text = getProductSearchText(p);

      return text.includes(term);
    });
  }, [products, search]);

  const categoryFiltered = useMemo(() => {
    const selected = categories.find((c) => c.label === activeCategory);

    if (!selected || activeCategory === "All") return searchFiltered;

    return searchFiltered.filter((p) => {
      const text = getProductSearchText(p);

      return selected.terms.some((term) => text.includes(term));
    });
  }, [searchFiltered, activeCategory]);

  const filteredProducts = useMemo(() => {
    const filtered = categoryFiltered.filter((product) => {
      const finalPrice = getFinalPrice(product);
      const rating = Number(product.average_rating || 0);
      const stock = Number(product.stock || 0);
      const hasDeal =
        Number(product.discount_percent || 0) > 0 ||
        Boolean(product.promotion_text);

      const matchesSubcategory =
        activeSubcategory === "All" ||
        product.subcategory === activeSubcategory;

      const matchesBrand =
        brandFilter === "All" ||
        product.brand === brandFilter;

      const matchesPrice =
        priceFilter === "All" ||
        (priceFilter === "Under R1000" && finalPrice < 1000) ||
        (priceFilter === "R1000 - R2500" &&
          finalPrice >= 1000 &&
          finalPrice <= 2500) ||
        (priceFilter === "Over R2500" && finalPrice > 2500);

      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "In Stock" && stock > 0) ||
        (stockFilter === "Low Stock" && stock > 0 && stock <= 3);

      const matchesDeals = !dealsOnly || hasDeal;

      const matchesRating =
        ratingFilter === "All" ||
        rating >= Number(ratingFilter);

      return (
        matchesSubcategory &&
        matchesBrand &&
        matchesPrice &&
        matchesStock &&
        matchesDeals &&
        matchesRating
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "Price low-high") {
        return getFinalPrice(a) - getFinalPrice(b);
      }

      if (sortBy === "Price high-low") {
        return getFinalPrice(b) - getFinalPrice(a);
      }

      if (sortBy === "Top rated") {
        return (
          Number(b.average_rating || 0) -
          Number(a.average_rating || 0)
        );
      }

      if (sortBy === "AI match") {
        return getAiScore(b) - getAiScore(a);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [
    activeSubcategory,
    brandFilter,
    categoryFiltered,
    dealsOnly,
    priceFilter,
    ratingFilter,
    sortBy,
    stockFilter,
  ]);

  const featuredProducts = searchFiltered
    .filter((product) => {
      const text = getProductSearchText(product);
      const isHairInventory = hairInventoryTerms.some((term) => text.includes(term));
      const isCareProduct = careProductTerms.some((term) => text.includes(term));

      return isCareProduct && !isHairInventory;
    })
    .slice(0, 12);

  const luxeProducts = products.filter((p) => Number(p.price || 0) >= 2500);

  const scrollRow = (ref, dir) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: dir === "left" ? -650 : 650,
      behavior: "smooth",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setActiveSubcategory("All");
    setBrandFilter("All");
    setPriceFilter("All");
    setStockFilter("All");
    setDealsOnly(false);
    setRatingFilter("All");
    setSortBy("Newest");
  };

  return (
    <>
      <style>{css}</style>
      <Seo
        title="Shop Beauty Products | Zuri Elegance"
        description="Shop Zuri Elegance wigs, beauty products, accessories and curated brands with secure checkout and delivery updates."
      />

      <Navbar
        toggleSidebar={() => setSidebarOpen(true)}
        searchValue={search}
        onSearchChange={setSearch}
        onSearchClear={() => setSearch("")}
        searchPlaceholder="Search hair and beauty care..."
      />

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
        brands={brands}
        activeBrand={brandFilter}
        onBrandSelect={setBrandFilter}
      />

      <main style={styles.page}>
        <div className="shop-hero-offset">
          <HeroSlider />
        </div>

        <RecommendedProducts />

        <section className="beauty-match-cta" style={styles.beautyMatchCta}>
          <div style={styles.beautyMatchIcon}>
            <FaCrown />
          </div>

          <div style={styles.beautyMatchCopy}>
            <p style={styles.beautyMatchKicker}>AI BEAUTY MATCH</p>
            <h2 style={styles.beautyMatchTitle}>
              Find your perfect beauty picks
            </h2>
            <span style={styles.beautyMatchText}>
              Take your AI Beauty Match and unlock more personal product recommendations.
            </span>
          </div>

          <button
            type="button"
            className="beauty-match-btn"
            style={styles.beautyMatchBtn}
            onClick={() => navigate("/beauty-analysis")}
          >
            Start Match
            <FaChevronRight />
          </button>
        </section>

        <section
          className="products-section"
          style={{
            ...styles.productsSection,
            position: "relative",
            overflow: "visible",
            background: `
              radial-gradient(circle at top right, rgba(212,175,122,0.18), transparent 30%),
              radial-gradient(circle at bottom left, rgba(255,255,255,0.05), transparent 30%),
              linear-gradient(135deg, #2A0F16 0%, #50242A 35%, #6A2E38 70%, #2A0F16 100%)
            `,
            borderRadius: "34px",
            padding: "40px 24px",
            boxShadow: "0 25px 60px rgba(80,36,42,0.22)",
            marginTop: "40px",
          }}
        >
          <div style={styles.productsTop}>
            <div>
              <p style={{ ...styles.kicker, color: "rgba(255,255,255,0.78)" }}>
                SHOP ZURI
              </p>

              <h2
                style={{
                  ...styles.sectionTitle,
                  color: "#fff",
                  fontSize: "38px",
                  fontFamily: "Georgia, serif",
                }}
              >
                Hair and Beauty Care
              </h2>
            </div>
          </div>

          <CarouselControls rowRef={featuredRef} scrollRow={scrollRow} />

          <ProductRow
            rowRef={featuredRef}
            products={featuredProducts}
            openQuickView={setQuickView}
            addToCart={addToCart}
            wishlistIds={wishlistIds}
            toggleWishlist={toggleWishlist}
            loadReviews={loadReviews}
          />
        </section>

        <section className="boutique-section shimmer" style={styles.boutiqueNavbar}>
          <div style={styles.crown}>
            <FaCrown />
          </div>

          <p style={styles.bannerKicker}>ZURI COLLECTION</p>

          <h2 style={styles.bannerTitle}>Boutique Collection</h2>

          <p style={styles.bannerText}>
            Shop your signature look.
          </p>
        </section>

        <section style={styles.productsSection}>
          <div style={styles.productsTop}>
            <div>
              <p style={styles.kicker}>FILTERED EDIT</p>

              <h2 style={styles.sectionTitle}>{activeCategory} Products</h2>
            </div>

            <p style={styles.resultCount}>
              {filteredProducts.length} item
              {filteredProducts.length === 1 ? "" : "s"}
            </p>
          </div>

          <SmartFilterBar
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            setActiveSubcategory={setActiveSubcategory}
            brands={brands}
            brandFilter={brandFilter}
            setBrandFilter={setBrandFilter}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            dealsOnly={dealsOnly}
            setDealsOnly={setDealsOnly}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resetFilters={resetFilters}
          />

          {filteredProducts.length > 0 ? (
            <>
              <ProductGrid
                products={filteredProducts}
                openQuickView={setQuickView}
                addToCart={addToCart}
                wishlistIds={wishlistIds}
                toggleWishlist={toggleWishlist}
                loadReviews={loadReviews}
              />
            </>
          ) : (
            <EmptyProducts
              search={search}
              activeCategory={activeCategory}
              resetFilters={resetFilters}
            />
          )}
        </section>

        <section style={styles.productsSection}>
          <div style={styles.productsTop}>
            <div>
              <p style={styles.kicker}>QUICK SCAN</p>

              <h2 style={styles.sectionTitle}>Recently Added</h2>
            </div>
          </div>

          <CarouselControls rowRef={filteredRef} scrollRow={scrollRow} />

          <ProductRow
            rowRef={filteredRef}
            products={products.slice(0, 10)}
              openQuickView={setQuickView}
              addToCart={addToCart}
              wishlistIds={wishlistIds}
              toggleWishlist={toggleWishlist}
            loadReviews={loadReviews}
            />
        </section>

        <section className="luxe-section luxeShimmer" style={styles.luxeNavbar}>
          <div style={styles.luxeHeader}>
            <div style={styles.luxeBadge}>
              <FaCrown />
            </div>

            <p style={styles.luxeKicker}>SIGNATURE LUXE COLLECTION</p>

            <h2 style={styles.luxeTitle}>Exclusive Hairpieces</h2>

            <p style={styles.luxeText}>
              Reserved for our most premium wigs, frontals and luxury hairpieces.
            </p>
          </div>
        </section>

        <section style={styles.productsSection}>
          <div style={styles.productsTop}>
            <div>
              <p style={styles.kicker}>PREMIUM EDIT</p>

              <h2 style={styles.sectionTitle}>Signature Luxe Pieces</h2>
            </div>
          </div>

          <CarouselControls rowRef={luxeRef} scrollRow={scrollRow} />

          <ProductRow
            rowRef={luxeRef}
            products={luxeProducts}
            openQuickView={setQuickView}
            addToCart={addToCart}
            wishlistIds={wishlistIds}
            toggleWishlist={toggleWishlist}
            loadReviews={loadReviews}
            luxe
          />
        </section>
      </main>

      {quickView && (
  <QuickView
    product={quickView}
    close={() => setQuickView(null)}
    addToCart={addToCart}
    reviews={reviews}
    reviewText={reviewText}
    setReviewText={setReviewText}
    reviewRating={reviewRating}
    setReviewRating={setReviewRating}
    submitReview={submitReview}
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

function ProductRow({
  rowRef,
  products,
  openQuickView,
  addToCart,
  wishlistIds,
  toggleWishlist,
  loadReviews,
  luxe,
}) {
  return (
    <div ref={rowRef} style={styles.row} className="product-row hideScrollbar">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          openQuickView={openQuickView}
          addToCart={addToCart}
          wishlistIds={wishlistIds}
          toggleWishlist={toggleWishlist}
          loadReviews={loadReviews}
          luxe={luxe}
        />
      ))}
    </div>
  );
}

function ProductGrid({
  products,
  openQuickView,
  addToCart,
  wishlistIds,
  toggleWishlist,
  loadReviews,
}) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          openQuickView={openQuickView}
          addToCart={addToCart}
          wishlistIds={wishlistIds}
          toggleWishlist={toggleWishlist}
          loadReviews={loadReviews}
        />
      ))}
    </div>
  );
}

function SmartFilterBar({
  subcategories,
  activeSubcategory,
  setActiveSubcategory,
  brands,
  brandFilter,
  setBrandFilter,
  priceFilter,
  setPriceFilter,
  stockFilter,
  setStockFilter,
  dealsOnly,
  setDealsOnly,
  ratingFilter,
  setRatingFilter,
  sortBy,
  setSortBy,
  resetFilters,
}) {
  return (
    <div className="smart-filter-bar">
      <label>
        Subcategory
        <select
          value={activeSubcategory}
          onChange={(e) => setActiveSubcategory(e.target.value)}
        >
          {subcategories.map((subcategory) => (
            <option key={subcategory}>{subcategory}</option>
          ))}
        </select>
      </label>

      <label>
        Brand
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          {brands.map((brand) => (
            <option key={brand}>{brand}</option>
          ))}
        </select>
      </label>

      <label>
        Price
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
        >
          {["All", "Under R1000", "R1000 - R2500", "Over R2500"].map(
            (option) => (
              <option key={option}>{option}</option>
            )
          )}
        </select>
      </label>

      <label>
        Stock
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          {["All", "In Stock", "Low Stock"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <label>
        Rating
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
      </label>

      <label>
        Sort
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {[
            "Newest",
            "Price low-high",
            "Price high-low",
            "Top rated",
            "AI match",
          ].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={dealsOnly ? "deal-toggle active" : "deal-toggle"}
        onClick={() => setDealsOnly(!dealsOnly)}
      >
        Deals
      </button>

      <button
        type="button"
        className="reset-filter-btn"
        onClick={resetFilters}
      >
        Reset
      </button>
    </div>
  );
}

function EmptyProducts({ search, activeCategory, resetFilters }) {
  return (
    <div className="empty-products">
      <FaCrown />
      <h3>No matching products</h3>
      <p>
        Try wigs, closures, skincare, a wider price range, or reset the
        current filters.
      </p>
      {(search || activeCategory !== "All") && (
        <small>
          Current search: {search || "none"} | Category: {activeCategory}
        </small>
      )}
      <button type="button" onClick={resetFilters}>
        Reset Filters
      </button>
    </div>
  );
}

function ProductCard({
  product,
  openQuickView,
  addToCart,
  luxe,
  wishlistIds,
  toggleWishlist,
  loadReviews,
}) {
  const [hovered, setHovered] = useState(false);

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
    discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

  const isWishlisted = wishlistIds.includes(product.id);
  const aiScore = getAiScore(product);
  const labels = getProductLabels(product, aiScore);
  const aiReason = getAiReason(product);

  const handleAddToCart = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
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

      addToCart({
        ...product,
        price: finalPrice,
        final_price: finalPrice,
        quantity: 1,
      });

      alert("Added to cart ✅");
    } catch (err) {
      console.error("ADD TO CART ERROR:", err);
      alert("Failed to add to cart");
    }
  };

  return (
    <article
      style={{
        ...styles.card,
        ...(luxe ? styles.luxeCard : {}),
      }}
      className="product-card cardHover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrap} className="imageShine">
        {image ? (
          <img src={image} alt={product.name || "Product"} style={styles.image} />
        ) : (
          <div style={styles.noImage}>ZURI ELEGANCE</div>
        )}

        {product.promotion_text && (
          <div style={styles.promoBadge}>{product.promotion_text}</div>
        )}

        {discount > 0 && <div style={styles.discountBadge}>{discount}% OFF</div>}

        <div className="product-label-stack">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

       <button
  style={{
    ...styles.heart,
    ...(isWishlisted ? styles.heartActive : {}),
  }}
  className="wishlistPulse"
  onClick={() => toggleWishlist(product.id)}
>
  <FaHeart />
</button>

        <button
          type="button"
          className="shop-quick-view"
          style={styles.viewBtn}
          onClick={() => {
            openQuickView(product);
            loadReviews?.(product.id);
          }}
        >
          View
          <FaArrowRight />
        </button>
      </div>

      <div style={styles.cardBody}>
        <p style={styles.categoryText}>
          {product.brand || product.category || "Hair"}
        </p>

        <h3 style={styles.productName}>{product.name}</h3>

        <p style={styles.aiReason}>
          {aiReason}
        </p>

        <div className="product-ai-match">
          <div
            className="product-match-ring"
            style={{
              background: `conic-gradient(${GOLD} ${
                aiScore * 3.6
              }deg, rgba(163,133,96,.18) 0deg)`,
            }}
          >
            <span>{aiScore}%</span>
          </div>

          <div>
            <small>AI Match</small>
            <strong>{getAiLabel(aiScore)}</strong>
          </div>
        </div>

        <div style={styles.ratingRow}>
  <span style={styles.ratingStars}>
    ⭐ {product.average_rating || 0}
  </span>

  <span style={styles.ratingCount}>
    ({product.review_count || 0} reviews)
  </span>
</div>

        <div style={styles.cardBottom}>
          <div>
            {discount > 0 && (
              <span style={styles.oldPrice}>R {originalPrice.toFixed(2)}</span>
            )}

            <span style={styles.price}>R {finalPrice.toFixed(2)}</span>
          </div>

          <button
           type="button"
           className="viewLuxuryBtn"
           style={styles.cardViewBtn}
           onClick={() => {
             openQuickView(product);
             loadReviews?.(product.id);
           }}
          >
            View
          </button>

          <button
           type="button"
           className="addLuxuryBtn"
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

function QuickView({
  product,
  close,
  addToCart,
  reviews,
  reviewText,
  setReviewText,
  reviewRating,
  setReviewRating,
  submitReview,
}) {
  const images = [
    product.image_url,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
  ].filter(Boolean);

  const discount = Number(product.discount_percent || 0);
  const originalPrice = Number(product.price || 0);
  const finalPrice =
    discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

  const averageRating =
    reviews?.length > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

  const handleQuickAdd = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
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

      addToCart({
        ...product,
        price: finalPrice,
        final_price: finalPrice,
        quantity: 1,
      });

      close();
    } catch (err) {
      console.error("QUICK VIEW CART ERROR:", err);
      alert("Failed to add to cart");
    }
  };

  return (
    <div style={drawer.overlay} onClick={close}>
      <div
        className="shop-floating-modal"
        style={drawer.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={drawer.close} onClick={close}>✕</button>

        <div style={drawer.imageWrap}>
          {images.length > 1 ? (
            <div className="shop-modal-gallery">
              {images.map((img, index) => (
                <img
                  key={`${img}-${index}`}
                  src={img}
                  alt={`${product.name} ${index + 1}`}
                />
              ))}
            </div>
          ) : images[0] ? (
            <img src={images[0]} alt={product.name} style={drawer.image} />
          ) : (
            <div style={drawer.noImage}>ZURI ELEGANCE</div>
          )}
        </div>

        <div style={drawer.content}>
          <p style={drawer.category}>
            {product.brand || product.category || "Hair"}
          </p>
          <h2 style={drawer.title}>{product.name}</h2>

          <p style={{ fontWeight: 900, color: GOLD }}>
            ⭐ {averageRating ? averageRating.toFixed(1) : "No ratings yet"}{" "}
            {reviews?.length ? `(${reviews.length} review${reviews.length === 1 ? "" : "s"})` : ""}
          </p>

          <p style={drawer.desc}>
            {product.description || "Luxury beauty product."}
          </p>

          <p style={drawer.price}>R {finalPrice.toFixed(2)}</p>

          <button
            style={drawer.addBtn}
            onClick={handleQuickAdd}
          >
            Add to Cart
          </button>

          <div style={reviewStyles.box}>
            <h3 style={reviewStyles.title}>Customer Reviews</h3>

            <div style={reviewStyles.form}>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                style={reviewStyles.select}
              >
                <option value={5}>★★★★★ 5</option>
                <option value={4}>★★★★☆ 4</option>
                <option value={3}>★★★☆☆ 3</option>
                <option value={2}>★★☆☆☆ 2</option>
                <option value={1}>★☆☆☆☆ 1</option>
              </select>

              <textarea
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={reviewStyles.textarea}
              />

              <button
                type="button"
                style={reviewStyles.button}
                onClick={() => submitReview(product.id)}
              >
                Submit Review
              </button>
            </div>

            {reviews?.length > 0 ? (
  reviews.map((review) => (
    <div key={review.id} style={reviewStyles.review}>
      <div style={reviewStyles.reviewTop}>
        <div>
          <strong>{review.customer_name || "Customer"}</strong>

          <span style={reviewStyles.verified}>
            Verified Customer
          </span>
        </div>

        <small style={reviewStyles.date}>
          {review.created_at
            ? new Date(review.created_at).toLocaleDateString()
            : ""}
        </small>
      </div>

      <p style={reviewStyles.stars}>
        {"★".repeat(Number(review.rating || 0))}
        {"☆".repeat(5 - Number(review.rating || 0))}
      </p>

      <p style={reviewStyles.comment}>
        {review.comment || "No comment left."}
      </p>
    </div>
  ))
) : (
  <div style={reviewStyles.emptyBox}>
    <p style={reviewStyles.empty}>No reviews yet.</p>
    <small>Be the first to review this product ✨</small>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFinalPrice(product) {
  const discount = Number(product?.discount_percent || 0);
  const price = Number(product?.price || 0);

  return discount > 0 ? price * (1 - discount / 100) : price;
}

function getAiScore(product) {
  const backendScore = Number(product?.ai_match_score);

  if (Number.isFinite(backendScore) && backendScore > 0) {
    return Math.max(65, Math.min(Math.round(backendScore), 99));
  }

  const rating = Number(product?.average_rating || 0);
  const stock = Number(product?.stock || 0);
  const hasDeal =
    Number(product?.discount_percent || 0) > 0 ||
    Boolean(product?.promotion_text);

  let score = 84;

  if (rating >= 4.5) score += 8;
  if (rating >= 3.5) score += 4;
  if (hasDeal) score += 3;
  if (stock > 0 && stock <= 3) score += 2;

  return Math.max(65, Math.min(score, 98));
}

function getAiLabel(score) {
  if (score >= 95) return "Best Match";
  if (score >= 90) return "AI Pick";
  if (score >= 85) return "Style Match";
  return "Recommended";
}

function getAiReason(product) {
  if (product?.ai_match_reason) {
    return product.ai_match_reason;
  }

  const text = `
    ${product?.name || ""}
    ${product?.category || ""}
    ${product?.description || ""}
  `.toLowerCase();

  if (text.includes("wig")) {
    return "Chosen for a polished premium hair profile.";
  }

  if (text.includes("closure") || text.includes("frontal")) {
    return "Selected for a sleek, secure beauty finish.";
  }

  if (text.includes("skin") || text.includes("glow")) {
    return "Matched to glow-focused beauty goals.";
  }

  return "Curated from Zuri's boutique beauty edit.";
}

function getProductLabels(product, aiScore) {
  const labels = [];
  const stock = Number(product?.stock || 0);
  const discount = Number(product?.discount_percent || 0);
  const rating = Number(product?.average_rating || 0);

  if (discount > 0 || product?.promotion_text) {
    labels.push("Limited Offer");
  }

  if (stock > 0 && stock <= 3) {
    labels.push("Low Stock");
  }

  if (rating >= 4.5 || Number(product?.review_count || 0) >= 10) {
    labels.push("Best Seller");
  }

  if (aiScore >= 90) {
    labels.push("AI Pick");
  }

  if (Number(product?.id || 0) >= 0) {
    labels.push("New Arrival");
  }

  return labels.slice(0, 3);
}

const styles = {
 page: {
  padding: "0 20px 34px",
  background:
    "linear-gradient(180deg, #f8f4ee 0%, #f4ece4 45%, #f8f4ee 100%)",
  minHeight: "100vh",
},

 productsSection: {
  marginBottom: "34px",
  overflow: "visible",
  padding: "28px 22px 34px",
  borderRadius: "30px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.92))",
  backdropFilter: "blur(14px)",
  boxShadow: "0 20px 50px rgba(80,36,42,0.08)",
  border: "1px solid rgba(163,133,96,0.10)",
},

productsTop: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "18px",
},

  kicker: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "1.5px",
    fontSize: "12px",
  },

 sectionTitle: {
  margin: "8px 0 0",
  color: "#2b2023",
  fontSize: "32px",
  fontWeight: "900",
  fontFamily: "Georgia, serif",
  letterSpacing: "-0.4px",
},

  search: {
    width: "320px",
    maxWidth: "100%",
    height: "54px",
    padding: "0 20px",
    borderRadius: "999px",
    border: "none",
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

  card: {
  minWidth: "280px",
  maxWidth: "280px",
  background: "rgba(255,255,255,0.92)",
  borderRadius: "24px",
  position: "relative",
  boxShadow: "0 18px 42px rgba(80,36,42,0.16)",
  border: "1px solid rgba(163,133,96,0.18)",
  transition: "0.32s ease",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  backdropFilter: "blur(14px)",
},

  luxeCard: {
    minWidth: "330px",
    maxWidth: "330px",
    border: "2px solid #07332c",
    boxShadow:
      "0 18px 42px rgba(7,51,44,0.24)",
  },

 imageWrap: {
  height: "260px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top, rgba(163,133,96,0.22), transparent 42%), linear-gradient(135deg, #f8f1e9, #efe3d6)",
},

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "0.4s ease",
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

  aiReason: {
    margin: "7px 0 10px",
    color: WINE,
    fontSize: "11px",
    fontWeight: "800",
    lineHeight: "1.4",
    opacity: 0.76,
    minHeight: "31px",
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
  },

  discountBadge: {
  position: "absolute",
  top: "50px",
  left: "12px",
  background:
    "linear-gradient(135deg, #E0BC72, #A38560)",
  color: "#2b1114",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: "900",
  zIndex: 5,
  letterSpacing: "0.5px",
  boxShadow: "0 8px 18px rgba(163,133,96,0.34)",
  border: "1px solid rgba(255,255,255,0.22)",
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

  viewBtn: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    right: "12px",
    minHeight: "38px",
    borderRadius: "14px",
    border: "none",
    background: "rgba(255,255,255,0.94)",
    color: WINE,
    cursor: "pointer",
    zIndex: 5,
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    boxShadow: "0 14px 26px rgba(0,0,0,0.16)",
  },

categoryText: {
  margin: 0,
  color: GOLD,
  fontWeight: "900",
  fontSize: "10px",
  letterSpacing: "1.6px",
  textTransform: "uppercase",
},

productName: {
  margin: "8px 0 0",
  fontSize: "17px",
  fontWeight: "900",
  color: "#2b2023",
  lineHeight: "1.28",
  letterSpacing: "-0.2px",
},

  ratingRow: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "6px",
  marginBottom: "10px",
},

ratingStars: {
  color: "#C89B3C",
  fontWeight: "900",
  fontSize: "14px",
},

ratingCount: {
  color: "#777",
  fontSize: "13px",
  fontWeight: "700",
},

oldPrice: {
  display: "block",
  color: "#9f9494",
  textDecoration: "line-through",
  fontSize: "12px",
  fontWeight: "800",
  marginBottom: "2px",
},

 price: {
  display: "block",
  color: WINE,
  fontWeight: "900",
  fontSize: "17px",
  letterSpacing: "-0.2px",
},

 addBtn: {
  minWidth: "74px",
  height: "38px",
  padding: "0 12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background:
    "linear-gradient(135deg, #50242A, #2b1114)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "900",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  fontSize: "12px",
  boxShadow: "0 10px 22px rgba(80,36,42,0.24)",
  transition: "all 0.28s ease",
},

 cardViewBtn: {
  minWidth: "62px",
  height: "38px",
  padding: "0 12px",
  borderRadius: "14px",
  border: `1px solid ${WINE}`,
  background: "#fff",
  color: WINE,
  cursor: "pointer",
  fontWeight: "900",
  fontSize: "12px",
 },

  boutiqueNavbar: {
    margin: "8px auto 30px",
    padding: "22px 24px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "100%",
    color: "#fff",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    boxShadow: "0 18px 42px rgba(80,36,42,0.25)",
    overflow: "hidden",
    position: "relative",
  },

  beautyMatchCta: {
    margin: "24px 0 28px",
    padding: "20px 22px",
    borderRadius: "24px",
    background: `
      radial-gradient(circle at top right, rgba(247,231,206,0.28), transparent 32%),
      linear-gradient(135deg, #07332c, #10231f)
    `,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    boxShadow: "0 20px 48px rgba(7,51,44,0.24)",
    border: "1px solid rgba(247,231,206,0.18)",
  },

  beautyMatchIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.12)",
    color: GOLD,
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
  },

  beautyMatchCopy: {
    flex: "1 1 auto",
  },

  beautyMatchKicker: {
    margin: 0,
    color: GOLD,
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1.8px",
  },

  beautyMatchTitle: {
    margin: "5px 0 4px",
    fontFamily: "Georgia, serif",
    fontSize: "26px",
    lineHeight: 1,
  },

  beautyMatchText: {
    color: "rgba(255,255,255,0.76)",
    fontWeight: "700",
    lineHeight: 1.5,
    fontSize: "13px",
  },

  beautyMatchBtn: {
    border: "none",
    borderRadius: "15px",
    padding: "13px 16px",
    background: `linear-gradient(135deg, ${GOLD}, #F7E7CE)`,
    color: "#2b1114",
    fontWeight: "900",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    whiteSpace: "nowrap",
    boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
  },

  crown: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    margin: "0 auto 10px",
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
    margin: "6px 0 0",
    fontSize: "30px",
    fontFamily: "Georgia, serif",
    fontWeight: "900",
  },

  bannerText: {
    margin: "6px auto 0",
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
  },

  luxeNavbar: {
    margin: "10px auto 24px",
    padding: "38px 24px",
    borderRadius: "30px",
    textAlign: "center",
    color: "#fff",
    background: `linear-gradient(135deg, #16080A, ${WINE}, #2b1114)`,
    boxShadow: "0 28px 70px rgba(80,36,42,0.35)",
    overflow: "hidden",
    position: "relative",
  },

  luxeHeader: {
    position: "relative",
    zIndex: 1,
  },

  luxeBadge: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    margin: "0 auto 16px",
    background: "rgba(255,255,255,0.10)",
    color: GOLD,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  luxeKicker: {
    margin: 0,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "2px",
    fontSize: "12px",
  },

  luxeTitle: {
    margin: "8px 0 0",
    color: "#fff",
    fontSize: "42px",
    fontFamily: "Georgia, serif",
    fontWeight: "900",
  },

  luxeText: {
    margin: "10px auto 0",
    color: "rgba(255,255,255,0.78)",
    maxWidth: "640px",
    fontWeight: "700",
    lineHeight: "1.7",
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
  background: "rgba(15,10,12,0.72)",
  backdropFilter: "blur(8px)",
  zIndex: 5000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "22px",
},
  
sheet: {
  width: "min(1040px, 96vw)",
  maxHeight: "88vh",
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(20px)",
  borderRadius: "30px",
  overflowY: "auto",
  position: "relative",
  boxShadow: "0 30px 90px rgba(0,0,0,0.34)",
  border: "1px solid rgba(255,255,255,0.48)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.05fr) minmax(360px, .95fr)",
},

 close: {
  position: "absolute",
  top: "14px",
  right: "14px",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  color: WINE,
  fontWeight: "900",
  cursor: "pointer",
  zIndex: 10,
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
},

  imageWrap: {
  width: "100%",
  height: "100%",
  minHeight: "520px",
  background:
    "radial-gradient(circle at top, rgba(163,133,96,0.22), transparent 40%), linear-gradient(135deg, #f8f4ee, #efe3d6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  position: "sticky",
  top: 0,
},

  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
  },

  noImage: {
    height: "360px",
    display: "grid",
    placeItems: "center",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: GOLD,
    fontWeight: "900",
    letterSpacing: "2px",
  },

  thumbs: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    overflowX: "auto",
    justifyContent: "center",
    gridColumn: "1 / 2",
    background: "#fffaf5",
  },

thumb: {
  width: "68px",
  height: "68px",
  objectFit: "cover",
  borderRadius: "16px",
  opacity: 0.58,
  cursor: "pointer",
  border: "2px solid transparent",
  transition: "all 0.28s ease",
  boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
},

 thumbActive: {
  width: "74px",
  height: "74px",
  objectFit: "cover",
  borderRadius: "18px",
  border: `2px solid ${GOLD}`,
  opacity: 1,
  cursor: "pointer",
  boxShadow: "0 14px 26px rgba(163,133,96,0.28)",
  transform: "translateY(-2px)",
},

  content: {
    padding: "46px 30px 28px",
    gridColumn: "2 / 3",
    gridRow: "1 / span 2",
  },

  category: {
    color: GOLD,
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
    color: WINE,
    fontWeight: "900",
    fontSize: "24px",
    margin: "14px 0",
  },

  addBtn: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    background: `linear-gradient(135deg, ${WINE}, #2b1114)`,
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },
};

  const reviewStyles = {
  box: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #eee",
  },

  title: {
    color: WINE,
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    marginBottom: "14px",
  },

  form: {
    display: "grid",
    gap: "10px",
    marginBottom: "18px",
  },

  select: {
    padding: "13px",
    borderRadius: "14px",
    border: "1px solid #eadfd6",
    fontWeight: "900",
  },

  textarea: {
    minHeight: "90px",
    padding: "13px",
    borderRadius: "14px",
    border: "1px solid #eadfd6",
    fontWeight: "700",
  },

  button: {
    border: "none",
    borderRadius: "14px",
    padding: "14px",
    background: WINE,
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  review: {
    background: "#f8f4ee",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "10px",
    color: "#2b2023",
  },

  stars: {
    color: GOLD,
    fontWeight: "900",
    margin: "6px 0",
  },

  reviewTop: {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
},

verified: {
  display: "block",
  marginTop: "4px",
  color: GOLD,
  fontSize: "11px",
  fontWeight: "900",
},

date: {
  color: "#999",
  fontWeight: "800",
  whiteSpace: "nowrap",
},

comment: {
  margin: "6px 0 0",
  color: "#4b3f42",
  lineHeight: "1.5",
},

emptyBox: {
  background: "#f8f4ee",
  borderRadius: "16px",
  padding: "16px",
  color: "#777",
},

  empty: {
    color: "#777",
    fontWeight: "800",
  },
};

const css = `
.product-card button.wishlistPulse {
  animation: pulseHeartDesktop 1.35s ease-in-out infinite !important;
  transform-origin: center center;
  will-change: transform;
}

.product-card button.wishlistPulse svg {
  animation: pulseHeartIcon 1.35s ease-in-out infinite !important;
  transform-origin: center center;
}

.product-card button.wishlistPulse:hover {
  animation-play-state: paused;
  filter: brightness(1.05);
  box-shadow: 0 10px 22px rgba(80,36,42,0.2);
}

@keyframes pulseHeartDesktop {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.14);
  }
}

@keyframes pulseHeartIcon {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.18);
  }
}

.cardHover:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 38px rgba(80,36,42,0.18) !important;
}

.cardHover:hover img {
  transform: scale(1.06);
}

.product-card .imageShine {
  position: relative;
  overflow: hidden;
}

.product-card .imageShine::after {
  content: "";
  position: absolute;
  top: 0;
  left: -140%;
  width: 70%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.28),
    transparent
  );

  transform: skewX(-20deg);
  transition: 0.8s ease;
}

.product-card:hover .imageShine::after {
  left: 180%;
}

.hideScrollbar::-webkit-scrollbar {
  display: none;
}

.navbar {
  backdrop-filter: blur(18px);
  background: rgba(80,36,42,0.88) !important;
  border-bottom: 1px solid rgba(163,133,96,0.18);
  box-shadow: 0 10px 30px rgba(80,36,42,0.18);
}

.navbar button:hover,
.navbar svg:hover {
  color: #D6B37A !important;
}

.navbar button,
.navbar svg {
  transition: all 0.25s ease;
}

.navbar button:hover {
  transform: translateY(-1px);
}

.shop-hero-offset {
  padding-top: 60px;
}

.products-section,
.boutique-section,
.luxe-section,
.beauty-match-cta {
  scroll-margin-top: 112px;
}

.luxury-search::placeholder {
  color: rgba(42,15,22,0.55);
  font-weight: 700;
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

.search-shell {
  position: relative;
  width: 320px;
  max-width: 100%;
}

.search-shell .luxury-search {
  width: 100% !important;
  padding-right: 76px !important;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  background: #50242A;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.smart-filter-bar {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr)) auto auto;
  gap: 12px;
  align-items: end;
  margin: 6px 0 20px;
  padding: 14px;
  border-radius: 22px;
  background: #f8f4ee;
  border: 1px solid rgba(163,133,96,.18);
}

.smart-filter-bar label {
  display: grid;
  gap: 7px;
  color: #50242A;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .6px;
  text-transform: uppercase;
}

.smart-filter-bar select {
  width: 100%;
  border: 1px solid #eadfd6;
  border-radius: 14px;
  background: #fff;
  color: #2b2023;
  padding: 11px 12px;
  font-weight: 800;
  outline: none;
}

.deal-toggle,
.reset-filter-btn,
.empty-products button {
  border: none;
  border-radius: 14px;
  padding: 12px 15px;
  font-weight: 900;
  cursor: pointer;
}

.deal-toggle {
  background: #fff;
  color: #50242A;
  border: 1px solid #eadfd6;
}

.deal-toggle.active,
.reset-filter-btn,
.empty-products button {
  background: #50242A;
  color: #fff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
  gap: 18px;
  align-items: stretch;
}

.product-grid .product-card {
  min-width: 0 !important;
  max-width: none !important;
  width: 100%;
}

.product-label-stack {
  position: absolute;
  left: 12px;
  bottom: 62px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100% - 24px);
  z-index: 6;
}

.product-label-stack span {
  border-radius: 999px;
  padding: 6px 9px;
  background: rgba(255,255,255,.9);
  color: #50242A;
  font-size: 9px;
  font-weight: 900;
  box-shadow: 0 8px 16px rgba(0,0,0,.08);
}

.product-ai-match {
  margin-top: 9px;
  padding: 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(163,133,96,.16), #f8f4ee);
  color: #50242A;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 900;
}

.product-match-ring {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.product-match-ring span {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #fff;
  display: grid;
  place-items: center;
  color: #50242A;
  font-size: 10px;
  font-weight: 900;
}

.product-ai-match small {
  display: block;
  color: #A38560;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 3px;
}

.product-ai-match strong {
  display: block;
  color: #50242A;
  font-size: 12px;
}

.shop-quick-view {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .28s ease, transform .28s ease, box-shadow .25s ease;
}

.product-card:hover .shop-quick-view,
.shop-quick-view:focus-visible {
  opacity: 1;
  transform: translateY(0);
}

.viewLuxuryBtn:hover {
  box-shadow: 0 12px 24px rgba(80,36,42,.14);
}

.empty-products {
  padding: 34px 18px;
  border-radius: 24px;
  background: #fff;
  color: #50242A;
  text-align: center;
  box-shadow: 0 14px 34px rgba(80,36,42,.08);
}

.empty-products svg {
  color: #A38560;
  font-size: 34px;
}

.empty-products h3 {
  margin: 12px 0 8px;
  font-family: Georgia, serif;
  font-size: 28px;
}

.empty-products p {
  max-width: 520px;
  margin: 0 auto 12px;
  color: #75686a;
  font-weight: 800;
  line-height: 1.6;
}

.empty-products small {
  display: block;
  margin-bottom: 16px;
  color: #A38560;
  font-weight: 900;
}

.shop-modal-gallery {
  width: 100%;
  height: 100%;
  min-height: 520px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  box-sizing: border-box;
}

.shop-modal-gallery img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  border-radius: 18px;
  display: block;
}

.shop-modal-gallery img:only-child {
  grid-column: 1 / -1;
}

.shop-modal-gallery img:nth-child(3):last-child {
  grid-column: 1 / -1;
  max-height: 260px;
}

@media (max-width: 900px) {
  .shop-floating-modal {
    grid-template-columns: 1fr !important;
    width: min(560px, 96vw) !important;
  }

  .shop-floating-modal > div:first-of-type {
    position: relative !important;
    min-height: 300px !important;
    height: 300px !important;
  }

  .shop-floating-modal > div:nth-of-type(2) {
    grid-column: 1 / -1 !important;
    grid-row: auto !important;
    padding: 24px 18px 22px !important;
  }

  .shop-modal-gallery {
    min-height: 300px !important;
  }
}

@media (max-width: 700px) {
  main {
    padding: 0 10px 24px !important;
  }

  .beauty-match-cta {
    flex-direction: column !important;
    align-items: flex-start !important;
    padding: 18px 16px !important;
    border-radius: 20px !important;
  }

  .beauty-match-btn {
    width: 100% !important;
  }

  .shop-hero-offset {
    padding-top: 112px !important;
  }

  .products-section {
    margin-top: 14px !important;
    padding: 20px 10px !important;
    border-radius: 22px !important;
  }

  .boutique-section,
  .luxe-section {
    margin: 16px 0 !important;
    padding: 24px 14px !important;
    border-radius: 22px !important;
  }

  .product-row {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12px !important;
    overflow: visible !important;
    padding-bottom: 18px !important;
    width: 100% !important;
  }

  .product-card {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    border-radius: 17px !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  .product-card > div:first-child {
    height: 145px !important;
  }

  .product-card > div:last-child {
    padding: 10px !important;
  }

  .product-card h3 {
    font-size: 12.5px !important;
    line-height: 1.2 !important;
    margin: 4px 0 0 !important;
  }

  .product-card p {
    font-size: 10.5px !important;
    line-height: 1.3 !important;
  }

  .product-card > div:last-child > p:nth-of-type(2) {
    min-height: 30px !important;
    max-height: 30px !important;
    overflow: hidden !important;
    margin: 5px 0 8px !important;
  }

  .product-card > div:last-child > div:last-child {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    align-items: stretch !important;
    gap: 7px !important;
    padding-top: 8px !important;
  }

  .product-card > div:last-child > div:last-child > div:first-child {
    grid-column: 1 / -1 !important;
    min-width: 0 !important;
  }

  .product-card > div:last-child > div:last-child span {
    font-size: 11.5px !important;
  }

  .product-card > div:last-child > div:last-child button {
    width: 100% !important;
    min-width: 0 !important;
    height: 32px !important;
    padding: 0 6px !important;
    font-size: 9.5px !important;
    border-radius: 10px !important;
    gap: 4px !important;
    white-space: nowrap !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .product-card:hover,
  .cardHover:hover {
    transform: none !important;
  }

  .product-card .addLuxuryBtn {
  position: relative;
  overflow: hidden;
}

.product-card .addLuxuryBtn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.25),
    transparent
  );

  transition: 0.7s ease;
}

.product-card .addLuxuryBtn:hover::before {
  left: 120%;
}

.product-card .addLuxuryBtn:hover {
  box-shadow: 0 12px 28px rgba(80,36,42,0.28);
}

  .product-card {
  backdrop-filter: blur(16px);
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(163,133,96,0.10);
  transition: all 0.35s ease;
}

.product-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(212,175,122,0.35),
    rgba(255,255,255,0.05),
    rgba(80,36,42,0.18)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}

  .luxury-search {
    width: 100% !important;
    height: 46px !important;
  }

  .search-shell {
    width: 100% !important;
  }

  .smart-filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 9px !important;
    padding: 10px !important;
    border-radius: 16px !important;
  }

  .smart-filter-bar label {
    font-size: 9px !important;
  }

  .smart-filter-bar select {
    min-width: 0 !important;
    padding: 10px 8px !important;
    font-size: 11px !important;
  }

  .deal-toggle,
  .reset-filter-btn {
    min-height: 38px !important;
    padding: 9px !important;
    font-size: 11px !important;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12px !important;
  }

  .product-label-stack {
    left: 8px !important;
    bottom: 52px !important;
    gap: 4px !important;
  }

  .product-label-stack span {
    padding: 4px 6px !important;
    font-size: 7.5px !important;
  }

  .product-ai-match {
    padding: 7px !important;
    font-size: 9px !important;
  }

  .product-ai-match strong {
    font-size: 10px !important;
  }

  .product-match-ring {
    width: 34px !important;
    height: 34px !important;
  }

  .product-match-ring span {
    width: 28px !important;
    height: 28px !important;
    font-size: 8px !important;
  }

  .shop-quick-view {
    display: none !important;
  }

  .footer {
    margin: 18px 0 0 !important;
    padding: 26px 18px !important;
    border-radius: 20px !important;
  }

  .footer-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 18px !important;
  }

  .footer-grid > div:first-child {
    grid-column: 1 / -1 !important;
  }

  .footer h2 {
    font-size: 20px !important;
  }

  .footer h3 {
    font-size: 11px !important;
    margin-bottom: 8px !important;
  }

  .footer p,
  .footer a,
  .footer li {
    font-size: 11px !important;
    line-height: 1.5 !important;
  }
  
 /* TOP NAVBAR */
.navbar {
  height: auto !important;
  min-height: 54px !important;
  padding: 8px !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
}

.logo {
  font-size: 16px !important;
  line-height: 1 !important;
}

.nav-right {
  gap: 5px !important;
}

.topbar-search {
  order: 3 !important;
  flex: 0 0 100% !important;
  max-width: none !important;
  width: 100% !important;
  height: 38px !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}

.menu-icon,
.nav-action {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  font-size: 13px !important;
}

/* BOUTIQUE / LUXE NAV BANNERS */
.boutique-section,
.luxe-section {
  margin: 10px 0 12px !important;
  padding: 16px 10px !important;
  border-radius: 16px !important;
}

.boutique-section h2,
.luxe-section h2 {
  font-size: 20px !important;
  line-height: 1.05 !important;
  margin-top: 6px !important;
}

.boutique-section p,
.luxe-section p {
  font-size: 10px !important;
  line-height: 1.3 !important;
}

.boutique-section button {
  padding: 7px 10px !important;
  font-size: 10px !important;
}

.cardHover:hover img {
  transform: scale(1.06);
}

.cardHover {
  transition: all 0.35s ease;
}

.cardHover:hover {
  transform: translateY(-10px);
  box-shadow: 0 26px 60px rgba(80,36,42,0.24) !important;
}

.product-card button {
  transition: filter 0.25s ease, box-shadow 0.25s ease;
}

.product-card .wishlistPulse {
  animation: pulseHeart 1.35s ease-in-out infinite;
  transform-origin: center;
}

.product-card .wishlistPulse:hover {
  filter: brightness(1.05);
  box-shadow: 0 10px 22px rgba(80,36,42,0.2);
}

@keyframes pulseHeart {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.14);
  }
}

.product-card button:hover {
  filter: brightness(1.05);
}

.product-card button:active {
  transform: scale(0.96);
 }

.product-card > div:first-child::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 55%,
    rgba(80,36,42,0.10)
  );
  pointer-events: none;
 }
}
}
  `;
