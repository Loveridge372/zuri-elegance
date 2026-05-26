import { useEffect, useMemo, useState } from "react";
import { FaFloppyDisk, FaImage, FaMagnifyingGlass, FaPen, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import AdminLayout from "./AdminLayout";
import { adminFetch, money } from "./adminApi";

const WINE = "#50242A";
const GOLD = "#A38560";
const EMERALD = "#07332c";

const emptyForm = {
  name: "",
  brand: "",
  category: "",
  subcategory: "",
  price: "",
  stock: "",
  discount_percent: "",
  promotion_text: "",
  description: "",
  image_url: "",
  image_url_2: "",
  image_url_3: "",
  image_url_4: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    adminFetch("/admin/products")
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name || ""} ${product.brand || ""} ${product.category || ""} ${product.subcategory || ""}`.toLowerCase();
      return (
        text.includes(search.toLowerCase()) &&
        (categoryFilter === "All" || product.category === categoryFilter)
      );
    });
  }, [products, search, categoryFilter]);

  const saveProduct = async (event) => {
    event.preventDefault();
    setMessage("");

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    imageFiles.forEach((file) => data.append("images", file));

    try {
      await adminFetch(editingId ? `/admin/products/${editingId}` : "/admin/products", {
        method: editingId ? "PATCH" : "POST",
        body: data,
      });
      setMessage(editingId ? "Product updated successfully." : "Product created successfully.");
      setForm(emptyForm);
      setImageFiles([]);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setImageFiles([]);
    setForm({
      ...emptyForm,
      ...Object.fromEntries(
        Object.keys(emptyForm).map((key) => [key, product[key] ?? ""])
      ),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setImageFiles((currentFiles) => {
      const nextFiles = [...currentFiles];

      selectedFiles.forEach((file) => {
        const alreadySelected = nextFiles.some(
          (existingFile) =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );

        if (!alreadySelected && nextFiles.length < 4) {
          nextFiles.push(file);
        }
      });

      return nextFiles;
    });

    event.target.value = "";
  };

  const removeSelectedImage = (imageIndex) => {
    setImageFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== imageIndex)
    );
  };

  const selectedPreviews = useMemo(
    () => imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    })),
    [imageFiles]
  );

  useEffect(() => {
    return () => selectedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedPreviews]);

  const existingImages = [form.image_url, form.image_url_2, form.image_url_3, form.image_url_4].filter(Boolean);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await adminFetch(`/admin/products/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AdminLayout title="Products Management">
      <style>{css}</style>

      <section className="admin-hero">
        <div>
          <p>PRODUCT CATALOG</p>
          <h1>Manage Zuri Products</h1>
          <span>Add, edit, search and track low-stock luxury inventory.</span>
        </div>
        <button onClick={() => { setForm(emptyForm); setImageFiles([]); setEditingId(null); }}>
          <FaPlus /> New Product
        </button>
      </section>

      <section className="grid">
        <form className="panel form" onSubmit={saveProduct}>
          <p className="kicker">{editingId ? "EDIT PRODUCT" : "ADD PRODUCT"}</p>
          <h2>{editingId ? "Update Product" : "Create Product"}</h2>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <div className="two">
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          </div>
          <div className="two">
            <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="two">
            <input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
            <input placeholder="Promotion text" value={form.promotion_text} onChange={(e) => setForm({ ...form, promotion_text: e.target.value })} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="image-picker">
            <FaImage />
            <span>
              {imageFiles.length
                ? imageFiles.length === 4
                  ? "4/4 images selected"
                  : `${imageFiles.length}/4 selected - add more images`
                : "Choose product images"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
          </label>
          <div className="image-note">
            Choose up to 4 images from your files. {editingId ? "New selections replace the current product images." : "The first image becomes the main product photo."}
          </div>
          {(selectedPreviews.length > 0 || existingImages.length > 0) && (
            <div className="preview-grid">
              {(selectedPreviews.length ? selectedPreviews : existingImages.map((url, index) => ({ url, name: `Current image ${index + 1}` }))).map((image, index) => (
                <div className="preview" key={image.url}>
                  <img src={image.url} alt={image.name} />
                  {selectedPreviews.length > 0 && (
                    <button
                      type="button"
                      className="preview-remove"
                      onClick={() => removeSelectedImage(index)}
                    >
                      <FaXmark />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {message && <div className="message">{message}</div>}
          <button className="save" type="submit"><FaFloppyDisk /> Save Product</button>
        </form>

        <section className="panel">
          <div className="toolbar">
            <div className="search"><FaMagnifyingGlass /><input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="empty">Loading products...</div>
          ) : filteredProducts.length ? (
            <div className="products">
              {filteredProducts.map((product) => (
                <article className="product" key={product.id}>
                  <div className="thumb">{product.image_url ? <img src={product.image_url} alt={product.name} /> : "ZE"}</div>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.brand || "No brand"} • {product.category || "No category"} / {product.subcategory || "No subcategory"}</small>
                    <span>{money(product.price)} • Stock {product.stock || 0}</span>
                    {Number(product.stock || 0) <= 5 && <b>Low Stock</b>}
                  </div>
                  <div className="actions">
                    <button onClick={() => editProduct(product)}><FaPen /></button>
                    <button className="danger" onClick={() => deleteProduct(product.id)}><FaTrash /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">No products found.</div>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}

const css = `
.admin-hero{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:30px;border-radius:30px;color:#fff;background:linear-gradient(135deg,${EMERALD},${WINE},#1f0f12);box-shadow:0 24px 60px rgba(7,51,44,.22)}
.admin-hero p,.kicker{margin:0;color:${GOLD};font-weight:900;letter-spacing:2px;font-size:12px}.admin-hero h1{margin:8px 0;font-family:Georgia,serif;font-size:38px}.admin-hero span{color:rgba(255,255,255,.78);font-weight:700}
.admin-hero button,.save{border:none;border-radius:16px;padding:13px 16px;background:linear-gradient(135deg,${GOLD},#f7e7ce);color:#2b1114;font-weight:900;cursor:pointer;display:flex;gap:8px;align-items:center}
.grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:18px;margin-top:18px}.panel{background:rgba(255,255,255,.94);border:1px solid rgba(7,51,44,.12);border-radius:26px;padding:22px;box-shadow:0 18px 42px rgba(7,51,44,.09)}.panel h2{font-family:Georgia,serif;color:${WINE};margin:7px 0 16px}
input,textarea,select{width:100%;box-sizing:border-box;border:1px solid rgba(7,51,44,.14);border-radius:15px;background:#fffaf5;padding:13px;margin-bottom:10px;font-weight:800;color:#1f1719;-webkit-text-fill-color:#1f1719;caret-color:${WINE}}input::placeholder,textarea::placeholder{color:#6f5f63;opacity:1}.form input:focus,.form textarea:focus,.form select:focus{outline:2px solid rgba(163,133,96,.45);border-color:${GOLD};background:#fff;color:#1f1719;-webkit-text-fill-color:#1f1719}textarea{min-height:94px}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.image-picker{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;border:1px dashed rgba(7,51,44,.35);border-radius:15px;background:#f8f4ee;padding:16px;margin-bottom:8px;color:${EMERALD};font-weight:900;cursor:pointer}.image-picker input{display:none}.image-note{margin:-2px 0 12px;color:#75686a;font-size:12px;font-weight:800;line-height:1.45}.preview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}.preview{aspect-ratio:1;border-radius:14px;overflow:hidden;background:#f8f4ee;border:1px solid rgba(7,51,44,.12);position:relative}.preview img{width:100%;height:100%;object-fit:cover;display:block}.preview-remove{position:absolute;top:6px;right:6px;width:28px;height:28px;border:none;border-radius:999px;background:rgba(80,36,42,.9);color:#fff;display:grid;place-items:center;cursor:pointer}
.toolbar{display:grid;grid-template-columns:1fr 180px;gap:10px}.search{display:flex;align-items:center;gap:9px;border:1px solid rgba(7,51,44,.14);border-radius:15px;background:#f8f4ee;padding:0 12px;color:${EMERALD}}.search input{border:none;margin:0;background:transparent}
.products{display:grid;gap:12px}.product{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:center;padding:12px;border-radius:18px;background:#f8f4ee;border:1px solid rgba(7,51,44,.08)}.thumb{width:72px;height:72px;border-radius:16px;background:${EMERALD};color:${GOLD};display:grid;place-items:center;overflow:hidden;font-weight:900}.thumb img{width:100%;height:100%;object-fit:cover}.product strong,.product small,.product span{display:block}.product strong{color:${WINE}}.product small{color:#75686a;font-weight:800}.product span{color:${EMERALD};font-weight:900;margin-top:4px}.product b{display:inline-block;margin-top:6px;color:#b14343}.actions{display:flex;gap:8px}.actions button{border:none;border-radius:12px;width:38px;height:38px;background:${EMERALD};color:#fff;cursor:pointer}.actions .danger{background:#b14343}.message,.empty{padding:14px;border-radius:15px;background:#fff;color:${WINE};font-weight:900}
@media(max-width:1000px){.grid,.two,.toolbar{grid-template-columns:1fr}.preview-grid{grid-template-columns:repeat(2,1fr)}.admin-hero{flex-direction:column;align-items:flex-start}.product{grid-template-columns:64px 1fr}.actions{grid-column:1/-1}}
`;
