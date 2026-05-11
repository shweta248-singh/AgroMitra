import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTranslation } from 'react-i18next';
import "./ModernSellerDashboard.css";

const dummyOrders = [
  { id: "ORD-101", product: "Organic Wheat", buyer: "Rahul Sharma", qty: 5, status: "Pending" },
  { id: "ORD-102", product: "Rice Seeds", buyer: "Amit Singh", qty: 2, status: "Shipped" },
  { id: "ORD-103", product: "NPK Fertilizer", buyer: "Vikas Kumar", qty: 1, status: "Delivered" },
];

const ModernSellerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("addProduct");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // Tab 1: Add Product State
  const [productData, setProductData] = useState({ name: "", price: "", description: "", unit: "piece" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Tab 2: Product List State
  const [products, setProducts] = useState([]);

  // Tab 4: Seller Account State
  const [accountData, setAccountData] = useState({
    seller_name: "", email: "", phone: "", address: "",
    shop_name: "", bank_account_number: "", ifsc_code: "", upi_id: ""
  });

  useEffect(() => {
    if (activeTab === "productList") fetchProducts();
    if (activeTab === "sellerAccount") fetchAccountDetails();
  }, [activeTab]);

  // --- TAB 1: ADD PRODUCT LOGIC ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productData.name || !productData.price || !imageFile) {
      setStatus({ type: "error", message: "All fields and an image are required." });
      return;
    }
    if (imageFile.size > 2 * 1024 * 1024) {
      setStatus({ type: "error", message: "Image size must be less than 2MB." });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      // 1. Upload to storage
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("seller_product")
        .upload(fileName, imageFile);
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("seller_product")
        .getPublicUrl(fileName);

      // 3. Direct Supabase Insert (Recommended Fix for 401)
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      const generateSlug = (name) => {
        return name
          .toLowerCase()
          .replace(/[^\w ]+/g, "")
          .replace(/ +/g, "-") + "-" + Date.now().toString(36);
      };

      const productPayload = {
        farmer_id: user?.id,
        seller_id: user?.id, // Keep both for safety
        name: productData.name,
        slug: generateSlug(productData.name),
        price: parseFloat(productData.price),
        description: productData.description,
        unit: productData.unit || "piece",
        image: publicUrl,
        image_url: publicUrl, // Duplicate column sync
        stock: 100, 
        stock_quantity: 100, // Duplicate column sync
        category: "seeds", 
        is_active: true,
        is_approved: true, // Auto-approve
      };

      console.log("ADDING PRODUCT (Modern):", productPayload);

      const { data: newProduct, error: dbError } = await supabase
        .from("products")
        .insert([productPayload])
        .select()
        .single();

      if (dbError) throw dbError;

      console.log("ADDED PRODUCT (Modern):", newProduct);

      setStatus({ type: "success", message: "Product added successfully! 🌱" });
      setProductData({ name: "", price: "", description: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // --- TAB 2: PRODUCT LIST LOGIC ---
  const fetchProducts = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`farmer_id.eq.${userData.user.id},seller_id.eq.${userData.user.id}`)
      .order("created_at", { ascending: false });

    console.log("FETCHED SELLER PRODUCTS (Modern):", data);
    if (!error) setProducts(data);
    else console.error("Fetch Error:", error);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchProducts();
    else alert("Delete failed: " + error.message);
  };

  // --- TAB 4: SELLER ACCOUNT LOGIC ---
  const fetchAccountDetails = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("seller_account").select("*").eq("id", user.id).single();
    if (data) setAccountData(data);
    else setAccountData(prev => ({ ...prev, id: user.id, email: user.email }));
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from("seller_account").upsert(accountData);
      if (error) throw error;
      setStatus({ type: "success", message: "Account updated successfully!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    navigate("/seller-login");
  };

  return (
    <div className="msd-root">
      {/* Sidebar Navigation */}
      <aside className="msd-sidebar">
        <div className="msd-logo">
          <span className="msd-logo-icon">🌱</span>
          <span className="msd-logo-text">AgroMitra</span>
        </div>
        <nav className="msd-nav">
          <button className={`msd-nav-item ${activeTab === "addProduct" ? "active" : ""}`} onClick={() => setActiveTab("addProduct")}>
            ➕ <span>{t('dashboard.addProductTab')}</span>
          </button>
          <button className={`msd-nav-item ${activeTab === "productList" ? "active" : ""}`} onClick={() => setActiveTab("productList")}>
            📦 <span>{t('dashboard.productListTab')}</span>
          </button>
          <button className={`msd-nav-item ${activeTab === "orderList" ? "active" : ""}`} onClick={() => setActiveTab("orderList")}>
            📋 <span>{t('dashboard.orderListTab')}</span>
          </button>
          <button className={`msd-nav-item ${activeTab === "sellerAccount" ? "active" : ""}`} onClick={() => setActiveTab("sellerAccount")}>
            👤 <span>{t('dashboard.sellerAccountTab')}</span>
          </button>
          
          <button className="msd-nav-item logout" onClick={handleLogout} style={{ marginTop: 'auto', color: '#ef4444' }}>
            🚪 <span>{t('dashboard.logout')}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="msd-main">
        <header className="msd-content-header">
          <h1>{activeTab === "addProduct" ? t('dashboard.addNewProduct') : 
               activeTab === "productList" ? t('dashboard.myProducts') : 
               activeTab === "orderList" ? t('dashboard.customerOrders') : t('dashboard.accountSettings')}</h1>
        </header>

        {status.message && <div className={`msd-status ${status.type}`}>{status.message}</div>}

        {/* Tab Content */}
        <div className="msd-content">
          
          {/* Section: Add Product */}
          {activeTab === "addProduct" && (
            <div className="msd-card">
              <form className="msd-form" onSubmit={handleProductSubmit}>
                <div className="msd-field">
                  <label>{t('addProduct.nameLabel')} *</label>
                  <input type="text" placeholder={t('addProduct.namePlaceholder')} value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} required />
                </div>
                <div className="msd-field">
                  <label>{t('addProduct.priceLabel')} *</label>
                  <input type="number" placeholder={t('addProduct.pricePlaceholder')} value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} required />
                </div>
                <div className="msd-field">
                  <label>{t('product.unit')} *</label>
                  <select value={productData.unit} onChange={e => setProductData({...productData, unit: e.target.value})} required>
                    {Object.entries(t('common.units', { returnObjects: true })).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="msd-field">
                  <label>{t('addProduct.descLabel')} *</label>
                  <textarea rows="4" placeholder={t('addProduct.descPlaceholder')} value={productData.description} onChange={e => setProductData({...productData, description: e.target.value})} required />
                </div>
                <div className="msd-field">
                  <label>{t('addProduct.imageLabel')} * (Max 2MB)</label>
                  <div className="msd-upload-zone" onClick={() => fileInputRef.current.click()}>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                    }} />
                    {imagePreview ? <img src={imagePreview} className="msd-preview-img" alt="Preview" /> : <p>Click to upload image</p>}
                  </div>
                </div>
                <button className="msd-btn-primary" type="submit" disabled={loading}>
                  {loading ? (
                    <div className="btn-loader-wrapper">
                      <div className="spinner mini"></div>
                      <span>{t('addProduct.loadingBtn')}</span>
                    </div>
                  ) : (
                    t('addProduct.submitBtn')
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Section: Product List */}
          {activeTab === "productList" && (
            <div className="msd-product-grid">
              {products.map(p => (
                <div key={p.id} className="msd-product-card">
                  <img 
                    src={p.image || p.image_url} 
                    className="msd-product-img" 
                    alt={p.name} 
                    style={{ width: "100%", height: "200px", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=AgroMitra"; }}
                  />
                  <div className="msd-product-info">
                    <h3>{p.name}</h3>
                    <p className="msd-product-price">₹{p.price}</p>
                    <p style={{fontSize: '14px', color: '#64748b'}}>{p.description}</p>
                    <button className="msd-btn-danger" onClick={() => deleteProduct(p.id)} style={{marginTop: '12px'}}>{t('dashboard.delete')}</button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p>{t('dashboard.noProducts')}</p>}
            </div>
          )}

          {/* Section: Order List */}
          {activeTab === "orderList" && (
            <div className="msd-card msd-table-container">
              <table className="msd-table">
                <thead>
                  <tr>
                    <th>{t('common.table.order_id')}</th>
                    <th>{t('common.table.product')}</th>
                    <th>{t('common.table.buyer')}</th>
                    <th>{t('common.table.qty')}</th>
                    <th>{t('common.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.product}</td>
                      <td>{o.buyer}</td>
                      <td>{o.qty}</td>
                      <td><span className={`msd-badge ${o.status.toLowerCase()}`}>{t(`common.status.${o.status.toLowerCase()}`)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section: Seller Account */}
          {activeTab === "sellerAccount" && (
            <div className="msd-card">
              <form className="msd-form" onSubmit={handleAccountUpdate}>
                <div className="msd-form-row">
                  <div className="msd-field"><label>{t('dashboard.sellerName')}</label><input type="text" value={accountData.seller_name} onChange={e => setAccountData({...accountData, seller_name: e.target.value})} /></div>
                  <div className="msd-field"><label>{t('dashboard.email')}</label><input type="email" value={accountData.email} readOnly /></div>
                </div>
                <div className="msd-form-row">
                  <div className="msd-field"><label>{t('dashboard.phone')}</label><input type="text" value={accountData.phone} onChange={e => setAccountData({...accountData, phone: e.target.value})} /></div>
                  <div className="msd-field"><label>{t('dashboard.shopName')}</label><input type="text" value={accountData.shop_name} onChange={e => setAccountData({...accountData, shop_name: e.target.value})} /></div>
                </div>
                <div className="msd-field"><label>{t('dashboard.address')}</label><textarea rows="3" value={accountData.address} onChange={e => setAccountData({...accountData, address: e.target.value})} /></div>
                <div className="msd-form-row">
                  <div className="msd-field"><label>{t('dashboard.bankAccount')}</label><input type="text" value={accountData.bank_account_number} onChange={e => setAccountData({...accountData, bank_account_number: e.target.value})} /></div>
                  <div className="msd-field"><label>{t('dashboard.ifsc')}</label><input type="text" value={accountData.ifsc_code} onChange={e => setAccountData({...accountData, ifsc_code: e.target.value})} /></div>
                </div>
                <div className="msd-field"><label>{t('dashboard.upi')}</label><input type="text" value={accountData.upi_id} onChange={e => setAccountData({...accountData, upi_id: e.target.value})} /></div>
                <button className="msd-btn-primary" type="submit" disabled={loading}>
                  {loading ? <div className="spinner"></div> : t('dashboard.updateAccount')}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default ModernSellerDashboard;
