// src/db.js
import pg from "pg";

export const pool = new pg.Pool({
  host:     process.env.PGHOST,
  port:     process.env.PGPORT,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl:      { rejectUnauthorized: false }   // Render → обязательно
});
