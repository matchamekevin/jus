import { Router } from "express";
import { pool } from "../db/pool.js";

export const categoriesRouter = Router();

// Liste des catégories
categoriesRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT category 
       FROM products 
       WHERE active = true AND category IS NOT NULL AND category != ''
       ORDER BY category`
    );
    
    const categories = rows.map(r => r.category);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// Produits par catégorie
categoriesRouter.get("/:category/products", async (req, res, next) => {
  const { category } = req.params;
  
  try {
    const { rows } = await pool.query(
      `SELECT p.id AS product_id, p.name, p.description, p.category, p.image_url,
              v.id AS variant_id, v.size_label, v.price_xof, v.stock
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = true
       WHERE p.active = true AND LOWER(p.category) = LOWER($1)
       ORDER BY p.id DESC, v.id ASC`,
      [category]
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
