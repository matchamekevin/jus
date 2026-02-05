import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";

export const paymentsCallbackRouter = Router();

paymentsCallbackRouter.post("/callback", async (req, res, next) => {
  const {
    merchantTransactionId,
    status,
    paymentId,
    amount,
    checksum
  } = req.body || {};
  try {
    if (!merchantTransactionId) {
      return res.status(400).json({ error: "merchantTransactionId manquant" });
    }
    const [, orderId, internalPaymentId] = String(merchantTransactionId).split("-");
    if (!internalPaymentId) {
      return res.status(400).json({ error: "Identifier invalide" });
    }
    if (checksum) {
      const secretKey = process.env.PAYGATE_SECRET_KEY || "";
      const source = `${paymentId || ""}|${merchantTransactionId}|${amount || ""}|${status}|${secretKey}`;
      const expected = crypto.createHash("md5").update(source).digest("hex");
      if (expected !== checksum) {
        return res.status(400).json({ error: "Checksum invalide" });
      }
    }
    const paidStatuses = new Set(["paid", "success", "Y", "S"]);
    const newStatus = paidStatuses.has(String(status)) ? "paid" : "failed";
    const { rows } = await pool.query(
      "UPDATE payments SET status = $1, ref_provider = $2 WHERE id = $3 RETURNING *",
      [newStatus, paymentId || null, internalPaymentId]
    );
    res.json({ ok: true, payment: rows[0] });
  } catch (err) {
    next(err);
  }
});
