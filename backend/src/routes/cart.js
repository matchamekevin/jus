import { Router } from "express";
import { pool } from "../db/pool.js";
import { verifySession } from "./auth.js";

export const cartRouter = Router();

// Toutes les routes du panier nécessitent une session valide
cartRouter.use(verifySession);

// ============================================================
// GET / — Charger le panier du user connecté
// ============================================================
cartRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ci.uid AS id, pv.uid AS variant_id, ci.qty,
              pv.size_label, pv.price_xof AS price,
              p.uid AS product_id, p.name AS product_name, p.image_url
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at ASC`,
      [req.userInternalId]
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PUT / — Synchroniser tout le panier (remplace le panier entier)
// Body : { items: [{ variant_id (UUID), qty }] }
// ============================================================
cartRouter.put("/", async (req, res, next) => {
  const { items } = req.body || {};
  const userId = req.userInternalId;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items doit être un tableau" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Vider le panier actuel
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    // Insérer les nouveaux items
    for (const item of items) {
      if (!item.variant_id || !item.qty || item.qty <= 0) continue;

      // Résoudre variant UUID → id interne
      const { rows: vRows } = await client.query(
        "SELECT id FROM product_variants WHERE uid = $1 AND active = true",
        [item.variant_id]
      );
      if (!vRows.length) continue;

      await client.query(
        `INSERT INTO cart_items (user_id, variant_id, qty)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = $3, updated_at = NOW()`,
        [userId, vRows[0].id, item.qty]
      );
    }

    await client.query("COMMIT");

    // Retourner le panier mis à jour
    const { rows } = await client.query(
      `SELECT ci.uid AS id, pv.uid AS variant_id, ci.qty,
              pv.size_label, pv.price_xof AS price,
              p.uid AS product_id, p.name AS product_name, p.image_url
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at ASC`,
      [userId]
    );

    res.json({ items: rows });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// ============================================================
// POST /items — Ajouter ou incrémenter un item dans le panier
// Body : { variant_id (UUID), qty }
// ============================================================
cartRouter.post("/items", async (req, res, next) => {
  const { variant_id, qty = 1 } = req.body || {};
  const userId = req.userInternalId;

  if (!variant_id) {
    return res.status(400).json({ error: "variant_id requis" });
  }

  try {
    // Résoudre variant UUID → id interne
    const { rows: vRows } = await pool.query(
      "SELECT id FROM product_variants WHERE uid = $1 AND active = true",
      [variant_id]
    );
    if (!vRows.length) {
      return res.status(404).json({ error: "Variante introuvable" });
    }

    await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, qty)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = cart_items.qty + $3, updated_at = NOW()`,
      [userId, vRows[0].id, qty]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /items/:variantUid — Modifier la quantité d'un item
// Body : { qty }
// ============================================================
cartRouter.patch("/items/:variantUid", async (req, res, next) => {
  const { variantUid } = req.params;
  const { qty } = req.body || {};
  const userId = req.userInternalId;

  try {
    // Résoudre variant UUID → id interne
    const { rows: vRows } = await pool.query(
      "SELECT id FROM product_variants WHERE uid = $1",
      [variantUid]
    );
    if (!vRows.length) {
      return res.status(404).json({ error: "Variante introuvable" });
    }

    if (qty <= 0) {
      await pool.query(
        "DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2",
        [userId, vRows[0].id]
      );
    } else {
      await pool.query(
        `UPDATE cart_items SET qty = $1, updated_at = NOW()
         WHERE user_id = $2 AND variant_id = $3`,
        [qty, userId, vRows[0].id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE /items/:variantUid — Supprimer un item du panier
// ============================================================
cartRouter.delete("/items/:variantUid", async (req, res, next) => {
  const { variantUid } = req.params;
  const userId = req.userInternalId;

  try {
    const { rows: vRows } = await pool.query(
      "SELECT id FROM product_variants WHERE uid = $1",
      [variantUid]
    );
    if (vRows.length) {
      await pool.query(
        "DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2",
        [userId, vRows[0].id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// DELETE / — Vider tout le panier
// ============================================================
cartRouter.delete("/", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.userInternalId]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
