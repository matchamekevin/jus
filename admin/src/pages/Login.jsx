import { useState } from "react";
import { FiLock } from 'react-icons/fi';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Vérification simple (en production : appel API)
    if (form.username === "admin" && form.password === "justogo2026") {
      sessionStorage.setItem("admin_token", btoa(`${form.username}:${Date.now()}`));
      sessionStorage.setItem("admin_user", form.username);
      navigate("/");
    } else {
      setError("Identifiants incorrects");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock />
            <h1 style={{ margin: 0 }}>JusTogo Admin</h1>
          </div>
          <p>Connectez-vous au back-office</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          
          <div className="field">
            <label>Identifiant</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="admin"
              required
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
