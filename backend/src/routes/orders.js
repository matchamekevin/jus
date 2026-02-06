import { Router } from "express";
import { pool } from "../db/pool.js";
import { verifySession } from "./auth.js";
import { broadcast } from "../services/sse.js";

export const ordersRouter = Router();

ordersRouter.post("/", verifySession, async (req, res, next) => {
  const { items, address, phone, delivery_zone_id } = req.body || {};
  // user_id interne depuis la session vérifiée
  const user_id = req.userInternalId;
  
  // Validation
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le panier est vide" });
  }
  if (!address || address.trim().length < 5) {
    return res.status(400).json({ error: "Adresse invalide (minimum 5 caractères)" });
  }
  if (!phone || phone.trim().length < 8) {
    return res.status(400).json({ error: "Numéro de téléphone invalide" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Résoudre les variant UIDs vers les IDs internes
      const variantUids = items.map((i) => i.variant_id);
      const { rows: variants } = await client.query(
        `SELECT id, uid, price_xof, stock
         FROM product_variants
         WHERE uid = ANY($1::uuid[]) AND active = true`,
        [variantUids]
      );

      if (variants.length !== variantUids.length) {
        throw new Error("Un ou plusieurs produits sont introuvables ou inactifs");
      }

      const variantMap = new Map(variants.map((v) => [v.uid, v]));
      let total = 0;

      for (const item of items) {
        if (!item.qty || item.qty <= 0) {
          throw new Error("Quantité invalide");
        }
        const v = variantMap.get(item.variant_id);
        if (!v) {
          throw new Error(`Produit introuvable`);
        }
        if (v.stock < item.qty) {
          throw new Error(`Stock insuffisant pour le produit (disponible: ${v.stock})`);
        }
        total += v.price_xof * item.qty;
      }

      // Résoudre delivery_zone_id (UUID) vers id interne
      let deliveryFee = 0;
      let zoneInternalId = null;
      if (delivery_zone_id) {
        const { rows: zones } = await client.query(
          "SELECT id, fee_xof FROM deliveries WHERE uid = $1 AND active = true",
          [delivery_zone_id]
        );
        if (zones[0]) {
          deliveryFee = zones[0].fee_xof;
          zoneInternalId = zones[0].id;
        }
      }

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, status, total_xof, delivery_fee_xof, address, phone, delivery_zone_id)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6) RETURNING uid`,
        [user_id || null, total, deliveryFee, address.trim(), phone.trim(), zoneInternalId]
      );

      const order = orderRows[0];

      for (const item of items) {
        const v = variantMap.get(item.variant_id);
        await client.query(
          `INSERT INTO order_items (order_id, product_variant_id, qty, unit_price_xof)
           VALUES ((SELECT id FROM orders WHERE uid = $1), $2, $3, $4)`,
          [order.uid, v.id, item.qty, v.price_xof]
        );
        await client.query(
          "UPDATE product_variants SET stock = stock - $1 WHERE id = $2",
          [item.qty, v.id]
        );
      }

      await client.query("COMMIT");
      broadcast("orders");
      broadcast("dashboard");
      broadcast("products");
      res.json({ order_id: order.uid, total_xof: total, delivery_fee_xof: deliveryFee });
    } catch (err) {
      await client.query("ROLLBACK");
      if (err.message.includes("Stock") || err.message.includes("introuvable") || err.message.includes("invalide")) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:uid", verifySession, async (req, res, next) => {
  const { uid } = req.params;
  try {
    const { rows: orders } = await pool.query(
      `SELECT o.uid AS id, o.status, o.total_xof, o.delivery_fee_xof,
              o.address, o.phone, o.created_at
       FROM orders o
       WHERE o.uid = $1 AND o.user_id = $2`,
      [uid, req.userInternalId]
    );
    if (!orders[0]) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const { rows: items } = await pool.query(
      `SELECT oi.uid AS id, pv.uid AS variant_id, pv.size_label, oi.qty, oi.unit_price_xof
       FROM order_items oi
       JOIN product_variants pv ON pv.id = oi.product_variant_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.uid = $1`,
      [uid]
    );
    res.json({ order: orders[0], items });
  } catch (err) {
    next(err);
  }
});
