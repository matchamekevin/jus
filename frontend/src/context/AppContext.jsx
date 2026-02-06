import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_URL = '/api';

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp doit être utilisé dans AppProvider');
  return context;
}

// --- Helper : charger le panier depuis la BD ---
async function fetchCartFromDB(token) {
  try {
    const res = await fetch(`${API_URL}/cart`, {
      headers: { 'x-session-token': token }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant_id,
      size_label: item.size_label,
      price: item.price,
      image_url: item.image_url,
      qty: item.qty
    }));
  } catch {
    return [];
  }
}

// --- Helper : sauvegarder le panier en BD ---
async function saveCartToDB(token, cart) {
  try {
    await fetch(`${API_URL}/cart`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': token
      },
      body: JSON.stringify({
        items: cart.map(item => ({
          variant_id: item.variant_id,
          qty: item.qty
        }))
      })
    });
  } catch {
    // Silencieux — le panier sera re-synchronisé au prochain chargement
  }
}

export function AppProvider({ children }) {
  // -------- Auth state --------
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('jus_session'));
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // true une fois la session vérifiée

  // -------- Cart (isolé par user, persisté en BD) --------
  const [cart, setCart] = useState([]);
  // Empêcher la sauvegarde du panier pendant une transition login/logout
  const skipCartSave = useRef(false);
  // Empêcher la double-sauvegarde du panier initial chargé depuis la BD
  const cartLoadedFromDB = useRef(false);

  // -------- UI State --------
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // -------- Data --------
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================================================================
  // 1) Vérifier la session au chargement (et à chaque changement de token)
  // ================================================================
  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const token = sessionToken;
      if (!token) {
        // Pas de token → pas de session
        setUser(null);
        setCart([]);
        if (!cancelled) setAuthReady(true);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: { 'x-session-token': token }
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.valid && data.user) {
          setUser(data.user);
          // Charger le panier depuis la BD
          cartLoadedFromDB.current = true;
          const dbCart = await fetchCartFromDB(token);
          if (!cancelled) setCart(dbCart);
        } else {
          // Token invalide ou expiré → nettoyage
          sessionStorage.removeItem('jus_session');
          setSessionToken(null);
          setUser(null);
          setCart([]);
        }
      } catch {
        if (cancelled) return;
        // Erreur réseau → nettoyage
        sessionStorage.removeItem('jus_session');
        setSessionToken(null);
        setUser(null);
        setCart([]);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    verifySession();
    return () => { cancelled = true; };
  }, [sessionToken]);

  // ================================================================
  // 2) Charger les données produits/catégories/zones
  // ================================================================
  const fetchData = useCallback(async () => {
    try {
      const [prodData, catData, zoneData] = await Promise.all([
        fetch(`${API_URL}/products`).then(r => r.json()).catch(() => ({ items: [] })),
        fetch(`${API_URL}/categories`).then(r => r.json()).catch(() => ({ categories: [] })),
        fetch(`${API_URL}/deliveries`).then(r => r.json()).catch(() => ({ zones: [] }))
      ]);
      setProducts(prodData.items || []);
      setCategories(catData.categories || []);
      setZones(zoneData.zones || []);
    } catch (err) {
      console.error('Erreur fetchData:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));

    // ---- SSE : mise à jour temps-réel depuis le serveur ----
    let es;
    let reconnectTimer;
    let mounted = true;

    function connectSSE() {
      if (!mounted) return;
      try {
        es = new EventSource(`${API_URL}/events`);

        es.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') return;
            if (data.type === 'products' || data.type === 'zones') {
              fetchData();
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

    const initTimer = setTimeout(connectSSE, 500);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [fetchData]);

  // ================================================================
  // 3) Sauvegarder le panier en BD quand il change
  // ================================================================
  useEffect(() => {
    // Ne pas sauvegarder pendant une transition ou si pas d'user
    if (!user || !sessionToken || skipCartSave.current) return;
    // Ne pas re-sauvegarder le panier qu'on vient de charger depuis la BD
    if (cartLoadedFromDB.current) {
      cartLoadedFromDB.current = false;
      return;
    }
    saveCartToDB(sessionToken, cart);
  }, [cart, user, sessionToken]);

  // ================================================================
  // 4) Bloquer le scroll du body quand une modal est ouverte
  // ================================================================
  useEffect(() => {
    const isModalOpen = showAuthModal || showAccountModal || showCart;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAuthModal, showAccountModal, showCart]);

  // ================================================================
  // AUTH : Login
  // ================================================================
  const login = useCallback(async (phone, password) => {
    skipCartSave.current = true;

    // Si une session existe déjà, logout propre côté serveur
    if (sessionToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) {
      skipCartSave.current = false;
      throw new Error(data.error || 'Erreur de connexion');
    }

    // Stocker le nouveau token
    sessionStorage.setItem('jus_session', data.sessionToken);

    // Charger le panier du NOUVEL utilisateur depuis la BD
    cartLoadedFromDB.current = true;
    const newCart = await fetchCartFromDB(data.sessionToken);

    // Mettre à jour tout le state d'un coup (React 18 batch)
    setSessionToken(data.sessionToken);
    setUser(data.user);
    setCart(newCart);
    setShowAuthModal(false);

    // Ré-activer la sauvegarde du panier
    skipCartSave.current = false;

    return data.user;
  }, [sessionToken]);

  // ================================================================
  // AUTH : Register
  // ================================================================
  const register = useCallback(async (full_name, phone, email, password) => {
    skipCartSave.current = true;

    // Si une session existe déjà, logout propre côté serveur
    if (sessionToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, phone, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      skipCartSave.current = false;
      throw new Error(data.error || "Erreur d'inscription");
    }

    // Stocker le nouveau token
    sessionStorage.setItem('jus_session', data.sessionToken);

    // Nouveau compte → panier vide
    setSessionToken(data.sessionToken);
    setUser(data.user);
    setCart([]);
    setShowAuthModal(false);

    skipCartSave.current = false;

    return data.user;
  }, [sessionToken]);

  // ================================================================
  // AUTH : Logout
  // ================================================================
  const logout = useCallback(async () => {
    skipCartSave.current = true;

    if (sessionToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }

    sessionStorage.removeItem('jus_session');
    setSessionToken(null);
    setUser(null);
    setCart([]);
    setShowAccountModal(false);
    setShowCart(false);

    skipCartSave.current = false;
  }, [sessionToken]);

  // ================================================================
  // CART
  // ================================================================
  const addToCart = useCallback((product, variant, qty = 1) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variant_id === variant.id);
      if (existing) {
        return prev.map(item =>
          item.variant_id === variant.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        variant_id: variant.id,
        size_label: variant.size_label,
        price: variant.price_xof,
        image_url: product.image_url,
        qty
      }];
    });
    return true;
  }, [user]);

  const updateCartQty = useCallback((variantId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.variant_id !== variantId));
    } else {
      setCart(prev => prev.map(item =>
        item.variant_id === variantId ? { ...item, qty } : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((variantId) => {
    setCart(prev => prev.filter(item => item.variant_id !== variantId));
    // Supprimer aussi côté BD
    if (sessionToken) {
      fetch(`${API_URL}/cart/items/${variantId}`, {
        method: 'DELETE',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }
  }, [sessionToken]);

  const clearCart = useCallback(() => {
    setCart([]);
    // Vider aussi côté BD
    if (sessionToken) {
      fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }
  }, [sessionToken]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // ================================================================
  // ORDERS
  // ================================================================
  const createOrder = useCallback(async (address, phone, zoneId) => {
    if (!user || !sessionToken) throw new Error("Non connecté");

    const items = cart.map(item => ({
      variant_id: item.variant_id,
      qty: item.qty
    }));

    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken
      },
      body: JSON.stringify({
        items,
        address,
        phone,
        delivery_zone_id: zoneId
        // user_id n'est PLUS envoyé — le backend le déduit de la session
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de commande');

    clearCart();
    return data;
  }, [cart, user, sessionToken, clearCart]);

  const getUserOrders = useCallback(async () => {
    if (!user || !sessionToken) return [];
    const res = await fetch(`${API_URL}/auth/orders/${user.id}`, {
      headers: { 'x-session-token': sessionToken }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    return data.orders || [];
  }, [user, sessionToken]);

  // ================================================================
  // CONTEXT VALUE
  // ================================================================
  const value = {
    // Auth
    user,
    sessionToken,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!sessionToken,
    authReady,

    // UI Modals
    showAuthModal, setShowAuthModal,
    showAccountModal, setShowAccountModal,
    showCart, setShowCart,

    // Cart
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,

    // Data
    products,
    categories,
    zones,
    loading,

    // Orders
    createOrder,
    getUserOrders
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
