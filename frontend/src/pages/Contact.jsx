import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Contact.css';

export default function Contact() {
  return (
    <div className="contact-page">
      <Navbar />
      
      <main className="contact-main">
        {/* Hero Section */}
        <section className="contact-hero">
          <div className="hero-badge">📞 Contactez-nous</div>
          <h1>Nous sommes à votre écoute !</h1>
          <p>Une question ? Une commande ? Notre équipe est là pour vous aider</p>
        </section>

        {/* Contact rapide */}
        <section className="quick-contact">
          <div className="contact-grid">
            <div className="contact-box moov">
              <div className="box-icon">📱</div>
              <h3>Moov Togo</h3>
              <a href="tel:+22896732247" className="phone-number">96 73 22 47</a>
              <div className="contact-tags">
                <span className="tag">Appels</span>
                <span className="tag">WhatsApp</span>
              </div>
            </div>

            <div className="contact-box togocel">
              <div className="box-icon">📲</div>
              <h3>Togocel</h3>
              <a href="tel:+22870472436" className="phone-number">70 47 24 36</a>
              <div className="contact-tags">
                <span className="tag">Appels</span>
              </div>
            </div>

            <div className="contact-box email">
              <div className="box-icon">✉️</div>
              <h3>Email</h3>
              <a href="mailto:matchamegnatikevin894@gmail.com" className="email-link">
                matchamegnatikevin894@gmail.com
              </a>
              <div className="contact-tags">
                <span className="tag">Réponse sous 24h</span>
              </div>
            </div>
          </div>
        </section>

        {/* Informations utiles */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">🕐</span>
                <h3>Horaires</h3>
              </div>
              <div className="hours-list">
                <div className="hour-item">
                  <span className="day">Lundi - Vendredi</span>
                  <span className="time">8h - 20h</span>
                </div>
                <div className="hour-item">
                  <span className="day">Samedi</span>
                  <span className="time">9h - 18h</span>
                </div>
                <div className="hour-item">
                  <span className="day">Dimanche</span>
                  <span className="time">10h - 16h</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">🚚</span>
                <h3>Livraison</h3>
              </div>
              <div className="delivery-info">
                <p><strong>Zone de couverture :</strong><br/>Toute la ville de Lomé et environs</p>
                <p className="highlight">⚡ Livraison rapide en 30-60 min</p>
                <p className="delivery-note">Consultez nos zones de livraison lors de votre commande</p>
              </div>
            </div>

            <div className="info-card">
              <div className="card-header">
                <span className="card-icon">💬</span>
                <h3>Réseaux Sociaux</h3>
              </div>
              <div className="social-grid">
                <a href="https://wa.me/22896732247" className="social-link whatsapp" target="_blank" rel="noopener noreferrer">
                  <span className="social-icon">💬</span>
                  <span>WhatsApp</span>
                </a>
                <a href="#" className="social-link facebook">
                  <span className="social-icon">📘</span>
                  <span>Facebook</span>
                </a>
                <a href="#" className="social-link instagram">
                  <span className="social-icon">📸</span>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>❓ Questions Fréquentes</h2>
          <div className="faq-grid">
            <div className="faq-card">
              <h4>📦 Comment passer commande ?</h4>
              <p>Créez un compte, parcourez nos jus, ajoutez-les au panier et validez. Simple et rapide !</p>
            </div>

            <div className="faq-card">
              <h4>💳 Modes de paiement</h4>
              <p>Paiement à la livraison (cash) ou mobile money (Flooz, T-Money).</p>
            </div>

            <div className="faq-card">
              <h4>💰 Frais de livraison</h4>
              <p>Les frais varient selon votre zone (500 à 2000 FCFA). Visible lors de la commande.</p>
            </div>

            <div className="faq-card">
              <h4>❌ Annulation de commande</h4>
              <p>Possible dans les 10 minutes après validation. Contactez-nous rapidement !</p>
            </div>

            <div className="faq-card">
              <h4>🥤 Fraîcheur garantie</h4>
              <p>Tous nos jus sont préparés le jour même avec des ingrédients 100% naturels.</p>
            </div>

            <div className="faq-card">
              <h4>📍 Zones de livraison</h4>
              <p>12 zones à Lomé : Centre, Tokoin, Bè, Kégué, Agoè, Adidogomé, et plus encore.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
