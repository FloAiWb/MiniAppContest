require('dotenv').config();                // .env: BOT_TOKEN, DATABASE_URL, BASE_URL

const express     = require('express');
const path        = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { Pool }    = require('pg');

const PORT  = process.env.PORT      || 10000;
const URL   = process.env.BASE_URL;        // https://miniappcontest-anin.onrender.com
const TOKEN = process.env.BOT_TOKEN;
const DB    = process.env.DATABASE_URL;    // строка подключения к Render-Postgres

/* ----------  PostgreSQL  ---------- */
const pool = new Pool({
  connectionString: DB,
  ssl: { rejectUnauthorized: false }
});

/* ----------  Express  ---------- */
const app = express();
app.use(express.json());
app.use('/shop', express.static(path.join(__dirname, 'public')));

/**
 * GET /api/products
 *  - query.category (optional) — фильтр по категории
 *  возвращает массив { article, name, size, price_rub, category, photo_file_id }
 */
app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  try {
    const params = [];
    let sql = `SELECT article, name, size, price_rub, category, photo_file_id
               FROM products
               WHERE is_public = true`;
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ` ORDER BY name`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('[api/products]', e);
    res.status(500).json({ error: 'db_error' });
  }
});

/* «оформление заказа» – пока просто лог */
app.post('/api/order', (req, res) => {
  console.log('[ORDER]', req.body);
  res.sendStatus(200);
});

/* ----------  Telegram-бот  ---------- */
const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Webhook-endpoint
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start ➜ кнопка «Открыть магазин»
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть магазин 🛍️', web_app: { url: `${URL}/shop` } }]
      ]
    }
  });
});

// данные из mini-app (JSON-строка)
bot.on('web_app_data', ctx => {
  bot.sendMessage(
    ctx.chat.id,
    `📦 Ваш заказ:\n${ctx.web_app_data.data}`
  );
});

// дополнительные админ-команды в чат-боте
// /set_price {article} {price} — меняем цену в БД
bot.onText(/\/set_price\s+(\S+)\s+(\d+)/, async (msg, match) => {
  const chatId  = msg.chat.id;
  const [ , article, price ] = match;
  try {
    await pool.query(
      `UPDATE products SET price_rub = $1 WHERE article = $2`,
      [ parseInt(price,10), article ]
    );
    bot.sendMessage(chatId, `✅ Цена для ${article} установлена: ${price} ₽`);
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, `❌ Не удалось обновить цену.`);
  }
});

// /set_photo {article} — следующий присланный файл закрепляем за этим article
let pendingPhoto = {};
bot.onText(/\/set_photo\s+(\S+)/, msg => {
  pendingPhoto[msg.from.id] = msg.match[1];
  bot.sendMessage(msg.chat.id, `Пришлите теперь фотографию для артикул «${msg.match[1]}».`);
});
bot.on('photo', async msg => {
  const key = msg.from.id;
  const article = pendingPhoto[key];
  if (!article) return;
  const fileId = msg.photo.slice(-1)[0].file_id;
  delete pendingPhoto[key];
  try {
    await pool.query(
      `UPDATE products SET photo_file_id = $1 WHERE article = $2`,
      [ fileId, article ]
    );
    bot.sendMessage(msg.chat.id, `✅ Фото установлено для ${article}.`);
  } catch (e) {
    console.error(e);
    bot.sendMessage(msg.chat.id, `❌ Не удалось сохранить фото.`);
  }
});

/* ----------  GO!  ---------- */
app.listen(PORT, () =>
  console.log(`✅  Express & Bot listening on :${PORT}`)
);
