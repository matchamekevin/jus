import { Router } from "express";
import { pool } from "../db/pool.js";

export const deliveriesRouter = Router();

deliveriesRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT uid AS id, zone, fee_xof FROM deliveries WHERE active = true ORDER BY id ASC"
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});
