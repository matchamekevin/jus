import { Router } from "express";
import multer from "multer";
import path from "path";
import { pool } from "../db/pool.js";
import { broadcast } from "../services/sse.js";

// Multer : stocker les images avec un nom unique + extension originale
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  }
});

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Créer un produit (JSON simple, sans image)
adminRouter.post("/products", async (req, res, next) => {
  const { name, description, category, image_url, active = true } = req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO products (name, description, category, image_url, active) VALUES ($1,$2,$3,$4,$5) RETURNING uid AS id, name, description, category, image_url, active",
      [name, description, category || null, image_url || null, active]
    );
    broadcast("products");
    broadcast("dashboard");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Créer un produit AVEC upload d'image (multipart)
adminRouter.post("/products/with-image", upload.single("image"), async (req, res, next) => {
  const { name, description, category, active } = req.body || {};
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      "INSERT INTO products (name, description, category, image_url, active) VALUES ($1,$2,$3,$4,$5) RETURNING uid AS id, name, description, category, image_url, active",
      [name, description, category || null, image_url, active !== 'false']
    );
    broadcast("products");
    broadcast("dashboard");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Liste des produits ADMIN (inclut inactifs + variantes)
adminRouter.get("/products", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.uid AS product_id, p.name, p.description, p.category, p.image_url, p.active,
              v.uid AS variant_id, v.size_label, v.price_xof, v.stock, v.active AS variant_active
       FROM products p
       LEFT JOIN product_variants v ON v.product_id = p.id
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
          active: row.active,
          variants: []
        });
      }
      if (row.variant_id) {
        map.get(row.product_id).variants.push({
          id: row.variant_id,
          size_label: row.size_label,
          price_xof: row.price_xof,
          stock: row.stock,
          active: row.variant_active
        });
      }
    }
    res.json({ items: Array.from(map.values()) });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  const { name, description, category, image_url, active } = req.body || {};
  try {
    const { rows } = await pool.query(
      "UPDATE products SET name = COALESCE($1,name), description = COALESCE($2,description), category = COALESCE($3,category), image_url = COALESCE($4,image_url), active = COALESCE($5,active) WHERE uid = $6 RETURNING uid AS id, name, description, category, image_url, active",
      [name, description, category, image_url, active, id]
    );
    broadcast("products");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Modifier un produit AVEC upload d'image (multipart)
adminRouter.patch("/products/:id/with-image", upload.single("image"), async (req, res, next) => {
  const { id } = req.params;
  const { name, description, category, active } = req.body || {};
  const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  try {
    const { rows } = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        image_url = COALESCE($4, image_url),
        active = COALESCE($5, active)
       WHERE uid = $6 RETURNING uid AS id, name, description, category, image_url, active`,
      [name || null, description || null, category || null, image_url || null, 
       active !== undefined ? active !== 'false' : null, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Produit introuvable" });
    broadcast("products");
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
    // Résoudre le product_id UUID → id interne
    const { rows: pRows } = await pool.query("SELECT id FROM products WHERE uid = $1", [product_id]);
    if (!pRows.length) return res.status(404).json({ error: "Produit introuvable" });
    const { rows } = await pool.query(
      "INSERT INTO product_variants (product_id, size_label, price_xof, stock, active) VALUES ($1,$2,$3,$4,$5) RETURNING uid AS id, size_label, price_xof, stock, active",
      [pRows[0].id, size_label, price_xof, stock, active]
    );
    broadcast("products");
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
      "UPDATE product_variants SET size_label = COALESCE($1,size_label), price_xof = COALESCE($2,price_xof), stock = COALESCE($3,stock), active = COALESCE($4,active) WHERE uid = $5 RETURNING uid AS id, size_label, price_xof, stock, active",
      [size_label, price_xof, stock, active, id]
    );
    broadcast("products");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/variants/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM product_variants WHERE uid = $1", [id]);
    broadcast("products");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows: pRows } = await pool.query("SELECT id AS iid FROM products WHERE uid = $1", [id]);
    if (pRows.length) {
      await pool.query("DELETE FROM product_variants WHERE product_id = $1", [pRows[0].iid]);
    }
    await pool.query("DELETE FROM products WHERE uid = $1", [id]);
    broadcast("products");
    broadcast("dashboard");
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
      "UPDATE users SET active = $1 WHERE uid = $2 RETURNING uid AS id, full_name, phone, email, role, active, created_at",
      [active, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    broadcast("users");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/orders", async (req, res, next) => {
  const { status } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT o.uid AS id, o.status, o.total_xof, o.delivery_fee_xof,
              o.address, o.phone, o.created_at,
              u.full_name AS customer_name
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE ($1::text IS NULL OR o.status = $1)
       ORDER BY o.created_at DESC`,
      [status || null]
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/dashboard", async (req, res, next) => {
  try {
    const [
      { rows: totals },
      { rows: pending },
      { rows: delivered },
      { rows: paid },
      { rows: cancelled },
      { rows: prodStats },
      { rows: userStats },
      { rows: zoneStats },
      { rows: recentOrders },
      { rows: todayRevenue },
      { rows: topProducts }
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_xof + delivery_fee_xof),0)::int AS total_revenue FROM orders"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'delivered'"),
      pool.query("SELECT COUNT(*)::int AS count FROM payments WHERE status = 'paid'"),
      pool.query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'cancelled'"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE active) ::int AS active FROM products"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE active) ::int AS active FROM users"),
      pool.query("SELECT COUNT(*)::int AS total FROM deliveries WHERE active = true"),
      pool.query(`SELECT o.uid AS id, o.status, o.total_xof, o.delivery_fee_xof, o.phone, o.address, o.created_at,
                         u.full_name AS customer_name
                  FROM orders o LEFT JOIN users u ON u.id = o.user_id
                  ORDER BY o.created_at DESC LIMIT 10`),
      pool.query(`SELECT COALESCE(SUM(total_xof + delivery_fee_xof),0)::int AS revenue,
                         COUNT(*)::int AS count
                  FROM orders WHERE created_at >= CURRENT_DATE`),
      pool.query(`SELECT p.name, SUM(oi.qty)::int AS total_sold
                  FROM order_items oi
                  JOIN product_variants pv ON pv.id = oi.product_variant_id
                  JOIN products p ON p.id = pv.product_id
                  GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5`)
    ]);

    res.json({
      total_orders: totals[0]?.total_orders || 0,
      total_revenue: totals[0]?.total_revenue || 0,
      pending: pending[0]?.count || 0,
      delivered: delivered[0]?.count || 0,
      paid: paid[0]?.count || 0,
      cancelled: cancelled[0]?.count || 0,
      total_products: prodStats[0]?.total || 0,
      active_products: prodStats[0]?.active || 0,
      total_users: userStats[0]?.total || 0,
      active_users: userStats[0]?.active || 0,
      total_zones: zoneStats[0]?.total || 0,
      today_revenue: todayRevenue[0]?.revenue || 0,
      today_orders: todayRevenue[0]?.count || 0,
      recent_orders: recentOrders,
      top_products: topProducts
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
      "UPDATE orders SET status = $1 WHERE uid = $2 RETURNING uid AS id, status",
      [status, id]
    );
    broadcast("orders");
    broadcast("dashboard");
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
      "UPDATE orders SET status = $1 WHERE uid = $2 RETURNING uid AS id, status",
      [status, id]
    );
    broadcast("orders");
    broadcast("dashboard");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/orders/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows: oRows } = await pool.query("SELECT id AS iid FROM orders WHERE uid = $1", [id]);
    if (oRows.length) {
      await pool.query("DELETE FROM order_items WHERE order_id = $1", [oRows[0].iid]);
    }
    await pool.query("DELETE FROM orders WHERE uid = $1", [id]);
    broadcast("orders");
    broadcast("dashboard");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT uid AS id, full_name, phone, email, role, active, created_at FROM users ORDER BY created_at DESC"
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
      "INSERT INTO deliveries (zone, fee_xof, active) VALUES ($1,$2,$3) RETURNING uid AS id, zone, fee_xof, active",
      [zone, fee_xof, active]
    );
    broadcast("zones");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/zones/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM deliveries WHERE uid = $1", [id]);
    broadcast("zones");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/deliveries", async (req, res, next) => {
  const { zone, fee_xof = 0, active = true } = req.body || {};
  try {
    const { rows } = await pool.query(
      "INSERT INTO deliveries (zone, fee_xof, active) VALUES ($1,$2,$3) RETURNING uid AS id, zone, fee_xof, active",
      [zone, fee_xof, active]
    );
    broadcast("zones");
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
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,true)) RETURNING uid AS id, code, type, value_xof, value_percent, starts_at, ends_at, active`,
      [code, type, value_xof, value_percent, starts_at, ends_at, active]
    );
    broadcast("promos");
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
