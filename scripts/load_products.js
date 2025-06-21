#!/usr/bin/env node
/**
 * scripts/load_products.js
 * ------------------------
 * Читает XLSX из data/products.xlsx и upsert’ит в таблицу products:
 *  article, name, size, price_rub, category
 */

require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const { Pool } = require('pg');

// путь к вашему файлу с данными
const XLSX_FILE = path.join(__dirname, '../data/2025-06-18 Бижутерные украшения.xlsx');

const workbook = XLSX.readFile(XLSX_FILE);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

;(async () => {
  try {
    for (const row of rows) {
      const article  = String(row['Артикул']).trim();
      const name     = String(row['Название товара']).trim();
      const size     = row['Размер'] ? String(row['Размер']).trim() : null;
      const price    = parseInt(row['Цена, руб.'], 10) || null;
      const category = row['Категория'] ? String(row['Категория']).trim() : null;

      if (!article || !name) continue;

      await pool.query(
        `INSERT INTO products(article,name,size,price_rub,category)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT (article) DO UPDATE
           SET name        = EXCLUDED.name,
               size        = EXCLUDED.size,
               price_rub   = EXCLUDED.price_rub,
               category    = EXCLUDED.category`,
        [article, name, size, price, category]
      );
      console.log(`✓ ${article}`);
    }

    console.log('\nИмпорт завершён успешно.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
