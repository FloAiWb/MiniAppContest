// index.js  – всё, что нужно боту на данном этапе
import 'dotenv/config';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app   = express();
const port  = process.env.PORT  || 3000;           // Render передаст свой порт
const token = process.env.BOT_TOKEN;               // Токен бота
const site  = process.env.SITE_URL;                // 👉 URL витрины

// ──────────────────────────────────────────────────────────
// 1.  Health-check
app.get('/', (_req, res) => res.send('OK — bot running'));
app.listen(port, () => console.log(`✅  Express & Telegram Webhook listening on :${port}`));

// 2.  Telegram-бот (long polling, так проще всего)
const bot = new TelegramBot(token, { polling: true });

// /start  – шлём кнопку-WebApp
bot.onText(/\/start/i, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🛍  Открыть магазин',
            web_app: { url: site }        // ← Telegram откроет витрину внутри чата
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'Добро пожаловать! Нажмите кнопку 👇', keyboard);
});

// (позже: обработка WebAppData, оплат и т.д.)
