import { Router } from "express";
import { pool } from "../db/pool.js";

export const ordersRouter = Router();

ordersRouter.post("/", async (req, res, next) => {
  const { items, address, phone, delivery_zone_id, user_id } = req.body || {};
  
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

      const variantIds = items.map((i) => i.variant_id);
      const { rows: variants } = await client.query(
        `SELECT id, price_xof, stock
         FROM product_variants
         WHERE id = ANY($1::int[]) AND active = true`,
        [variantIds]
      );

      if (variants.length !== variantIds.length) {
        throw new Error("Un ou plusieurs produits sont introuvables ou inactifs");
      }

      const variantMap = new Map(variants.map((v) => [v.id, v]));
      let total = 0;

      for (const item of items) {
        if (!item.qty || item.qty <= 0) {
          throw new Error("Quantité invalide");
        }
        const v = variantMap.get(item.variant_id);
        if (!v) {
          throw new Error(`Produit variant ${item.variant_id} introuvable`);
        }
        if (v.stock < item.qty) {
          throw new Error(`Stock insuffisant pour le produit (disponible: ${v.stock})`);
        }
        total += v.price_xof * item.qty;
      }

      let deliveryFee = 0;
      if (delivery_zone_id) {
        const { rows: zones } = await client.query(
          "SELECT fee_xof FROM deliveries WHERE id = $1 AND active = true",
          [delivery_zone_id]
        );
        if (zones[0]) {
          deliveryFee = zones[0].fee_xof;
        }
      }

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, status, total_xof, delivery_fee_xof, address, phone, delivery_zone_id)
         VALUES ($1, 'pending', $2, $3, $4, $5, $6) RETURNING *`,
        [user_id || null, total, deliveryFee, address.trim(), phone.trim(), delivery_zone_id || null]
      );

      const order = orderRows[0];

      for (const item of items) {
        const v = variantMap.get(item.variant_id);
        await client.query(
          `INSERT INTO order_items (order_id, product_variant_id, qty, unit_price_xof)
           VALUES ($1,$2,$3,$4)`,
          [order.id, item.variant_id, item.qty, v.price_xof]
        );
        await client.query(
          "UPDATE product_variants SET stock = stock - $1 WHERE id = $2",
          [item.qty, item.variant_id]
        );
      }

      await client.query("COMMIT");
      res.json({ order_id: order.id, total_xof: total, delivery_fee_xof: deliveryFee });
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

ordersRouter.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows: orders } = await pool.query("SELECT * FROM orders WHERE id = $1", [
      id
    ]);
    if (!orders[0]) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const { rows: items } = await pool.query(
      `SELECT oi.*, pv.size_label
       FROM order_items oi
       JOIN product_variants pv ON pv.id = oi.product_variant_id
       WHERE oi.order_id = $1`,
      [id]
    );
    res.json({ order: orders[0], items });
  } catch (err) {
    next(err);
  }
});
