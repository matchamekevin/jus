import { Link } from "react-router-dom";

export default function Confirmation() {
  return (
    <section className="section">
      <h2>Paiement</h2>
      <p>Merci. Votre paiement est en cours de verification.</p>
      <Link className="btn small" to="/track">
        Suivre ma commande
      </Link>
    </section>
  );
}
