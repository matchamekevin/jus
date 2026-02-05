import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db/pool.js";

export const authRouter = Router();

// Helper: Récupérer les données utilisateur depuis une session DB
async function getSessionUser(sessionToken) {
  if (!sessionToken) return null;
  
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.phone, u.email, u.role, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

// Middleware de vérification de session (DB)
export async function verifySession(req, res, next) {
  const sessionToken = req.headers['x-session-token'];
  
  const user = await getSessionUser(sessionToken);
  if (!user) {
    return res.status(401).json({ error: "Session invalide" });
  }
  
  req.user = user;
  next();
}

// Inscription
authRouter.post("/register", async (req, res, next) => {
  const { full_name, phone, email, password } = req.body || {};

  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({ error: "Nom complet requis (min 2 caractères)" });
  }
  if (!phone || phone.trim().length < 8) {
    return res.status(400).json({ error: "Téléphone requis (min 8 chiffres)" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Mot de passe requis (min 6 caractères)" });
  }

  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Ce numéro est déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, full_name, phone, email, role, created_at`,
      [full_name.trim(), phone.trim(), email?.trim() || null, password_hash]
    );

    const user = rows[0];
    
    // Créer une session dans la DB
    const sessionToken = uuidv4();
    await pool.query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [sessionToken, user.id]
    );

    res.json({ 
      sessionToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// Connexion
authRouter.post("/login", async (req, res, next) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ error: "Téléphone et mot de passe requis" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE phone = $1",
      [phone.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const user = rows[0];
    
    if (!user.password_hash) {
      return res.status(401).json({ error: "Compte invalide" });
    }

    // Vérifier si le compte est suspendu
    if (user.active === false) {
      return res.status(403).json({ error: "Votre compte a été suspendu. Contactez l'administration." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Créer une session dans la DB
    const sessionToken = uuidv4();
    await pool.query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [sessionToken, user.id]
    );

    res.json({
      sessionToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// Déconnexion
authRouter.post("/logout", async (req, res) => {
  const sessionToken = req.headers['x-session-token'];
  
  if (sessionToken) {
    try {
      await pool.query("DELETE FROM sessions WHERE token = $1", [sessionToken]);
    } catch {
      // Ignorer les erreurs
    }
  }
  
  res.json({ success: true });
});

// Vérifier la session
authRouter.get("/verify", async (req, res) => {
  const sessionToken = req.headers['x-session-token'];
  
  const user = await getSessionUser(sessionToken);
  if (!user) {
    return res.status(401).json({ valid: false });
  }
  
  res.json({ valid: true, user });
});

// Récupérer le profil
authRouter.get("/profile/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, phone, email, role, created_at FROM users WHERE id = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Commandes d'un utilisateur
authRouter.get("/orders/:userId", async (req, res, next) => {
  const { userId } = req.params;

  try {
    const { rows: orders } = await pool.query(
      `SELECT o.*, d.zone as delivery_zone
       FROM orders o
       LEFT JOIN deliveries d ON d.id = o.delivery_zone_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// Nettoyage périodique des sessions expirées (à appeler via cron si besoin)
export async function cleanExpiredSessions() {
  try {
    const result = await pool.query("DELETE FROM sessions WHERE expires_at < NOW()");
    console.log(`Sessions expirées supprimées: ${result.rowCount}`);
  } catch (err) {
    console.error("Erreur nettoyage sessions:", err);
  }
}
