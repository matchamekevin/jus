import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(formData.phone, formData.password);
      } else {
        await register(
          formData.full_name,
          formData.phone,
          formData.email,
          formData.password
        );
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-logo">
          <span className="logo-icon">🥤</span>
          <span className="logo-text">JusTogo</span>
        </Link>

        <div className="auth-welcome">
          <h1>{mode === 'login' ? 'Bon retour !' : 'Rejoignez-nous !'}</h1>
          <p>{mode === 'login' 
            ? 'Connectez-vous pour commander vos jus' 
            : 'Créez votre compte en quelques secondes'}</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={mode === 'login' ? 'active' : ''} 
            onClick={() => { setMode('login'); setError(''); }}
          >
            Connexion
          </button>
          <button 
            className={mode === 'register' ? 'active' : ''} 
            onClick={() => { setMode('register'); setError(''); }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">⚠️ {error}</div>}

          {mode === 'register' && (
            <div className="form-field">
              <label>👤 Nom complet</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Ex: Kofi Mensah"
                required
              />
            </div>
          )}

          <div className="form-field">
            <label>📞 Numéro de téléphone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex: 96 73 22 47"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label>✉️ Email (optionnel)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ex: kofi@email.com"
              />
            </div>
          )}

          <div className="form-field">
            <label>🔒 Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit btn-primary" disabled={loading}>
            {loading ? '⏳ Chargement...' : mode === 'login' ? '🚀 Se connecter' : '✨ Créer mon compte'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>Pas encore de compte ? <button onClick={() => setMode('register')}>S'inscrire</button></p>
          ) : (
            <p>Déjà inscrit ? <button onClick={() => setMode('login')}>Se connecter</button></p>
          )}
        </div>

        <div className="auth-help">
          <p>Besoin d'aide ? Appelez-nous :</p>
          <p><a href="tel:+22896732247">📞 96 73 22 47</a></p>
        </div>
      </div>
    </div>
  );
}
