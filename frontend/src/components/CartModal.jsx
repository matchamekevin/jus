import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Modal.css';

export default function CartModal() {
  const { 
    showCart, setShowCart, 
    cart, cartTotal, 
    updateCartQty, removeFromCart, clearCart,
    zones, createOrder, user
  } = useApp();
  
  const [step, setStep] = useState('cart'); // cart | checkout | success
  const [form, setForm] = useState({
    phone: user?.phone || '',
    address: '',
    zoneId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  if (!showCart) return null;

  const selectedZone = zones.find(z => z.id === form.zoneId);
  const deliveryFee = selectedZone?.fee_xof || 0;
  const grandTotal = cartTotal + deliveryFee;

  const closeModal = () => {
    setShowCart(false);
    setStep('cart');
    setError('');
    setOrderResult(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setForm(prev => ({ ...prev, phone: user?.phone || '' }));
    setStep('checkout');
  };

  const handleOrder = async e => {
    e.preventDefault();
    if (!form.zoneId || !form.address) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await createOrder(form.address, form.phone, form.zoneId);
      setOrderResult(result);
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content cart-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>✕</button>

        {step === 'cart' && (
          <>
            <div className="cart-header">
              <h2>🛒 Mon Panier</h2>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span>🛒</span>
                <p>Votre panier est vide</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.variant_id} className="cart-item">
                      <img 
                        src={item.image_url || 'https://via.placeholder.com/60x60?text=🥤'} 
                        alt={item.product_name} 
                      />
                      <div className="cart-item-info">
                        <h4>{item.product_name}</h4>
                        <span className="size">{item.size_label}</span>
                        <span className="price">{item.price.toLocaleString()} FCFA</span>
                      </div>
                      <div className="cart-item-qty">
                        <button onClick={() => updateCartQty(item.variant_id, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateCartQty(item.variant_id, item.qty + 1)}>+</button>
                      </div>
                      <button 
                        className="remove-btn" 
                        onClick={() => removeFromCart(item.variant_id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <strong>{cartTotal.toLocaleString()} FCFA</strong>
                  </div>
                  <button className="checkout-btn" onClick={handleCheckout}>
                    Commander 🚀
                  </button>
                  <button className="clear-cart-btn" onClick={clearCart}>
                    Vider le panier
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'checkout' && (
          <>
            <div className="cart-header">
              <button className="back-btn" onClick={() => setStep('cart')}>← Retour</button>
              <h2>📍 Livraison</h2>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleOrder} className="checkout-form">
              <div className="form-group">
                <label>📱 Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>📍 Zone de livraison</label>
                <select
                  value={form.zoneId}
                  onChange={e => setForm({ ...form, zoneId: e.target.value })}
                  required
                >
                  <option value="">Sélectionnez une zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} (+{zone.fee_xof?.toLocaleString()} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>🏠 Adresse complète</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Quartier, rue, repères..."
                  rows={3}
                  required
                />
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Sous-total</span>
                  <span>{cartTotal.toLocaleString()} FCFA</span>
                </div>
                <div className="summary-row">
                  <span>Livraison</span>
                  <span>{deliveryFee.toLocaleString()} FCFA</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <strong>{grandTotal.toLocaleString()} FCFA</strong>
                </div>
              </div>

              <button type="submit" className="confirm-btn" disabled={loading}>
                {loading ? '⏳ Traitement...' : '✅ Confirmer la commande'}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="order-success">
            <span className="success-icon">🎉</span>
            <h2>Commande confirmée !</h2>
            <p>Merci pour votre commande</p>
            {orderResult && (
              <div className="order-ref">
                <span>N° de commande</span>
                <strong>#{orderResult.orderId?.slice(0, 8)}</strong>
              </div>
            )}
            <p className="success-message">
              Vous recevrez un appel pour confirmer la livraison.
            </p>
            <button className="close-success-btn" onClick={closeModal}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
