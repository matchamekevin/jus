import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useApp } from "../context/AppContext";
import "./Home.css";
import { FiDroplet, FiTruck, FiStar, FiCreditCard } from 'react-icons/fi';

export default function Home() {
  const {
    user, isAuthenticated,
    products, categories, loading,
    addToCart, setShowAuthModal
  } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addedProduct, setAddedProduct] = useState(null);

  // Produits mis en avant
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.is_featured).slice(0, 6);
  }, [products]);

  // Filtrer par catégorie
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products.slice(0, 16);
    return products.filter(p => 
      p.category?.toLowerCase() === selectedCategory.toLowerCase()
    ).slice(0, 16);
  }, [products, selectedCategory]);

  function handleAddToCart(product, variant) {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const success = addToCart(product, variant);
    if (success) {
      setAddedProduct(product.id);
      setTimeout(() => setAddedProduct(null), 1500);
    }
  }

  if (loading) {
    return (
      <div className="home-page">
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Jus Frais du Togo</h1>
          <p>Bissap, Baobab, Gingembre... Des jus 100% naturels livrés chez vous</p>
          {isAuthenticated ? (
            <p className="welcome">Bienvenue, <strong>{user.full_name}</strong> !</p>
          ) : (
            <button className="cta-btn" onClick={() => setShowAuthModal(true)}>
              Se connecter pour commander
            </button>
          )}
          <Link to="/nos-jus" className="cta-btn secondary">
            Voir tous nos jus
          </Link>
        </div>
      </section>

      {/* Catégories */}
      {categories.length > 0 && (
        <section className="categories-section">
          <h2>Nos Catégories</h2>
          <div className="categories-wrapper">
            <div className="categories-list">
              <button 
                className={selectedCategory === 'all' ? 'active' : ''}
                onClick={() => setSelectedCategory('all')}
              >
                Tous
              </button>
              {categories.map((cat, index) => (
                <button
                  key={`cat-${index}`}
                  className={selectedCategory === cat ? 'active' : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Produits */}
      <section className="products-section" aria-labelledby="popular-products">
        <div className="section-header">
          <h2 id="popular-products">
            {selectedCategory === 'all' ? 'Nos Jus Populaires' : selectedCategory}
          </h2>
          <Link to="/nos-jus" className="see-all" aria-label="Voir tous les jus">Voir tout →</Link>
        </div>

        <div className="products-grid" role="list">
          {filteredProducts.length === 0 ? (
            <p className="no-products">Aucun produit dans cette catégorie</p>
          ) : (
            filteredProducts.map((product) => (
              <article key={product.id} className={`product-card ${addedProduct === product.id ? 'added' : ''}`} role="listitem">
                <figure className="product-img" style={{ backgroundImage: product.image_url ? `url(${product.image_url})` : 'none' }}>
                </figure>
                <div className="product-body">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="variants">
                    {product.variants?.map((v) => (
                      <button
                        key={v.id}
                        className="variant-btn"
                        onClick={() => handleAddToCart(product, v)}
                        disabled={v.stock <= 0}
                        aria-disabled={v.stock <= 0}
                      >
                        {v.size_label} · {v.price_xof?.toLocaleString()} F
                      </button>
                    ))}
                  </div>
                </div>
                {addedProduct === product.id && (
                  <div className="added-overlay" aria-live="polite">✓ Ajouté !</div>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="why-section">
        <h2>Pourquoi JusTogo ?</h2>
        <div className="why-grid">
          <div className="why-card">
            <FiDroplet />
            <h4>100% Naturel</h4>
            <p>Jus pressés à froid, sans conservateurs ni sucre ajouté</p>
          </div>
          <div className="why-card">
            <FiTruck />
            <h4>Livraison Rapide</h4>
            <p>Livré chez vous en 30-60 min dans tout Lomé</p>
          </div>
          <div className="why-card">
            <FiStar />
            <h4>Qualité Premium</h4>
            <p>Fruits frais sélectionnés chaque jour au marché</p>
          </div>
          <div className="why-card">
            <FiCreditCard />
            <h4>Paiement Facile</h4>
            <p>Cash à la livraison, Flooz ou T-Money</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
