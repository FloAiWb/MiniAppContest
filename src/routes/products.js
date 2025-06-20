// src/routes/products.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT article, name, size FROM products ORDER BY name"
    );
    res.json(rows);                         // ← [{article,…}, …]
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
