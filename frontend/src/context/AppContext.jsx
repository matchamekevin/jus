import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = '/api';

const AppContext = createContext(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp doit être utilisé dans AppProvider');
  return context;
}

export function AppProvider({ children }) {
  // Session token
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('jus_session'));
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  
  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  
  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au chargement
  useEffect(() => {
    async function verifySession() {
      if (!sessionToken) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: { 'x-session-token': sessionToken }
        });
        const data = await res.json();
        
        if (data.valid && data.user) {
          setUser(data.user);
          // Charger le panier de l'utilisateur
          const savedCart = localStorage.getItem(`jus_cart_${data.user.id}`);
          if (savedCart) setCart(JSON.parse(savedCart));
        } else {
          // Session invalide
          localStorage.removeItem('jus_session');
          setSessionToken(null);
        }
      } catch {
        localStorage.removeItem('jus_session');
        setSessionToken(null);
      }
    }
    
    verifySession();
  }, [sessionToken]);

  // Charger les données initiales
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/products`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_URL}/categories`).then(r => r.json()).catch(() => ({ categories: [] })),
      fetch(`${API_URL}/deliveries`).then(r => r.json()).catch(() => ({ zones: [] }))
    ])
      .then(([prodData, catData, zoneData]) => {
        setProducts(prodData.items || []);
        // Catégories sont des strings simples
        const cats = catData.categories || [];
        setCategories(cats);
        setZones(zoneData.zones || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Sauvegarder le panier quand il change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`jus_cart_${user.id}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  // Bloquer le scroll du body quand une modal est ouverte
  useEffect(() => {
    const isModalOpen = showAuthModal || showAccountModal || showCart;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAuthModal, showAccountModal, showCart]);

  // Auth
  const login = useCallback(async (phone, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
    
    localStorage.setItem('jus_session', data.sessionToken);
    setSessionToken(data.sessionToken);
    setUser(data.user);
    
    // Charger le panier de l'utilisateur
    const savedCart = localStorage.getItem(`jus_cart_${data.user.id}`);
    if (savedCart) setCart(JSON.parse(savedCart));
    
    setShowAuthModal(false);
    return data.user;
  }, []);

  const register = useCallback(async (full_name, phone, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, phone, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur d'inscription");
    
    localStorage.setItem('jus_session', data.sessionToken);
    setSessionToken(data.sessionToken);
    setUser(data.user);
    setShowAuthModal(false);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    if (sessionToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'x-session-token': sessionToken }
      }).catch(() => {});
    }
    
    localStorage.removeItem('jus_session');
    setSessionToken(null);
    setUser(null);
    setCart([]);
    setShowAccountModal(false);
    setShowCart(false);
  }, [sessionToken]);

  // Cart
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
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Orders
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
        delivery_zone_id: zoneId,
        user_id: user.id
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

  const value = {
    // Auth
    user,
    sessionToken,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!sessionToken,
    
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
