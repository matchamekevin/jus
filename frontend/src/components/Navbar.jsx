import { Link, useLocation } from 'react-router-dom';
import { FiDroplet, FiShoppingCart, FiUser, FiLogIn, FiHome, FiGrid, FiMail, FiMapPin } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    authReady,
    cartCount,
    setShowAuthModal,
    setShowAccountModal,
    setShowCart
  } = useApp();

  const isActive = (path) => location.pathname === path;
  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <FiDroplet />
            <span className="brand-text">JusTogo</span>
          </span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Accueil</Link>
          <Link to="/nos-jus" className={isActive('/nos-jus') ? 'active' : ''}>Nos Jus</Link>
          <Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link>
          <Link to="/suivi" className={isActive('/suivi') ? 'active' : ''}>Suivi</Link>
        </div>

        <div className="navbar-actions">
          {!authReady ? null : isAuthenticated ? (
            <>
              <button className="nav-action-btn cart-btn" onClick={() => setShowCart(true)} aria-label="Ouvrir le panier">
                <FiShoppingCart style={{ marginRight: 8 }} />
                <span>Panier</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>

              <button className="nav-action-btn account-btn" onClick={() => setShowAccountModal(true)} aria-label="Ouvrir le compte">
                <FiUser style={{ marginRight: 8 }} />
                {firstName ? <span className="user-name">{firstName}</span> : 'Compte'}
              </button>
            </>
          ) : (
            <button className="nav-action-btn nav-auth-btn" onClick={() => setShowAuthModal(true)}>
              <FiLogIn style={{ marginRight: 8 }} /> Connexion
            </button>
          )}
        </div>

        <div className="navbar-mobile-actions">
          {!authReady ? null : isAuthenticated ? (
            <>
              <button className="nav-action-btn cart-btn" onClick={() => setShowCart(true)} aria-label="Ouvrir le panier">
                <FiShoppingCart />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>

              <button className="nav-action-btn account-btn" onClick={() => setShowAccountModal(true)} aria-label="Ouvrir le compte">
                <FiUser />
              </button>
            </>
          ) : (
            <button className="nav-action-btn nav-auth-btn" onClick={() => setShowAuthModal(true)}>
              <FiLogIn />
            </button>
          )}
        </div>
      </div>

      <div className="navbar-mobile-nav">
        <Link to="/" className={isActive('/') ? 'active' : ''}><FiHome /> <span>Accueil</span></Link>
        <Link to="/nos-jus" className={isActive('/nos-jus') ? 'active' : ''}><FiGrid /> <span>Jus</span></Link>
        <Link to="/contact" className={isActive('/contact') ? 'active' : ''}><FiMail /> <span>Contact</span></Link>
        <Link to="/suivi" className={isActive('/suivi') ? 'active' : ''}><FiMapPin /> <span>Suivi</span></Link>
      </div>
    </nav>
  );
}