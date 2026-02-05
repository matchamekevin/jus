import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { healthRouter } from "./routes/health.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import { paymentsRouter } from "./routes/payments.js";
import { paymentsCallbackRouter } from "./routes/payments_callback.js";
import { deliveriesRouter } from "./routes/deliveries.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";

const app = express();
const port = Number(process.env.PORT || 4000);

// Configuration CORS pour permettre les requêtes depuis le frontend et l'admin
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'x-admin-key'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet avec configuration permissive pour le développement
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

app.use("/api/health", healthRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/payments", paymentsCallbackRouter);
app.use("/api/deliveries", deliveriesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne" });
});

app.listen(port, () => {
  console.log(`Jus API running on :${port}`);
});
