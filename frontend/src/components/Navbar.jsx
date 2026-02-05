import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const { 
    user,
    isAuthenticated, 
    cartCount, 
    setShowAuthModal, 
    setShowAccountModal, 
    setShowCart 
  } = useApp();

  const isActive = (path) => location.pathname === path;

  // Obtenir le prénom de l'utilisateur
  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🥤</span>
          <span className="brand-text">JusTogo</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Accueil
          </Link>
          <Link to="/nos-jus" className={isActive('/nos-jus') ? 'active' : ''}>
            Nos Jus
          </Link>
          <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
            Contact
          </Link>
          <Link to="/suivi" className={isActive('/suivi') ? 'active' : ''}>
            Suivi
          </Link>
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <button 
                className="nav-action-btn cart-btn" 
                onClick={() => setShowCart(true)}
              >
                🛒
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button 
                className="nav-action-btn account-btn"
                onClick={() => setShowAccountModal(true)}
              >
                👤 {firstName && <span className="user-name">{firstName}</span>}
              </button>
            </>
          ) : (
            <button 
              className="nav-auth-btn"
              onClick={() => setShowAuthModal(true)}
            >
              Connexion
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="navbar-mobile-actions">
          {isAuthenticated ? (
            <>
              <button 
                className="nav-action-btn cart-btn" 
                onClick={() => setShowCart(true)}
              >
                🛒
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button 
                className="nav-action-btn account-btn"
                onClick={() => setShowAccountModal(true)}
              >
                👤
              </button>
            </>
          ) : (
            <button 
              className="nav-action-btn"
              onClick={() => setShowAuthModal(true)}
            >
              🔐
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="navbar-mobile-nav">
        <Link to="/" className={isActive('/') ? 'active' : ''}>
          <span>🏠</span>
          <span>Accueil</span>
        </Link>
        <Link to="/nos-jus" className={isActive('/nos-jus') ? 'active' : ''}>
          <span>🍹</span>
          <span>Jus</span>
        </Link>
        <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>
          <span>📞</span>
          <span>Contact</span>
        </Link>
        <Link to="/suivi" className={isActive('/suivi') ? 'active' : ''}>
          <span>📦</span>
          <span>Suivi</span>
        </Link>
      </div>
    </nav>
  );
}
