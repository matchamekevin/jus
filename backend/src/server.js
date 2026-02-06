import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { healthRouter } from "./routes/health.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import { paymentsRouter } from "./routes/payments.js";
import { paymentsCallbackRouter } from "./routes/payments_callback.js";
import { deliveriesRouter } from "./routes/deliveries.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { cartRouter } from "./routes/cart.js";
import { sseHandler } from "./services/sse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();
const port = Number(process.env.PORT || 4000);

// Trust proxy (Render / Vercel passent derrière un reverse proxy)
if (isProd) app.set("trust proxy", 1);

// CORS : en prod, accepter les domaines Vercel via ALLOWED_ORIGINS
const allowedOrigins = isProd
  ? (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'x-admin-key'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// === API Routes ===
app.use("/api/health", healthRouter);
app.get("/api/events", sseHandler);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/payments", paymentsCallbackRouter);
app.use("/api/deliveries", deliveriesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/cart", cartRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Jus API running on :${port} [${isProd ? "PRODUCTION" : "DEV"}]`);
});
