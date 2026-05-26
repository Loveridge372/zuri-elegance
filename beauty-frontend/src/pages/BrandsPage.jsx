import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBars, FaCrown, FaTags } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Seo from "../components/Seo";
import API_BASE from "../services/api";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

export default function BrandsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandRows, setBrandRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/brands`)
      .then((res) => res.json())
      .then((data) => setBrandRows(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("BRANDS LOAD ERROR:", err);
        setBrandRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const brands = useMemo(() => {
    return brandRows
      .map((brand) => ({
        name: (brand.name || "").trim(),
        productCount: Number(brand.product_count || 0),
        categories: Array.isArray(brand.categories) ? brand.categories : [],
        heroImage: brand.image_url || "",
      }))
      .filter((brand) => brand.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [brandRows]);

  const brandNames = useMemo(
    () => ["All", ...brands.map((brand) => brand.name)],
    [brands]
  );

  const openBrand = (brand) => {
    navigate(`/products?brand=${encodeURIComponent(brand)}`);
  };

  return (
    <>
      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <Seo
        title="Shop By Brand | Zuri Elegance"
        description="Browse beauty, hair and lifestyle brands available from Zuri Elegance."
      />
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
        brands={brandNames}
        onBrandSelect={(brand) => {
          if (brand === "All") {
            navigate("/products");
            return;
          }

          openBrand(brand);
        }}
      />

      <main className="brands-page">
        <style>{css}</style>

        <section className="brands-hero">
          <div className="hero-icon">
            <FaTags />
          </div>

          <p>BRAND DIRECTORY</p>
          <h1>Shop By Brand</h1>
          <span>
            Explore every beauty, hair and lifestyle brand available at Zuri Elegance.
          </span>
        </section>

        {loading ? (
          <section className="brand-empty">Loading brands...</section>
        ) : brands.length ? (
          <section className="brand-grid">
            {brands.map((brand) => (
              <article className="brand-card" key={brand.name}>
                <div className="brand-image">
                  {brand.heroImage ? (
                    <img src={brand.heroImage} alt={brand.name} />
                  ) : (
                    <FaCrown />
                  )}
                </div>

                <div className="brand-copy">
                  <p>{brand.productCount} PRODUCT{brand.productCount === 1 ? "" : "S"}</p>
                  <h2>{brand.name}</h2>
                  <span>
                    {brand.categories
                      .slice(0, 3)
                      .filter(Boolean)
                      .join(" | ") || "Curated Zuri selection"}
                  </span>

                  <button type="button" onClick={() => openBrand(brand.name)}>
                    Shop Brand
                    <FaArrowRight />
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="brand-empty">
            <FaBars />
            <h2>No brands yet</h2>
            <p>Add brand names to products in Admin Products, then they will appear here.</p>
          </section>
        )}
      </main>
    </>
  );
}

const css = `
.brands-page {
  min-height: 100vh;
  padding: 86px 20px 42px;
  background: linear-gradient(180deg, #f8f4ee, #fffaf5);
  font-family: Inter, Arial, sans-serif;
}

.brands-hero {
  max-width: 1180px;
  margin: 0 auto 22px;
  padding: 34px 28px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.26), transparent 34%),
    linear-gradient(135deg, ${EMERALD}, ${WINE}, #1f0f12);
  color: #fff;
  box-shadow: 0 24px 60px rgba(80,36,42,.22);
}

.hero-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.12);
  color: ${GOLD};
  margin-bottom: 14px;
}

.brands-hero p,
.brand-copy p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.8px;
}

.brands-hero h1 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 42px;
}

.brands-hero span {
  color: rgba(255,255,255,.76);
  font-weight: 700;
  line-height: 1.6;
}

.brand-grid {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 18px;
}

.brand-card {
  overflow: hidden;
  border-radius: 24px;
  background: #fff;
  border: 1px solid rgba(163,133,96,.16);
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
}

.brand-image {
  height: 190px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f8f4ee, #efe3d6);
  color: ${GOLD};
  font-size: 38px;
  overflow: hidden;
}

.brand-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand-copy {
  padding: 18px;
}

.brand-copy h2 {
  margin: 7px 0 6px;
  color: ${WINE};
  font-family: Georgia, serif;
  font-size: 26px;
}

.brand-copy span {
  display: block;
  min-height: 40px;
  color: #75686a;
  font-weight: 800;
  line-height: 1.5;
}

.brand-copy button {
  margin-top: 16px;
  width: 100%;
  border: none;
  border-radius: 15px;
  padding: 13px 14px;
  background: ${WINE};
  color: #fff;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.brand-empty {
  max-width: 720px;
  margin: 0 auto;
  padding: 34px 18px;
  border-radius: 24px;
  background: #fff;
  color: ${WINE};
  text-align: center;
  font-weight: 900;
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
}

.brand-empty p {
  color: #75686a;
}

@media (max-width: 700px) {
  .brands-page {
    padding: 74px 12px 28px;
  }

  .brands-hero {
    padding: 26px 18px;
    border-radius: 22px;
  }

  .brands-hero h1 {
    font-size: 32px;
  }

  .brand-grid {
    grid-template-columns: 1fr;
  }
}
`;
