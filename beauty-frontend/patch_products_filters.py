from pathlib import Path

path = Path("src/pages/ProductsPage.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProductsPage.jsx. Make sure you are inside beauty-frontend.")

text = path.read_text(encoding="utf-8")

backup = Path("src/pages/ProductsPage.backup-before-filters.jsx")
backup.write_text(text, encoding="utf-8")

# 1. Add filter states
old_state = 'const [activeCategory, setActiveCategory] = useState("All");'
new_state = '''const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [dealOnly, setDealOnly] = useState(false);'''

if "activeSubcategory" not in text:
    text = text.replace(old_state, new_state)

# 2. Replace categoryFiltered logic
old_filter = '''const categoryFiltered = useMemo(() => {
    const selected = categories.find((c) => c.label === activeCategory);
    if (!selected || activeCategory === "All") return searchFiltered;

    return searchFiltered.filter((p) => {
      const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();
      return selected.terms.some((term) => text.includes(term));
    });
  }, [searchFiltered, activeCategory]);'''

new_filter = '''const categoryFiltered = useMemo(() => {
    const selected = categories.find((c) => c.label === activeCategory);

    return searchFiltered.filter((p) => {
      const text = `${p.name || ""} ${p.description || ""} ${p.category || ""} ${p.subcategory || ""}`.toLowerCase();

      const matchesCategory =
        activeCategory === "All" ||
        selected?.terms.some((term) => text.includes(term));

      const matchesSubcategory =
        activeSubcategory === "All" ||
        text.includes(activeSubcategory.toLowerCase());

      const price = Number(p.price || 0);

      const matchesPrice =
        priceFilter === "All" ||
        (priceFilter === "Under R500" && price < 500) ||
        (priceFilter === "R500 - R1000" && price >= 500 && price <= 1000) ||
        (priceFilter === "Over R1000" && price > 1000);

      const stock = Number(p.stock || p.quantity || p.stock_quantity || p.inventory || 0);

      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "In Stock" && stock > 0) ||
        (stockFilter === "Out of Stock" && stock <= 0);

      const discount = Number(p.discount_percent || 0);

      const matchesDeal =
        !dealOnly || discount > 0 || Boolean(p.promotion_text);

      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesPrice &&
        matchesStock &&
        matchesDeal
      );
    });
  }, [
    searchFiltered,
    activeCategory,
    activeSubcategory,
    priceFilter,
    stockFilter,
    dealOnly,
  ]);'''

if old_filter in text:
    text = text.replace(old_filter, new_filter)
else:
    print("⚠️ Could not auto-replace categoryFiltered. It may already be changed.")

# 3. Add filter UI after category menu
old_ui_end = '''          </div>
        </section>

        <section style={styles.productsSection}>'''

new_ui_end = '''          </div>

          <div style={styles.filterBar}>
            <select
              value={activeSubcategory}
              onChange={(e) => setActiveSubcategory(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Subcategories</option>
              <option value="Wigs">Wigs</option>
              <option value="Bundles">Bundles</option>
              <option value="Closures">Closures</option>
              <option value="Frontals">Frontals</option>
              <option value="Beauty">Beauty</option>
              <option value="Accessories">Accessories</option>
            </select>

            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Prices</option>
              <option value="Under R500">Under R500</option>
              <option value="R500 - R1000">R500 - R1000</option>
              <option value="Over R1000">Over R1000</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Stock</option>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <button
              onClick={() => setDealOnly(!dealOnly)}
              style={dealOnly ? styles.dealBtnActive : styles.dealBtn}
            >
              Deals Only
            </button>
          </div>
        </section>

        <section style={styles.productsSection}>'''

if "styles.filterBar" not in text:
    text = text.replace(old_ui_end, new_ui_end, 1)

# 4. Add filter styles
old_styles_spot = '''  resultCount: {'''

new_styles = '''  filterBar: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "10px",
  },

  filterSelect: {
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "#fff",
    color: WINE,
    fontWeight: "900",
    outline: "none",
    cursor: "pointer",
  },

  dealBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: "900",
    cursor: "pointer",
  },

  dealBtnActive: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid rgba(163,133,96,0.8)",
    background: GOLD,
    color: "#2b1114",
    fontWeight: "900",
    cursor: "pointer",
  },

  resultCount: {'''

if "filterSelect:" not in text:
    text = text.replace(old_styles_spot, new_styles, 1)

path.write_text(text, encoding="utf-8")

print("✅ ProductsPage.jsx updated with search + filters.")
print("✅ Backup created: src/pages/ProductsPage.backup-before-filters.jsx")
