/*-------------------------------------------------
 *  index.js   —  Express-сервер + Telegram-бот
 *------------------------------------------------*/

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
  ssl: { rejectUnauthorized: false }       // Render-Postgres требует SSL
});

/* ----------  Express  ---------- */
const app = express();
app.use(express.json());
app.get('/api/ping', (_req, res) => {
   res.send('pong');
});
/* статика мини-приложения */
app.use('/shop', express.static(path.join(__dirname, 'public')));

/* REST-эндпоинт: список товаров */
app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT article, name, size FROM products ORDER BY name'
    );
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

/* Webhook-endpoint */
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* /start ➜ кнопка «Открыть магазин» */
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть магазин 🛍️', web_app: { url: `${URL}/shop` } }]
      ]
    }
  });
});

/* данные из mini-app */
bot.on('web_app_data', ctx => {
  bot.sendMessage(
    ctx.chat.id,
    `📦 Ваш заказ:\n${ctx.web_app_data.data}`
  );
});

/* ----------  GO!  ---------- */
app.listen(PORT, () =>
  console.log(`✅  Express & Bot listening on :${PORT}`)
);
