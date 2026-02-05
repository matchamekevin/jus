import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './Modal.css';

export default function AccountModal() {
  const { showAccountModal, setShowAccountModal, user, logout, getUserOrders } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (showAccountModal && activeTab === 'orders') {
      loadOrders();
    }
  }, [showAccountModal, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showAccountModal || !user) return null;

  const closeModal = () => {
    setShowAccountModal(false);
    setActiveTab('profile');
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', color: '#f39c12' },
      confirmed: { label: 'Confirmée', color: '#3498db' },
      preparing: { label: 'Préparation', color: '#9b59b6' },
      delivering: { label: 'Livraison', color: '#e67e22' },
      delivered: { label: 'Livrée', color: '#27ae60' },
      cancelled: { label: 'Annulée', color: '#e74c3c' }
    };
    const badge = badges[status] || { label: status, color: '#666' };
    return <span className="order-status" style={{ background: badge.color }}>{badge.label}</span>;
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content account-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>✕</button>

        <div className="account-header">
          <div className="account-avatar">👤</div>
          <h2>{user.full_name}</h2>
          <p>📱 {user.phone}</p>
          {user.email && <p>✉️ {user.email}</p>}
        </div>

        <div className="account-tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profil
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            📦 Commandes
          </button>
        </div>

        <div className="account-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Nom complet</span>
                  <span className="info-value">{user.full_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Téléphone</span>
                  <span className="info-value">{user.phone}</span>
                </div>
                {user.email && (
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Membre depuis</span>
                  <span className="info-value">
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                      : 'Récemment inscrit'
                    }
                  </span>
                </div>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                🚪 Se déconnecter
              </button>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-section">
              {loading ? (
                <div className="loading-orders">⏳ Chargement des commandes...</div>
              ) : orders.length === 0 ? (
                <div className="no-orders">
                  <span>📭</span>
                  <p>Aucune commande pour l'instant</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="order-date">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className="order-total">
                        Total: <strong>{order.total_xof?.toLocaleString()} FCFA</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
