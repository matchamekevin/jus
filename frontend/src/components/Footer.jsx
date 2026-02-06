import { Link } from 'react-router-dom';
import { FiPhone, FiSmartphone, FiMail, FiMapPin, FiInstagram } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>JusTogo</h3>
          <p>Jus frais, naturels et délicieux</p>
        </div>
        <div className="footer-links">
          <Link to="/">Accueil</Link>
          <Link to="/nos-jus">Nos Jus</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/suivi">Suivi</Link>
        </div>
        <div className="footer-contact">
          <p><FiMapPin style={{ verticalAlign: 'middle', marginRight: 6 }} /> Lomé, Togo</p>
          <p><FiPhone style={{ verticalAlign: 'middle', marginRight: 6 }} /> <a href="tel:+22896732247">96 73 22 47</a></p>
          <p><FiSmartphone style={{ verticalAlign: 'middle', marginRight: 6 }} /> <a href="tel:+22870472436">70 47 24 36</a></p>
          <p><FiMail style={{ verticalAlign: 'middle', marginRight: 6 }} /> <a href="mailto:matchamegnatikevin894@gmail.com">matchamegnatikevin894@gmail.com</a></p>

          <div className="footer-socials">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 JusTogo - Tous droits réservés</p>
      </div>
    </footer>
  );
}
