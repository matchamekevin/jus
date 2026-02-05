import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>🥤 JusTogo</h3>
          <p>Jus frais, naturels et délicieux</p>
        </div>
        <div className="footer-links">
          <Link to="/">Accueil</Link>
          <Link to="/nos-jus">Nos Jus</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/suivi">Suivi</Link>
        </div>
        <div className="footer-contact">
          <p>📱 <a href="tel:+22896732247">96 73 22 47</a></p>
          <p>📲 <a href="tel:+22870472436">70 47 24 36</a></p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 JusTogo - Tous droits réservés</p>
      </div>
    </footer>
  );
}
