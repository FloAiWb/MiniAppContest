// index.js  (ES-module, поэтому используем import/export)
// -------------------------------------------------------
// 1. Загружаем переменные из .env
import dotenv      from 'dotenv';
dotenv.config();

// 2. Подключаем зависимости
import express     from 'express';
import TelegramBot from 'node-telegram-bot-api';

// 3. Читаем конфигурацию из окружения (Render передаёт PORT сам)
const PORT  = process.env.PORT  || 10000;   // порт Express-сервера
const TOKEN = process.env.BOT_TOKEN;        // токен вашего бота

// 4. Запускаем Express
const app = express();

// Health-check, чтобы Render видел, что сервис «жив»
app.get('/', (_req, res) => res.send('OK'));

// ВАЖНО: вызываем app.listen **один** раз!
app.listen(PORT, () => {
  console.log(`✅  Express listening on :${PORT}`);
});

/* ------------------------------------------------------------------
   Ниже идёт вся логика Telegram-бота. Она НЕ должна делать второй
   app.listen — Express уже запущен.
-------------------------------------------------------------------*/

const bot = new TelegramBot(TOKEN, { polling: true });

// Простейший эхо-обработчик
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Вы написали: ${msg.text}`);
});

// Здесь можно добавлять другие обработчики (команды, callback-query и т.д.)
