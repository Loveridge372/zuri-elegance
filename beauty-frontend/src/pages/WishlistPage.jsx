import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { FaHeart, FaShoppingCart, FaTrash, FaArrowLeft } from "react-icons/fa";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function WishlistPage() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const res = await fetch(`${API_BASE}/wishlist/${user.id}`);
      const data = await res.json();
      setWishlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("WISHLIST ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    await fetch(`${API_BASE}/wishlist/${user.id}/${productId}`, {
      method: "DELETE",
    });

    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const addToCart = async (product) => {
    const res = await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, product_id: product.id, quantity: 1 }),
    });

    if (!res.ok) {
      alert("Failed to add to cart");
      return;
    }

    alert("Added to cart ✅");
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

      <main className="wishlist-page">
        <button className="back-btn" onClick={() => navigate("/products")}>
          <FaArrowLeft /> Back to Shop
        </button>

        <section className="wishlist-hero">
          <p>ZURI FAVORITES</p>
          <h1>My Wishlist</h1>
          <span>Your saved luxury beauty picks.</span>
        </section>

        {loading ? (
          <div className="empty">
            <FaHeart />
            <h2>Loading wishlist...</h2>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="empty">
            <FaHeart />
            <h2>No wishlist items yet</h2>
            <button onClick={() => navigate("/products")}>Continue Shopping</button>
          </div>
        ) : (
          <section className="wishlist-grid">
            {wishlist.map((product) => {
              const image =
                product.image_url ||
                product.image_url_2 ||
                product.image_url_3 ||
                product.image_url_4 ||
                product.image ||
                "";

              return (
                <article key={product.id} className="wishlist-card">
                  <div className="image-wrap">
                    {image ? (
                      <img src={image} alt={product.name} />
                    ) : (
                      <div className="no-image">ZURI</div>
                    )}
                  </div>

                  <div className="card-body">
                    <p>{product.category || "Hair"}</p>
                    <h3>{product.name}</h3>
                    <strong>R {Number(product.price || 0).toFixed(2)}</strong>

                    <div className="actions">
                      <button onClick={() => addToCart(product)}>
                        <FaShoppingCart /> Add
                      </button>

                      <button className="remove" onClick={() => removeItem(product.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}

const css = `
.wishlist-page {
  padding: 110px 20px 40px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,0.18), transparent 34%),
    #f8f4ee;
  min-height: 100vh;
}

.back-btn {
  background: ${WINE};
  color: #fff;
  border: none;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
}

.wishlist-hero {
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  color: #fff;
  border-radius: 30px;
  padding: 36px;
  margin-bottom: 28px;
  box-shadow: 0 22px 55px rgba(80,36,42,0.22);
}

.wishlist-hero p {
  margin: 0;
  color: ${GOLD};
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.wishlist-hero h1 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 44px;
}

.wishlist-hero span {
  color: rgba(255,255,255,0.78);
  font-weight: 700;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 22px;
}

.wishlist-card {
  background: rgba(255,255,255,0.92);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 14px 34px rgba(80,36,42,0.10);
  border: 1px solid rgba(80,36,42,0.08);
}

.image-wrap {
  height: 260px;
  background: #f1ebe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: ${GOLD};
  font-weight: 900;
}

.card-body {
  padding: 16px;
}

.card-body p {
  margin: 0;
  color: ${GOLD};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.card-body h3 {
  margin: 8px 0;
  color: #2b2023;
  font-weight: 900;
}

.card-body strong {
  display: block;
  color: ${WINE};
  font-weight: 900;
  margin-bottom: 14px;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  border: none;
  background: ${WINE};
  color: #fff;
  border-radius: 14px;
  padding: 12px;
  font-weight: 900;
  cursor: pointer;
}

.actions .remove {
  flex: 0;
  min-width: 48px;
  background: #f8eaea;
  color: #b42318;
}

.empty {
  background: #fff;
  border-radius: 28px;
  padding: 48px 20px;
  text-align: center;
  color: ${WINE};
  font-weight: 900;
  box-shadow: 0 14px 34px rgba(80,36,42,0.09);
}

.empty svg {
  font-size: 38px;
  color: ${GOLD};
}

.empty button {
  margin-top: 16px;
  border: none;
  background: ${WINE};
  color: #fff;
  border-radius: 16px;
  padding: 14px 20px;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 700px) {
  .wishlist-page {
    padding: 95px 14px 34px;
  }

  .wishlist-hero {
    padding: 26px;
    border-radius: 24px;
  }

  .wishlist-hero h1 {
    font-size: 34px;
  }

  .wishlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .image-wrap {
    height: 150px;
  }

  .card-body {
    padding: 11px;
  }

  .card-body h3 {
    font-size: 13px;
    line-height: 1.2;
  }

  .card-body p {
    font-size: 10px;
  }

  .actions {
    flex-direction: column;
  }

  .actions .remove {
    width: 100%;
  }
}
`;