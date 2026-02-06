import { useState } from 'react';
import { FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import './Modal.css';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, register } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: ''
  });

  if (!showAuthModal) return null;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await login(form.phone, form.password);
      } else {
        await register(form.full_name, form.phone, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setForm({ full_name: '', phone: '', email: '', password: '' });
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setError('');
    setForm({ full_name: '', phone: '', email: '', password: '' });
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>✕</button>
        
        <div className="auth-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUser />
            <h2 style={{ margin: 0 }}>{isLogin ? 'Connexion' : 'Inscription'}</h2>
          </div>
          <p>{isLogin ? 'Connectez-vous pour commander' : 'Créez votre compte JusTogo'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Nom complet</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Votre nom complet"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Ex: 90 12 34 56"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Email (optionnel)</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="votre@email.com"
              />
            </div>
          )}

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Votre mot de passe"
                required
                minLength={4}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Cacher le mot de passe' : 'Voir le mot de passe'}
                title={showPassword ? 'Cacher' : 'Voir'}
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <p>Pas encore de compte ? <button onClick={switchMode}>S'inscrire</button></p>
          ) : (
            <p>Déjà un compte ? <button onClick={switchMode}>Se connecter</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
