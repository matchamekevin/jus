import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiPackage,
  FiBox,
  FiTruck,
  FiUsers,
  FiLogOut,
  FiTrash2,
  FiPlusCircle,
  FiSearch,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiX,
  FiEdit2,
  FiUpload,
  FiImage,
  FiTrendingUp,
  FiShoppingBag,
  FiXCircle
} from 'react-icons/fi';

const API = "/api";
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "admin_key_2026_jus_togo_secure";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaires
  const [newProduct, setNewProduct] = useState({ name: "", description: "", category: "" });
  const [newProductImage, setNewProductImage] = useState(null);
  const [newProductPreview, setNewProductPreview] = useState(null);
  const [newVariant, setNewVariant] = useState({ product_id: "", size_label: "50 cl", price_xof: 1200, stock: 50 });
  const [newZone, setNewZone] = useState({ zone: "", fee_xof: 500 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductImage, setEditProductImage] = useState(null);
  const [editProductPreview, setEditProductPreview] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingZone, setEditingZone] = useState(null);

  // Filtres
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  useEffect(() => {
    loadData();

    // ---- SSE : mise à jour temps-réel ----
    let es;
    let reconnectTimer;
    let mounted = true;

    function connectSSE() {
      if (!mounted) return;
      try {
        es = new EventSource(`${API}/events`);

        es.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') return;
            if (['products', 'orders', 'zones', 'users', 'dashboard', 'promos'].includes(data.type)) {
              loadData();
            }
          } catch { /* ignore */ }
        };

        es.onerror = () => {
          if (es) es.close();
          if (mounted) {
            reconnectTimer = setTimeout(connectSSE, 5_000);
          }
        };
      } catch { /* ignore */ }
    }

    // Délai de 500ms pour laisser loadData finir avant de connecter SSE
    const initTimer = setTimeout(connectSSE, 500);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const headers = { "x-admin-key": ADMIN_KEY };
      const [dashRes, ordersRes, prodsRes, usersRes, zonesRes] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }),
        fetch(`${API}/admin/orders`, { headers }),
        fetch(`${API}/admin/products`, { headers }),
        fetch(`${API}/admin/users`, { headers }).catch(() => ({ json: () => ({ users: [] }) })),
        fetch(`${API}/deliveries`)
      ]);
      
      setStats(await dashRes.json());
      const ordersData = await ordersRes.json();
      setOrders(ordersData.items || []);
      const prodsData = await prodsRes.json();
      setProducts(prodsData.items || []);
      
      try {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } catch { setUsers([]); }
      
      const zonesData = await zonesRes.json();
      setZones(zonesData.zones || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function logout() {
    sessionStorage.clear();
    navigate("/login");
  }

  // Orders
  async function updateOrderStatus(id, status) {
    try {
      await fetch(`${API}/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({ status })
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function deleteOrder(id) {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      await fetch(`${API}/admin/orders/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY }
      });
      setOrders(orders.filter(o => o.id !== id));
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  // Suspendre/Activer un utilisateur
  async function toggleUserStatus(userId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? "activer" : "suspendre";
    
    if (!confirm(`Voulez-vous vraiment ${action} ce compte ?`)) return;
    
    try {
      const res = await fetch(`${API}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY 
        },
        body: JSON.stringify({ active: newStatus })
      });
      
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      
      const updatedUser = await res.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  // Products
  async function createProduct(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("description", newProduct.description);
      formData.append("category", newProduct.category);
      if (newProductImage) {
        formData.append("image", newProductImage);
      }

      const res = await fetch(`${API}/admin/products/with-image`, {
        method: "POST",
        headers: { "x-admin-key": ADMIN_KEY },
        body: formData
      });
      if (res.ok) {
        alert("✅ Produit créé");
        setNewProduct({ name: "", description: "", category: "" });
        setNewProductImage(null);
        setNewProductPreview(null);
        loadData();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Échec"));
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function updateProduct(id, updates) {
    try {
      const res = await fetch(`${API}/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setEditingProduct(null);
        loadData();
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function saveEditProduct(e) {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const formData = new FormData();
      formData.append("name", editingProduct.name);
      formData.append("description", editingProduct.description || "");
      formData.append("category", editingProduct.category || "");
      if (editProductImage) {
        formData.append("image", editProductImage);
      }

      const res = await fetch(`${API}/admin/products/${editingProduct.id}/with-image`, {
        method: "PATCH",
        headers: { "x-admin-key": ADMIN_KEY },
        body: formData
      });
      if (res.ok) {
        alert("✅ Produit mis à jour");
        setEditingProduct(null);
        setEditProductImage(null);
        setEditProductPreview(null);
        loadData();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Échec"));
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  function startEditProduct(product) {
    setEditingProduct({ ...product });
    setEditProductImage(null);
    setEditProductPreview(product.image_url || null);
  }

  async function deleteProduct(id) {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await fetch(`${API}/admin/products/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY }
      });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function toggleProductActive(id, active) {
    await updateProduct(id, { active: !active });
  }

  // Variants
  async function createVariant(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({
          ...newVariant,
          product_id: newVariant.product_id,
          price_xof: Number(newVariant.price_xof),
          stock: Number(newVariant.stock)
        })
      });
      if (res.ok) {
        alert("✅ Variante créée");
        setNewVariant({ product_id: "", size_label: "50 cl", price_xof: 1200, stock: 50 });
        loadData();
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function deleteVariant(id) {
    if (!confirm("Supprimer cette variante ?")) return;
    try {
      await fetch(`${API}/admin/variants/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY }
      });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  function startEditVariant(variant) {
    setEditingVariant({ ...variant });
  }

  async function saveEditVariant(e) {
    e.preventDefault();
    if (!editingVariant) return;
    try {
      const res = await fetch(`${API}/admin/variants/${editingVariant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({
          size_label: editingVariant.size_label,
          price_xof: Number(editingVariant.price_xof),
          stock: Number(editingVariant.stock)
        })
      });
      if (res.ok) {
        alert("✅ Variante mise à jour");
        setEditingVariant(null);
        loadData();
      } else {
        const data = await res.json();
        alert("Erreur: " + (data.error || "Échec"));
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  // Zones
  async function createZone(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/admin/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify({
          zone: newZone.zone,
          fee_xof: Number(newZone.fee_xof)
        })
      });
      if (res.ok) {
        alert("✅ Zone créée");
        setNewZone({ zone: "", fee_xof: 500 });
        loadData();
      }
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  async function deleteZone(id) {
    if (!confirm("Supprimer cette zone ?")) return;
    try {
      await fetch(`${API}/admin/zones/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": ADMIN_KEY }
      });
      loadData();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  }

  const statusLabels = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "Préparation",
    delivering: "Livraison",
    delivered: "Livrée",
    cancelled: "Annulée"
  };

  const statusColors = {
    pending: "#f39c12",
    confirmed: "#3498db",
    preparing: "#9b59b6",
    delivering: "#e67e22",
    delivered: "#27ae60",
    cancelled: "#e74c3c"
  };

  const filteredOrders = orderFilter === "all" 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  const filteredProducts = searchProduct 
    ? products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()))
    : products;

  if (loading) {
    return <div className="loading"><FiClock style={{ marginRight: 8 }} /> Chargement...</div>;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <FiPackage /> <span className="nav-label">JusTogo Admin</span>
        </div>
        <nav>
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
            <FiBarChart2 /> <span className="nav-label">Dashboard</span>
          </button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
            <FiPackage /> <span className="nav-label">Commandes</span> <span className="nav-badge">{orders.filter(o => o.status === 'pending').length}</span>
          </button>
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
            <FiBox /> <span className="nav-label">Produits</span>
          </button>
          <button className={tab === "zones" ? "active" : ""} onClick={() => setTab("zones")}>
            <FiTruck /> <span className="nav-label">Zones</span>
          </button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
            <FiUsers /> <span className="nav-label">Utilisateurs</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout}><FiLogOut /> <span className="nav-label">Déconnexion</span></button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header>
          <h1>
            {tab === "dashboard" && <><FiBarChart2 style={{ marginRight: 8 }} /> Tableau de bord</>}
            {tab === "orders" && <><FiPackage style={{ marginRight: 8 }} /> Gestion des commandes</>}
            {tab === "products" && <><FiBox style={{ marginRight: 8 }} /> Gestion des produits</>}
            {tab === "zones" && <><FiTruck style={{ marginRight: 8 }} /> Zones de livraison</>}
            {tab === "users" && <><FiUsers style={{ marginRight: 8 }} /> Utilisateurs</>}
          </h1>
        </header>

        <div className="content">
          {/* Dashboard */}
          {tab === "dashboard" && stats && (
            <>
              {/* Ligne 1 : stats principales */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <span className="stat-icon"><FiPackage /></span>
                  <div>
                    <strong>{stats.total_orders || 0}</strong>
                    <span>Total Commandes</span>
                  </div>
                </div>
                <div className="stat-card green">
                  <span className="stat-icon"><FiDollarSign /></span>
                  <div>
                    <strong>{(stats.total_revenue || 0).toLocaleString()} F</strong>
                    <span>Revenu Total</span>
                  </div>
                </div>
                <div className="stat-card orange">
                  <span className="stat-icon"><FiClock /></span>
                  <div>
                    <strong>{stats.pending || 0}</strong>
                    <span>En attente</span>
                  </div>
                </div>
                <div className="stat-card purple">
                  <span className="stat-icon"><FiCheckCircle /></span>
                  <div>
                    <strong>{stats.delivered || 0}</strong>
                    <span>Livrées</span>
                  </div>
                </div>
              </div>

              {/* Ligne 2 : stats secondaires */}
              <div className="stats-grid" style={{ marginTop: 16 }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <span className="stat-icon"><FiTrendingUp /></span>
                  <div>
                    <strong>{(stats.today_revenue || 0).toLocaleString()} F</strong>
                    <span>Revenu aujourd'hui ({stats.today_orders || 0} cmd)</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
                  <span className="stat-icon"><FiBox /></span>
                  <div>
                    <strong>{stats.active_products || 0} / {stats.total_products || 0}</strong>
                    <span>Produits actifs</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
                  <span className="stat-icon"><FiUsers /></span>
                  <div>
                    <strong>{stats.active_users || 0} / {stats.total_users || 0}</strong>
                    <span>Utilisateurs actifs</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <span className="stat-icon"><FiXCircle /></span>
                  <div>
                    <strong>{stats.cancelled || 0}</strong>
                    <span>Annulées</span>
                  </div>
                </div>
              </div>

              {/* Ligne 3 : Dernières commandes + Top produits */}
              <div className="quick-stats">
                <div className="quick-card">
                  <h3><FiShoppingBag style={{ marginRight: 6 }} /> Dernières commandes</h3>
                  {(stats.recent_orders || []).length === 0 && (
                    <p className="no-variants">Aucune commande pour le moment</p>
                  )}
                  {(stats.recent_orders || []).map(order => (
                    <div key={order.id} className="quick-item">
                      <span className="quick-id">#{String(order.id).slice(0, 8)}</span>
                      <span className="quick-customer">{order.customer_name || order.phone || '—'}</span>
                      <span style={{ color: statusColors[order.status], fontWeight: 600, fontSize: 12 }}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <strong>{(order.total_xof || 0).toLocaleString()} F</strong>
                    </div>
                  ))}
                </div>

                <div className="quick-card">
                  <h3><FiTrendingUp style={{ marginRight: 6 }} /> Produits les plus vendus</h3>
                  {(stats.top_products || []).length === 0 && (
                    <p className="no-variants">Aucune vente pour le moment</p>
                  )}
                  {(stats.top_products || []).map((prod, i) => (
                    <div key={i} className="quick-item">
                      <span style={{ fontWeight: 600 }}>#{i + 1}</span>
                      <span style={{ flex: 1 }}>{prod.name}</span>
                      <strong>{prod.total_sold} vendus</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zones actives */}
              <div className="quick-stats" style={{ marginTop: 8 }}>
                <div className="quick-card">
                  <h3><FiTruck style={{ marginRight: 6 }} /> Zones de livraison actives : {stats.total_zones || 0}</h3>
                  {zones.filter(z => z.active !== false).slice(0, 6).map(z => (
                    <div key={z.id} className="quick-item">
                      <span><FiMapPin style={{ marginRight: 4 }} /> {z.zone}</span>
                      <strong>{z.fee_xof?.toLocaleString()} F</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <>
              <div className="filters-bar">
                <select value={orderFilter} onChange={e => setOrderFilter(e.target.value)}>
                  <option value="all">Toutes ({orders.length})</option>
                  <option value="pending">En attente ({orders.filter(o => o.status === 'pending').length})</option>
                  <option value="confirmed">Confirmées ({orders.filter(o => o.status === 'confirmed').length})</option>
                  <option value="preparing">Préparation ({orders.filter(o => o.status === 'preparing').length})</option>
                  <option value="delivering">Livraison ({orders.filter(o => o.status === 'delivering').length})</option>
                  <option value="delivered">Livrées ({orders.filter(o => o.status === 'delivered').length})</option>
                  <option value="cancelled">Annulées ({orders.filter(o => o.status === 'cancelled').length})</option>
                </select>
              </div>

              <div className="orders-list">
                {filteredOrders.length === 0 ? (
                  <p className="empty">Aucune commande</p>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <strong>#{order.id?.slice(0, 8)}</strong>
                        <span 
                          className="status-badge" 
                          style={{ background: statusColors[order.status] }}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="order-body">
                        <div className="order-info">
                          <p><strong><FiDollarSign style={{ marginRight: 6 }} />{order.total_xof?.toLocaleString()} FCFA</strong></p>
                          <p><FiMapPin style={{ marginRight: 6 }} />{order.address}</p>
                          <p><FiPhone style={{ marginRight: 6 }} />{order.phone}</p>
                          <p><FiCalendar style={{ marginRight: 6 }} />{new Date(order.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="order-actions">
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="preparing">Préparation</option>
                          <option value="delivering">Livraison</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                        <button className="btn-delete" onClick={() => deleteOrder(order.id)}><FiTrash2 /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Products */}
          {tab === "products" && (
            <div className="products-section">
              <div className="forms-row">
                {/* Formulaire création produit */}
                <form className="form-card" onSubmit={createProduct}>
                  <h3><FiPlusCircle style={{ marginRight: 6 }} /> Nouveau produit</h3>
                  <input
                    type="text"
                    placeholder="Nom du produit"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={2}
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    required
                  >
                    <option value="">Choisir une catégorie</option>
                    <option value="Jus Traditionnel">Jus Traditionnel</option>
                    <option value="Jus Naturel">Jus Naturel</option>
                    <option value="Boisson Protéinée">Boisson Protéinée</option>
                    <option value="Boisson Énergétique">Boisson Énergétique</option>
                    <option value="Produits Laitiers">Produits Laitiers</option>
                    <option value="Smoothie">Smoothie</option>
                    <option value="Detox">Detox</option>
                  </select>
                  <label className="file-upload-label">
                    <FiUpload style={{ marginRight: 6 }} />
                    {newProductImage ? newProductImage.name : "Choisir une image"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setNewProductImage(file);
                          setNewProductPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {newProductPreview && (
                    <div className="image-preview">
                      <img src={newProductPreview} alt="Aperçu" />
                      <button type="button" className="btn-sm-delete" onClick={() => { setNewProductImage(null); setNewProductPreview(null); }}><FiX /></button>
                    </div>
                  )}
                  <button type="submit" className="btn-primary">Créer le produit</button>
                </form>

                {/* Formulaire création variante */}
                <form className="form-card" onSubmit={createVariant}>
                  <h3><FiPackage style={{ marginRight: 6 }} /> Nouvelle variante</h3>
                  <select
                    value={newVariant.product_id}
                    onChange={(e) => setNewVariant({ ...newVariant, product_id: e.target.value })}
                    required
                  >
                    <option value="">Choisir un produit</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={newVariant.size_label}
                    onChange={(e) => setNewVariant({ ...newVariant, size_label: e.target.value })}
                  >
                    <option value="25 cl">25 cl</option>
                    <option value="33 cl">33 cl</option>
                    <option value="50 cl">50 cl</option>
                    <option value="1 L">1 L</option>
                    <option value="1.5 L">1.5 L</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Prix (FCFA)"
                    value={newVariant.price_xof}
                    onChange={(e) => setNewVariant({ ...newVariant, price_xof: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn-primary">Créer la variante</button>
                </form>
              </div>

              {/* Modal d'édition produit */}
              {editingProduct && (
                <div className="modal-overlay" onClick={() => { setEditingProduct(null); setEditProductImage(null); setEditProductPreview(null); }}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={() => { setEditingProduct(null); setEditProductImage(null); setEditProductPreview(null); }}><FiX /></button>
                    <form onSubmit={saveEditProduct} className="form-card" style={{ boxShadow: 'none', margin: 0 }}>
                      <h3><FiEdit2 style={{ marginRight: 6 }} /> Modifier : {editingProduct.name}</h3>
                      <input
                        type="text"
                        placeholder="Nom"
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={editingProduct.description || ""}
                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        rows={2}
                      />
                      <select
                        value={editingProduct.category || ""}
                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      >
                        <option value="">Catégorie</option>
                        <option value="Jus Traditionnel">Jus Traditionnel</option>
                        <option value="Jus Naturel">Jus Naturel</option>
                        <option value="Boisson Protéinée">Boisson Protéinée</option>
                        <option value="Boisson Énergétique">Boisson Énergétique</option>
                        <option value="Produits Laitiers">Produits Laitiers</option>
                        <option value="Smoothie">Smoothie</option>
                        <option value="Detox">Detox</option>
                      </select>
                      <label className="file-upload-label">
                        <FiUpload style={{ marginRight: 6 }} />
                        {editProductImage ? editProductImage.name : "Changer l'image"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditProductImage(file);
                              setEditProductPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      {editProductPreview && (
                        <div className="image-preview">
                          <img src={editProductPreview} alt="Aperçu" />
                        </div>
                      )}
                      <button type="submit" className="btn-primary">Sauvegarder</button>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal d'édition variante */}
              {editingVariant && (
                <div className="modal-overlay" onClick={() => setEditingVariant(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <button className="modal-close" onClick={() => setEditingVariant(null)}><FiX /></button>
                    <form onSubmit={saveEditVariant} className="form-card" style={{ boxShadow: 'none', margin: 0 }}>
                      <h3><FiEdit2 style={{ marginRight: 6 }} /> Modifier la variante</h3>
                      <select
                        value={editingVariant.size_label}
                        onChange={e => setEditingVariant({ ...editingVariant, size_label: e.target.value })}
                      >
                        <option value="25 cl">25 cl</option>
                        <option value="33 cl">33 cl</option>
                        <option value="50 cl">50 cl</option>
                        <option value="1 L">1 L</option>
                        <option value="1.5 L">1.5 L</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Prix (FCFA)"
                        value={editingVariant.price_xof}
                        onChange={e => setEditingVariant({ ...editingVariant, price_xof: e.target.value })}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={editingVariant.stock}
                        onChange={e => setEditingVariant({ ...editingVariant, stock: e.target.value })}
                        required
                      />
                      <button type="submit" className="btn-primary">Sauvegarder</button>
                    </form>
                  </div>
                </div>
              )}

              {/* Liste des produits */}
              <div className="products-list-section">
                <div className="list-header">
                  <h3>Liste des produits ({products.length})</h3>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="products-grid">
                  {filteredProducts.map(p => (
                    <div key={p.id} className={`product-item ${p.active === false ? 'inactive' : ''}`}>
                      <div className="product-img" style={{ backgroundImage: p.image_url ? `url(${p.image_url})` : 'none' }}>
                        {!p.image_url && <span className="no-img-label"><FiImage /> Pas d'image</span>}
                        {p.active === false && <span className="inactive-badge">Inactif</span>}
                      </div>
                      <div className="product-details">
                        <strong>{p.name}</strong>
                        <span className="category-tag">{p.category}</span>
                        <div className="variants-list">
                          {p.variants?.map(v => (
                            <div key={v.id} className="variant-item">
                              <span>{v.size_label} - {v.price_xof?.toLocaleString()} F</span>
                              <span>Stock: {v.stock}</span>
                              <button className="btn-sm-edit" title="Modifier" onClick={() => startEditVariant(v)}><FiEdit2 /></button>
                              <button className="btn-sm-delete" title="Supprimer" onClick={() => deleteVariant(v.id)}><FiX /></button>
                            </div>
                          ))}
                          {(!p.variants || p.variants.length === 0) && (
                            <span className="no-variants">Aucune variante</span>
                          )}
                        </div>
                        <div className="product-actions">
                          <button
                            className={p.active !== false ? 'btn-toggle active' : 'btn-toggle'}
                            onClick={() => toggleProductActive(p.id, p.active !== false)}
                          >
                            {p.active !== false ? <><FiCheckCircle style={{ marginRight:6 }} />Actif</> : <><FiX style={{ marginRight:6 }} />Inactif</>}
                          </button>
                          <button className="btn-edit" onClick={() => startEditProduct(p)}><FiEdit2 style={{ marginRight: 4 }} /> Modifier</button>
                          <button className="btn-delete" onClick={() => deleteProduct(p.id)}><FiTrash2 /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Zones */}
          {tab === "zones" && (
            <div className="zones-section">
              <form className="form-card inline" onSubmit={createZone}>
                <h3>➕ Nouvelle zone</h3>
                <div className="form-inline">
                  <input
                    type="text"
                    placeholder="Nom de la zone"
                    value={newZone.zone}
                    onChange={(e) => setNewZone({ ...newZone, zone: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Frais (FCFA)"
                    value={newZone.fee_xof}
                    onChange={(e) => setNewZone({ ...newZone, fee_xof: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn-primary">Ajouter</button>
                </div>
              </form>

              <div className="zones-list">
                <h3>Zones existantes ({zones.length})</h3>
                {zones.length === 0 ? (
                  <p className="empty">Aucune zone configurée</p>
                ) : (
                  <div className="zones-grid">
                    {zones.map(z => (
                      <div key={z.id} className="zone-card">
                        <div className="zone-info">
                          <strong>{z.zone || z.name}</strong>
                          <span>{z.fee_xof?.toLocaleString()} FCFA</span>
                        </div>
                        <button className="btn-delete" onClick={() => deleteZone(z.id)}><FiTrash2 /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (() => {
            const activeUsers = users.filter(u => u.active !== false);
            const suspendedUsers = users.filter(u => u.active === false);
            const filteredUsers = users.filter(u => {
              const q = searchUser.toLowerCase();
              const matchesSearch = !q || 
                u.full_name?.toLowerCase().includes(q) ||
                u.phone?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q);
              const matchesStatus = userStatusFilter === 'all' ||
                (userStatusFilter === 'active' && u.active !== false) ||
                (userStatusFilter === 'suspended' && u.active === false);
              const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
              return matchesSearch && matchesStatus && matchesRole;
            });
            const roles = [...new Set(users.map(u => u.role).filter(Boolean))];

            return (
            <div className="users-section">
              <div className="users-stats">
                <div className="user-stat-card">
                  <FiUsers style={{ marginRight: 8 }} />
                  <div>
                    <strong>{users.length}</strong>
                    <span>Total</span>
                  </div>
                </div>
                <div className="user-stat-card" style={{ borderLeft: '4px solid #27ae60' }}>
                  <FiCheckCircle style={{ marginRight: 8, color: '#27ae60' }} />
                  <div>
                    <strong>{activeUsers.length}</strong>
                    <span>Actifs</span>
                  </div>
                </div>
                <div className="user-stat-card" style={{ borderLeft: '4px solid #e74c3c' }}>
                  <FiX style={{ marginRight: 8, color: '#e74c3c' }} />
                  <div>
                    <strong>{suspendedUsers.length}</strong>
                    <span>Suspendus</span>
                  </div>
                </div>
              </div>

              {/* Barre de recherche + filtres */}
              <div className="filters-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                  <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, téléphone, email..."
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: 34, width: '100%' }}
                  />
                </div>
                <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts ({users.length})</option>
                  <option value="active">Actifs ({activeUsers.length})</option>
                  <option value="suspended">Suspendus ({suspendedUsers.length})</option>
                </select>
                <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
                  <option value="all">Tous les rôles</option>
                  {roles.map(r => (
                    <option key={r} value={r}>{r} ({users.filter(u => u.role === r).length})</option>
                  ))}
                </select>
              </div>

              <div className="users-list">
                <h3>Liste des utilisateurs ({filteredUsers.length}{filteredUsers.length !== users.length ? ` / ${users.length}` : ''})</h3>
                {filteredUsers.length === 0 ? (
                  <p className="empty">{searchUser || userStatusFilter !== 'all' || userRoleFilter !== 'all' ? 'Aucun utilisateur ne correspond aux filtres' : 'Aucun utilisateur inscrit'}</p>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Téléphone</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Inscrit le</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className={user.active === false ? 'suspended-user' : ''}>
                          <td data-label="Nom">{user.full_name}</td>
                          <td data-label="Tél">{user.phone}</td>
                          <td data-label="Email">{user.email || '-'}</td>
                          <td data-label="Rôle"><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                          <td data-label="Statut">
                            <span className={`status-badge ${user.active !== false ? 'active' : 'suspended'}`}>
                              {user.active !== false ? <><FiCheckCircle style={{ marginRight:6 }} /> Actif</> : <><FiX style={{ marginRight:6 }} /> Suspendu</>}
                            </span>
                          </td>
                          <td data-label="Inscrit">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                          <td data-label="">
                            <button 
                              className={user.active !== false ? 'btn-suspend' : 'btn-activate'}
                              onClick={() => toggleUserStatus(user.id, user.active !== false)}
                              title={user.active !== false ? 'Suspendre le compte' : 'Activer le compte'}
                            >
                              {user.active !== false ? 'Suspendre' : 'Activer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          <FiBarChart2 />
          <span>Dashboard</span>
        </button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          <FiPackage />
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="mobile-badge">{orders.filter(o => o.status === 'pending').length}</span>
          )}
          <span>Commandes</span>
        </button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          <FiBox />
          <span>Produits</span>
        </button>
        <button className={tab === 'zones' ? 'active' : ''} onClick={() => setTab('zones')}>
          <FiTruck />
          <span>Zones</span>
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          <FiUsers />
          <span>Users</span>
        </button>
      </nav>
    </div>
  );
}
