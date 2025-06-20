/* routes/products.js — CommonJS */
const express = require("express");
const router  = express.Router();

const { Pool } = require("pg");
const db = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/products
 * ?q=браслет    — поиск по названию
 */
router.get("/products", async (req, res) => {
  try {
    const q   = (req.query.q || "").trim();
    const sql = q
      ? `SELECT article, name, size
           FROM products
          WHERE name ILIKE $1
          LIMIT 50`
      : `SELECT article, name, size
           FROM products
          LIMIT 50`;

    const { rows } = await db.query(sql, q ? [`%${q}%`] : []);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

module.exports = router;           // ВАЖНО! Экспортируем сам Router
