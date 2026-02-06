import { Router } from "express";
import { pool } from "../db/pool.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.uid AS product_id, p.name, p.description, p.category, p.image_url,
              v.uid AS variant_id, v.size_label, v.price_xof, v.stock
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = true
       WHERE p.active = true
       ORDER BY p.id DESC, v.id ASC`
    );

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.name,
          description: row.description,
          category: row.category,
          image_url: row.image_url,
          variants: []
        });
      }
      if (row.variant_id) {
        map.get(row.product_id).variants.push({
          id: row.variant_id,
          size_label: row.size_label,
          price_xof: row.price_xof,
          stock: row.stock
        });
      }
    }

    res.json({ items: Array.from(map.values()) });
  } catch (err) {
    next(err);
  }
});
