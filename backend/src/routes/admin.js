import { Router } from "express";
import multer from "multer";
import { pool } from "../db/pool.js";

const upload = multer({ dest: "uploads/" });

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

adminRouter.post("/products", async (req, res, next) => {
  const { name, description, category, image_url, active = true } = req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO products (name, description, category, image_url, active) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, description, category || null, image_url || null, active]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/products", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  const { name, description, category, image_url, active } = req.body || {};
  try {
    const { rows } = await pool.query(
      "UPDATE products SET name = COALESCE($1,name), description = COALESCE($2,description), category = COALESCE($3,category), image_url = COALESCE($4,image_url), active = COALESCE($5,active) WHERE id = $6 RETURNING *",
      [name, description, category, image_url, active, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier" });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

adminRouter.post("/variants", async (req, res, next) => {
  const { product_id, size_label, price_xof, stock = 0, active = true } =
    req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO product_variants (product_id, size_label, price_xof, stock, active) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [product_id, size_label, price_xof, stock, active]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/variants/:id", async (req, res, next) => {
  const { id } = req.params;
  const { size_label, price_xof, stock, active } = req.body || {};
  try {
    const { rows } = await pool.query(
      "UPDATE product_variants SET size_label = COALESCE($1,size_label), price_xof = COALESCE($2,price_xof), stock = COALESCE($3,stock), active = COALESCE($4,active) WHERE id = $5 RETURNING *",
      [size_label, price_xof, stock, active, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/variants/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM product_variants WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM product_variants WHERE product_id = $1", [id]);
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Suspendre/Activer un utilisateur
adminRouter.patch("/users/:id/status", async (req, res, next) => {
  const { id } = req.params;
  const { active } = req.body || {};
  
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: "Le champ 'active' est requis" });
  }
  
  try {
    const { rows } = await pool.query(
      "UPDATE users SET active = $1 WHERE id = $2 RETURNING id, full_name, phone, email, role, active, created_at",
      [active, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  const { status } = req.query;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders WHERE ($1::text IS NULL OR status = $1) ORDER BY id DESC",
      [status || null]
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/dashboard", async (req, res, next) => {
  try {
    const { rows: totals } = await pool.query(
      "SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_xof + delivery_fee_xof),0)::int AS total_revenue FROM orders"
    );
    const { rows: pending } = await pool.query(
      "SELECT COUNT(*)::int AS pending FROM orders WHERE status = 'pending'"
    );
    const { rows: paid } = await pool.query(
      "SELECT COUNT(*)::int AS paid FROM payments WHERE status = 'paid'"
    );
    res.json({
      total_orders: totals[0]?.total_orders || 0,
      total_revenue: totals[0]?.total_revenue || 0,
      pending: pending[0]?.pending || 0,
      paid: paid[0]?.paid || 0
    });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/orders/:id/status", async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body || {};
  try {
    const { rows } = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/orders/:id", async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body || {};
  try {
    const { rows } = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/orders/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM order_items WHERE order_id = $1", [id]);
    await pool.query("DELETE FROM orders WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, phone, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/zones", async (req, res, next) => {
  const { zone, fee_xof = 0, active = true } = req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO deliveries (zone, fee_xof, active) VALUES ($1,$2,$3) RETURNING *",
      [zone, fee_xof, active]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/zones/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM deliveries WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/deliveries", async (req, res, next) => {
  const { zone, fee_xof = 0, active = true } = req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO deliveries (zone, fee_xof, active) VALUES ($1,$2,$3) RETURNING *",
      [zone, fee_xof, active]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/promos", async (req, res, next) => {
  const { code, type, value_xof, value_percent, starts_at, ends_at, active } =
    req.body || {};
  try {
    const { rows } = await pool.query(
      `INSERT INTO promos (code, type, value_xof, value_percent, starts_at, ends_at, active)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,true)) RETURNING *`,
      [code, type, value_xof, value_percent, starts_at, ends_at, active]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
