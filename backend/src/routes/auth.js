import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { pool } from "../db/pool.js";

export const authRouter = Router();

// ============================================================
// Helper : générer un fingerprint à partir du User-Agent
// (pas d'IP : instable derrière les proxys Vercel/Render)
// ============================================================
function makeFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(ua).digest('hex').slice(0, 32);
}

// ============================================================
// Helper : Récupérer les données utilisateur depuis une session DB
// Vérifie aussi le fingerprint si présent
// ============================================================
async function getSessionUser(sessionToken, fingerprint) {
  if (!sessionToken) return null;

  try {
    const { rows } = await pool.query(
      `SELECT u.uid, u.full_name, u.phone, u.email, u.role, u.active, u.created_at,
              s.fingerprint AS session_fp
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );
    if (rows.length === 0) return null;

    const row = rows[0];

    // Vérifier le fingerprint s'il existe en BD
    if (row.session_fp && fingerprint && row.session_fp !== fingerprint) {
      await pool.query("DELETE FROM sessions WHERE token = $1", [sessionToken]);
      return null;
    }

    if (row.active === false) return null;

    return {
      id: row.uid,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      role: row.role,
      created_at: row.created_at
    };
  } catch {
    return null;
  }
}

// ============================================================
// Middleware de vérification de session (DB + fingerprint)
// ============================================================
export async function verifySession(req, res, next) {
  const sessionToken = req.headers['x-session-token'];
  const fingerprint = makeFingerprint(req);

  const user = await getSessionUser(sessionToken, fingerprint);
  if (!user) {
    return res.status(401).json({ error: "Session invalide" });
  }

  req.user = user;
  try {
    const { rows } = await pool.query("SELECT id FROM users WHERE uid = $1", [user.id]);
    req.userInternalId = rows[0]?.id;
  } catch {
    return res.status(500).json({ error: "Erreur interne" });
  }

  next();
}

// ============================================================
// Inscription
// ============================================================
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
       RETURNING id, uid, full_name, phone, email, role, created_at`,
      [full_name.trim(), phone.trim(), email?.trim() || null, password_hash]
    );

    const user = rows[0];

    // Ne PAS supprimer les sessions existantes — on autorise les sessions multiples

    const sessionToken = uuidv4();
    const fingerprint = makeFingerprint(req);
    await pool.query(
      `INSERT INTO sessions (token, user_id, fingerprint, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [sessionToken, user.id, fingerprint]
    );

    res.json({
      sessionToken,
      user: {
        id: user.uid,
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

// ============================================================
// Connexion
// ============================================================
authRouter.post("/login", async (req, res, next) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ error: "Téléphone et mot de passe requis" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, uid, full_name, phone, email, role, password_hash, active FROM users WHERE phone = $1",
      [phone.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: "Compte invalide" });
    }

    if (user.active === false) {
      return res.status(403).json({ error: "Votre compte a été suspendu. Contactez l'administration." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    // Ne PAS supprimer les sessions existantes — on autorise les sessions multiples

    const sessionToken = uuidv4();
    const fingerprint = makeFingerprint(req);
    await pool.query(
      `INSERT INTO sessions (token, user_id, fingerprint, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [sessionToken, user.id, fingerprint]
    );

    res.json({
      sessionToken,
      user: {
        id: user.uid,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Déconnexion
// ============================================================
authRouter.post("/logout", async (req, res) => {
  const sessionToken = req.headers['x-session-token'];

  if (sessionToken) {
    try {
      // Supprimer UNIQUEMENT la session courante, pas toutes les sessions de l'utilisateur
      await pool.query("DELETE FROM sessions WHERE token = $1", [sessionToken]);
    } catch { /* ignore */ }
  }

  res.json({ success: true });
});

// ============================================================
// Vérifier la session (au chargement de page)
// ============================================================
authRouter.get("/verify", async (req, res) => {
  const sessionToken = req.headers['x-session-token'];
  const fingerprint = makeFingerprint(req);

  const user = await getSessionUser(sessionToken, fingerprint);
  if (!user) {
    return res.status(401).json({ valid: false });
  }

  res.json({ valid: true, user });
});

// ============================================================
// Profil (protégé par session — plus besoin de passer l'id dans l'URL)
// ============================================================
authRouter.get("/profile", verifySession, async (req, res) => {
  res.json({ user: req.user });
});

// ============================================================
// Commandes d'un utilisateur (protégé par session, vérifie ownership via UUID)
// ============================================================
authRouter.get("/orders/:userUid", verifySession, async (req, res, next) => {
  const { userUid } = req.params;

  if (req.user.id !== userUid) {
    return res.status(403).json({ error: "Accès interdit" });
  }

  try {
    const { rows: orders } = await pool.query(
      `SELECT o.uid AS id, o.status, o.total_xof, o.delivery_fee_xof,
              o.address, o.phone, o.created_at,
              d.zone AS delivery_zone
       FROM orders o
       LEFT JOIN deliveries d ON d.id = o.delivery_zone_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.userInternalId]
    );

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// Nettoyage périodique des sessions expirées
// ============================================================
export async function cleanExpiredSessions() {
  try {
    const result = await pool.query("DELETE FROM sessions WHERE expires_at < NOW()");
    console.log(`Sessions expirées supprimées: ${result.rowCount}`);
  } catch (err) {
    console.error("Erreur nettoyage sessions:", err);
  }
}
