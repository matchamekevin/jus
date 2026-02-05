import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api";
const ADMIN_KEY = "admin_key_2026_jus_togo_secure";

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
  const [newProduct, setNewProduct] = useState({ name: "", description: "", category: "", image_url: "" });
  const [newVariant, setNewVariant] = useState({ product_id: "", size_label: "50 cl", price_xof: 1200, stock: 50 });
  const [newZone, setNewZone] = useState({ zone: "", fee_xof: 500 });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingZone, setEditingZone] = useState(null);

  // Filtres
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchProduct, setSearchProduct] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const headers = { "x-admin-key": ADMIN_KEY };
      const [dashRes, ordersRes, prodsRes, usersRes, zonesRes] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }),
        fetch(`${API}/admin/orders`, { headers }),
        fetch(`${API}/products`),
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
      const res = await fetch(`${API}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        alert("✅ Produit créé");
        setNewProduct({ name: "", description: "", category: "", image_url: "" });
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
          product_id: Number(newVariant.product_id),
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
    return <div className="loading">⏳ Chargement...</div>;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🥤</span> JusTogo Admin
        </div>
        <nav>
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>
            📊 Dashboard
          </button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
            📦 Commandes <span className="nav-badge">{orders.filter(o => o.status === 'pending').length}</span>
          </button>
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
            🧃 Produits
          </button>
          <button className={tab === "zones" ? "active" : ""} onClick={() => setTab("zones")}>
            🚚 Zones
          </button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
            👥 Utilisateurs
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout}>🚪 Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header>
          <h1>
            {tab === "dashboard" && "📊 Tableau de bord"}
            {tab === "orders" && "📦 Gestion des commandes"}
            {tab === "products" && "🧃 Gestion des produits"}
            {tab === "zones" && "🚚 Zones de livraison"}
            {tab === "users" && "👥 Utilisateurs"}
          </h1>
        </header>

        <div className="content">
          {/* Dashboard */}
          {tab === "dashboard" && stats && (
            <>
              <div className="stats-grid">
                <div className="stat-card blue">
                  <span className="stat-icon">📦</span>
                  <div>
                    <strong>{stats.total_orders || 0}</strong>
                    <span>Total Commandes</span>
                  </div>
                </div>
                <div className="stat-card green">
                  <span className="stat-icon">💰</span>
                  <div>
                    <strong>{(stats.total_revenue || 0).toLocaleString()} F</strong>
                    <span>Revenu Total</span>
                  </div>
                </div>
                <div className="stat-card orange">
                  <span className="stat-icon">⏳</span>
                  <div>
                    <strong>{stats.pending || 0}</strong>
                    <span>En attente</span>
                  </div>
                </div>
                <div className="stat-card purple">
                  <span className="stat-icon">✅</span>
                  <div>
                    <strong>{stats.delivered || stats.paid || 0}</strong>
                    <span>Livrées</span>
                  </div>
                </div>
              </div>

              <div className="quick-stats">
                <div className="quick-card">
                  <h3>Dernières commandes</h3>
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="quick-item">
                      <span>#{order.id?.slice(0, 8)}</span>
                      <span style={{ color: statusColors[order.status] }}>{statusLabels[order.status]}</span>
                      <strong>{order.total_xof?.toLocaleString()} F</strong>
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
                          <p><strong>💰 {order.total_xof?.toLocaleString()} FCFA</strong></p>
                          <p>📍 {order.address}</p>
                          <p>📱 {order.phone}</p>
                          <p>📅 {new Date(order.created_at).toLocaleString('fr-FR')}</p>
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
                        <button className="btn-delete" onClick={() => deleteOrder(order.id)}>🗑️</button>
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
                <form className="form-card" onSubmit={createProduct}>
                  <h3>➕ Nouveau produit</h3>
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
                    <option value="Produits Laitiers">Produits Laitiers</option>
                    <option value="Smoothie">Smoothie</option>
                    <option value="Detox">Detox</option>
                  </select>
                  <input
                    type="text"
                    placeholder="URL de l'image"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  />
                  <button type="submit" className="btn-primary">Créer le produit</button>
                </form>

                <form className="form-card" onSubmit={createVariant}>
                  <h3>📦 Nouvelle variante</h3>
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

              <div className="products-list-section">
                <div className="list-header">
                  <h3>Liste des produits ({products.length})</h3>
                  <input
                    type="text"
                    placeholder="🔍 Rechercher..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="products-grid">
                  {filteredProducts.map(p => (
                    <div key={p.id} className={`product-item ${p.active === false ? 'inactive' : ''}`}>
                      <div className="product-img" style={{ backgroundImage: p.image_url ? `url(${p.image_url})` : 'none' }}>
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
                              <button className="btn-sm-delete" onClick={() => deleteVariant(v.id)}>✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="product-actions">
                          <button 
                            className={p.active !== false ? 'btn-toggle active' : 'btn-toggle'}
                            onClick={() => toggleProductActive(p.id, p.active !== false)}
                          >
                            {p.active !== false ? '✓ Actif' : '✗ Inactif'}
                          </button>
                          <button className="btn-delete" onClick={() => deleteProduct(p.id)}>🗑️</button>
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
                        <button className="btn-delete" onClick={() => deleteZone(z.id)}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="users-section">
              <div className="users-stats">
                <div className="user-stat-card">
                  <span>👥</span>
                  <div>
                    <strong>{users.length}</strong>
                    <span>Total utilisateurs</span>
                  </div>
                </div>
              </div>

              <div className="users-list">
                <h3>Liste des utilisateurs</h3>
                {users.length === 0 ? (
                  <p className="empty">Aucun utilisateur inscrit</p>
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
                      {users.map(user => (
                        <tr key={user.id} className={user.active === false ? 'suspended-user' : ''}>
                          <td>{user.full_name}</td>
                          <td>{user.phone}</td>
                          <td>{user.email || '-'}</td>
                          <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                          <td>
                            <span className={`status-badge ${user.active !== false ? 'active' : 'suspended'}`}>
                              {user.active !== false ? '✅ Actif' : '❌ Suspendu'}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                          <td>
                            <button 
                              className={user.active !== false ? 'btn-suspend' : 'btn-activate'}
                              onClick={() => toggleUserStatus(user.id, user.active !== false)}
                              title={user.active !== false ? 'Suspendre le compte' : 'Activer le compte'}
                            >
                              {user.active !== false ? '🚫 Suspendre' : '✅ Activer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
