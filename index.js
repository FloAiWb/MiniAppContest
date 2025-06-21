require('dotenv').config();                // .env: BOT_TOKEN, DATABASE_URL, BASE_URL

const express     = require('express');
const path        = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { Pool }    = require('pg');

const PORT  = process.env.PORT      || 10000;
const URL   = process.env.BASE_URL;        // https://<your-app>.onrender.com
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

/* GET /api/products — только публичные товары */
app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT article, name, size, price_rub, photo_file_id
        FROM products
       WHERE is_public = true
    `);
    res.json(rows);
  } catch (e) {
    console.error('[api/products]', e);
    res.status(500).json({ error: 'db_error' });
  }
});

/* POST /api/order — логируем заказ */
app.post('/api/order', (req, res) => {
  console.log('[ORDER]', req.body);
  res.sendStatus(200);
});

/* ----------  Telegram-бот  ---------- */
const bot = new TelegramBot(TOKEN, { polling: false });
bot.setWebHook(`${URL}/bot${TOKEN}`);

/* Endpoint для Webhook */
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* /start ➔ кнопка «Открыть магазин» */
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать в магазин!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛍️ Открыть витрину', web_app: { url: `${URL}/shop` } }]
      ]
    }
  });
});

/* Админ-команды */
// (1) Установить цену: /set_price <артикул> <цена>
bot.onText(/\/set_price\s+(\S+)\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const [ , article, price ] = match;
  try {
    await pool.query(
      'UPDATE products SET price_rub = $1 WHERE article = $2',
      [price, article]
    );
    bot.sendMessage(chatId, `Цена товара ${article} установлена на ${price} ₽`);
  } catch (e) {
    console.error('[set_price]', e);
    bot.sendMessage(chatId, 'Ошибка при установке цены.');
  }
});

// (2) Помещение товара в публичный каталог: /set_public <артикул> on|off
bot.onText(/\/set_public\s+(\S+)\s+(on|off)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const [ , article, mode ] = match;
  const isPublic = mode === 'on';
  try {
    await pool.query(
      'UPDATE products SET is_public = $1 WHERE article = $2',
      [isPublic, article]
    );
    bot.sendMessage(
      chatId,
      `Товар ${article} теперь ${isPublic ? 'публичный' : 'скрыт'}.`
    );
  } catch (e) {
    console.error('[set_public]', e);
    bot.sendMessage(chatId, 'Ошибка при смене статуса.');
  }
});

// (3) Начинаем процедуру загрузки фото: /set_photo <артикул>
const awaitingPhoto = new Map(); // chatId → article
bot.onText(/\/set_photo\s+(\S+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const article = match[1];
  awaitingPhoto.set(chatId, article);
  bot.sendMessage(chatId, `Пришлите фотографию для товара ${article}`);
});

// (4) При получении фото сохраняем file_id в БД
bot.on('photo', async msg => {
  const chatId = msg.chat.id;
  if (!awaitingPhoto.has(chatId)) return;
  const article = awaitingPhoto.get(chatId);
  const photoArray = msg.photo;
  const fileId = photoArray[photoArray.length - 1].file_id; // самый большой
  try {
    await pool.query(
      'UPDATE products SET photo_file_id = $1 WHERE article = $2',
      [fileId, article]
    );
    bot.sendMessage(chatId, `Фотография для ${article} сохранена.`);
  } catch (e) {
    console.error('[set_photo]', e);
    bot.sendMessage(chatId, 'Ошибка при сохранении фото.');
  } finally {
    awaitingPhoto.delete(chatId);
  }
});

/* Данные из web-app (корзина) */
bot.on('web_app_data', ctx => {
  bot.sendMessage(
    ctx.chat.id,
    `📦 Ваш заказ:\n${ctx.web_app_data.data}`
  );
});

/* Стартуем сервер */
app.listen(PORT, () =>
  console.log(`✅  Express & Bot listening on :${PORT}`)
);
