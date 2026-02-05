import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useApp } from '../context/AppContext';
import './Track.css';

export default function Track() {
  const { isAuthenticated, getUserOrders } = useApp();
  const [orderId, setOrderId] = useState('');
  const [searching, setSearching] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setSearching(true);
    setError('');
    setOrderResult(null);

    // Pour l'instant, afficher un message de développement
    setTimeout(() => {
      setError('Fonctionnalité de recherche en cours de développement');
      setSearching(false);
    }, 1000);
  };

  return (
    <div className="track-page">
      <Navbar />

      <main className="track-main">
        <div className="track-hero">
          <h1>📦 Suivi de Commande</h1>
          <p>Suivez l'état de votre commande en temps réel</p>
        </div>

        <div className="track-container">
          {/* Formulaire de recherche */}
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Entrez votre numéro de commande"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <button type="submit" disabled={searching}>
                {searching ? '⏳' : '🔍'} Rechercher
              </button>
            </form>
          </div>

          {error && (
            <div className="track-message error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Message en développement */}
          <div className="dev-notice">
            <div className="dev-icon">🚧</div>
            <h2>Fonctionnalité en développement</h2>
            <p>Le suivi en temps réel sera bientôt disponible !</p>

            <div className="dev-features">
              <div className="feature">
                <span>📍</span>
                <span>Suivi en temps réel</span>
              </div>
              <div className="feature">
                <span>🔔</span>
                <span>Notifications SMS</span>
              </div>
              <div className="feature">
                <span>📞</span>
                <span>Contact livreur</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="track-contact">
            <h3>Besoin d'aide ?</h3>
            <p>Contactez-nous directement :</p>
            <div className="contact-buttons">
              <a href="tel:+22896732247" className="contact-btn moov">
                📱 Moov: 96 73 22 47
              </a>
              <a href="tel:+22870472436" className="contact-btn togocel">
                📲 Togocel: 70 47 24 36
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
