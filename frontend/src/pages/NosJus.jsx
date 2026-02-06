import { useState, useMemo } from 'react';
import { FiShoppingCart } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useApp } from '../context/AppContext';
import './NosJus.css';

export default function NosJus() {
  const { products, categories, addToCart, loading, isAuthenticated, setShowAuthModal } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedMessage, setAddedMessage] = useState('');

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    if (selectedProduct && selectedVariant) {
      const success = addToCart(selectedProduct, selectedVariant, 1);
      if (success) {
        setAddedMessage('Ajouté au panier !');
        setTimeout(() => {
          setAddedMessage('');
          setSelectedProduct(null);
          setSelectedVariant(null);
        }, 1500);
      }
    }
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    if (product.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setAddedMessage('');
  };

  if (loading) {
    return (
      <div className="nosjus-page">
        <Navbar />
        <div className="loading-state">Chargement des jus...</div>
      </div>
    );
  }

  return (
    <div className="nosjus-page">
      <Navbar />

      <main className="nosjus-main">
        <div className="nosjus-hero">
          <h1>Nos Jus Frais</h1>
          <p>Découvrez notre sélection de jus 100% naturels</p>
          
          {/* Barre de recherche */}
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Rechercher un jus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Catégories */}
        <div className="categories-wrapper">
          <div className="categories-container">
            <button
              className={selectedCategory === 'all' ? 'category-btn active' : 'category-btn'}
              onClick={() => setSelectedCategory('all')}
            >
              Tous
            </button>
            {categories.map((cat, index) => (
                <button
                key={`cat-${index}`}
                className={selectedCategory === cat ? 'category-btn active' : 'category-btn'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de produits */}
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>Aucun jus dans cette catégorie</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => openProductDetail(product)}
              >
                <div className="product-image">
                  <img 
                    src={product.image_url || 'https://via.placeholder.com/200x200?text=Product'} 
                    alt={product.name}
                    onError={e => { e.target.src = 'https://via.placeholder.com/200x200?text=Product'; }}
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-price">
                    À partir de <strong>{product.variants?.[0]?.price_xof?.toLocaleString() || '---'} FCFA</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal détail produit */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeProductDetail}>
          <div className="product-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeProductDetail}>✕</button>
            
            {addedMessage ? (
                  <div className="added-success">
                    <p>{addedMessage}</p>
                  </div>
                ) : (
              <>
                <div className="modal-product-image">
                  <img 
                    src={selectedProduct.image_url || 'https://via.placeholder.com/300x300?text=Jus'} 
                    alt={selectedProduct.name}
                  />
                </div>

                <div className="modal-product-info">
                  <h2>{selectedProduct.name}</h2>
                  <p className="modal-desc">{selectedProduct.description}</p>

                  {selectedProduct.variants?.length > 0 && (
                    <div className="variant-selector">
                      <label>Choisir une taille :</label>
                      <div className="variant-options">
                        {selectedProduct.variants.map(variant => (
                          <button
                            key={variant.id}
                            className={selectedVariant?.id === variant.id ? 'variant-btn active' : 'variant-btn'}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <span className="variant-size">{variant.size_label}</span>
                            <span className="variant-price">{variant.price_xof?.toLocaleString()} FCFA</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    className="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant}
                  >
                    <FiShoppingCart style={{ marginRight: 8 }} /> Ajouter au panier
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
