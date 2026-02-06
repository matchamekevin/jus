import { useState, useEffect } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const STATUS_LABELS = {
  pending: { label: 'En attente', icon: '', color: '#f59e0b' },
  preparing: { label: 'En préparation', icon: '', color: '#3b82f6' },
  delivering: { label: 'En livraison', icon: '', color: '#8b5cf6' },
  delivered: { label: 'Livrée', icon: '', color: '#22c55e' },
  cancelled: { label: 'Annulée', icon: '', color: '#ef4444' }
};

export default function Account() {
  const { user, isAuthenticated, authReady, logout, getUserOrders } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady) return; // Attendre la vérification de session
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    getUserOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authReady, isAuthenticated, getUserOrders, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!authReady || !isAuthenticated) {
    return null;
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <Link to="/" className="back-link">← Retour</Link>
        <h1>Mon Compte</h1>
      </header>

      <div className="account-content">
        {/* Profil */}
          <section className="profile-card">
          <div className="profile-avatar">
            {user.full_name?.charAt(0).toUpperCase() || ''}
          </div>
          <div className="profile-info">
            <h2>{user.full_name}</h2>
            <p>{user.phone}</p>
            {user.email && <p>{user.email}</p>}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </section>

        {/* Commandes */}
        <section className="orders-section">
          <h2>Mes Commandes</h2>
          
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>Aucune commande pour le moment</p>
              <Link to="/" className="btn-primary">Commander</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => {
                const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                return (
                  <Link 
                    key={order.id} 
                    to={`/track?id=${order.id}`}
                    className="order-card"
                  >
                    <div className="order-top">
                      <span className="order-id">#{order.id}</span>
                      <span 
                        className="order-status" 
                        style={{ background: status.color }}
                      >
                        {status.icon} {status.label}
                      </span>
                    </div>
                        <div className="order-info">
                          <p><FiMapPin style={{ verticalAlign: 'middle', marginRight: 6 }} />{order.address}</p>
                          <p>{(order.total_xof + order.delivery_fee_xof).toLocaleString()} F</p>
                        </div>
                    <div className="order-date">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
