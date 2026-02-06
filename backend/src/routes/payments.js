import { Router } from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { verifySession } from "./auth.js";

export const paymentsRouter = Router();

paymentsRouter.post("/init", verifySession, async (req, res, next) => {
  const { order_id, provider } = req.body || {};
  try {
    // order_id est maintenant un UUID
    const { rows: orders } = await pool.query(
      `SELECT o.id, o.total_xof, o.delivery_fee_xof
       FROM orders o WHERE o.uid = $1 AND o.user_id = $2`,
      [order_id, req.userInternalId]
    );
    if (!orders[0]) {
      return res.status(404).json({ error: "Commande introuvable" });
    }
    const amount = orders[0].total_xof + orders[0].delivery_fee_xof;
    const internalOrderId = orders[0].id;
    const { rows } = await pool.query(
      "INSERT INTO payments (order_id, provider, status, amount_xof) VALUES ($1,$2,'pending',$3) RETURNING uid, amount_xof, status, provider",
      [internalOrderId, provider || "mobile_money", amount]
    );

    if (provider === "paygate") {
      const memberId = process.env.PAYGATE_MEMBER_ID || "";
      const secretKey = process.env.PAYGATE_SECRET_KEY || "";
      const endpoint = process.env.PAYGATE_ENDPOINT || "";
      const merchantTransactionId = `JUS-${order_id}-${rows[0].uid}`;
      const merchantRedirectUrl = process.env.PAYGATE_REDIRECT_URL || "";
      const notificationUrl = process.env.PAYGATE_NOTIFICATION_URL || "";
      const totype = req.body?.totype || "TMoney";
      const amountFixed = `${amount}.00`;

      const checksumSource = `${memberId}|${totype}|${amountFixed}|${merchantTransactionId}|${merchantRedirectUrl}|${secretKey}`;
      const checksum = crypto
        .createHash("md5")
        .update(checksumSource)
        .digest("hex");

      return res.json({
        payment: rows[0],
        paygate: {
          endpoint,
          fields: {
            memberId,
            totype,
            amount: amountFixed,
            merchantTransactionId,
            merchantRedirectUrl,
            notificationUrl,
            checksum
          }
        }
      });
    }

    res.json({ payment: rows[0], redirect_url: null });
  } catch (err) {
    next(err);
  }
});
