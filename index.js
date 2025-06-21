// index.js
require('dotenv').config();                // .env: BOT_TOKEN, DATABASE_URL, BASE_URL, ADMIN_ID

const express     = require('express');
const path        = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { Pool }    = require('pg');

const PORT   = process.env.PORT      || 10000;
const URL    = process.env.BASE_URL;          // например https://your-app.onrender.com
const TOKEN  = process.env.BOT_TOKEN;
const DB_URL = process.env.DATABASE_URL;      // строка подключения к Render-Postgres
const ADMIN_ID = Number(process.env.ADMIN_ID);// Ваш Telegram-ID

// Настройка PostgreSQL
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

// Инициализация Express
const app = express();
app.use(express.json());
app.use('/shop', express.static(path.join(__dirname, 'public')));

// REST: выдаём товары с учётом видимости
app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT article, name, size, price_rub, photo_file_id 
        FROM products
       WHERE is_public
       ORDER BY name
    `);
    res.json(rows);
  } catch (e) {
    console.error('[api/products]', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// Логируем «заказы»
app.post('/api/order', (req, res) => {
  console.log('[ORDER]', req.body);
  res.sendStatus(200);
});

// Инициализация Telegram Bot (webhook)
const bot = new TelegramBot(TOKEN, { polling: false });
bot.setWebHook(`${URL}/bot${TOKEN}`);
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start — гости + админ­кнопка
bot.onText(/\/start/, msg => {
  const keyboard = [
    [{ text: 'Открыть магазин 🛍️', web_app: { url: `${URL}/shop` } }]
  ];
  if (msg.from.id === ADMIN_ID) {
    keyboard.push([{ text: '⚙️ Админ-панель', callback_data: 'ADMIN_MENU' }]);
  }
  bot.sendMessage(msg.chat.id, 'Добро пожаловать!', {
    reply_markup: { inline_keyboard: keyboard }
  });
});

// Обработка нажатий в админ-меню
bot.on('callback_query', async q => {
  const id = q.from.id;
  if (id !== ADMIN_ID) return;

  await bot.answerCallbackQuery(q.id);
  if (q.data === 'ADMIN_MENU') {
    return bot.sendMessage(id, '🛠 Выберите действие:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Изменить цену', callback_data: 'ADMIN_SET_PRICE' }],
          [{ text: 'Загрузить фото', callback_data: 'ADMIN_SET_PHOTO' }]
        ]
      }
    });
  }

  if (q.data === 'ADMIN_SET_PRICE') {
    return bot.sendMessage(id, '❓ Введите: <артикул> <новая_цена>', {
      reply_markup: { remove_keyboard: true }
    });
  }

  if (q.data === 'ADMIN_SET_PHOTO') {
    return bot.sendMessage(
      id,
      '❓ Впишите артикул, а затем _ответьте_ на это сообщение фотографией.',
      { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
    );
  }
});

// Парсим текстовые сообщения от админа
bot.on('message', async msg => {
  const id = msg.from.id;
  if (id !== ADMIN_ID) return;

  // 1) Смена цены: «art123 1199»
  if (msg.text && /^\S+\s+\d+$/.test(msg.text.trim())) {
    const [article, priceStr] = msg.text.trim().split(/\s+/);
    const price = Number(priceStr);
    await pool.query(
      'UPDATE products SET price_rub = $1 WHERE article = $2',
      [price, article]
    );
    return bot.sendMessage(id, `✅ Цена «${article}» = ${price} ₽`);
  }

  // 2) Загрузка фото (ответ на сообщение с артикулом)
  if (msg.photo && msg.reply_to_message && msg.reply_to_message.text) {
    const m = msg.reply_to_message.text.match(/(\S+)/);
    const article = m ? m[1] : null;
    if (!article) {
      return bot.sendMessage(id, '❗️ Не найден артикул в исходном сообщении.');
    }
    const fileId = msg.photo.slice(-1)[0].file_id;
    await pool.query(
      'UPDATE products SET photo_file_id = $1 WHERE article = $2',
      [fileId, article]
    );
    return bot.sendMessage(id, `✅ Фото для «${article}» сохранено.`);
  }
});

// Старт сервера
app.listen(PORT, () => console.log(`✅ Server & Bot listening on :${PORT}`));
