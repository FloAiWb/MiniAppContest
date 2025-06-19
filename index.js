// index.js — backend + инициализация бота
import 'dotenv/config';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT       = process.env.PORT      || 3000;
const BOT_TOKEN  = process.env.BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://example.com';

// 1) HTTP-сервер + раздача статических файлов (Vite build в папке /dist)
const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/health', (_req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Express listening on ${PORT}`));

// 2) Telegram-бот (long polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// /start → кнопка «Перейти в витрину»
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Открыть магазин', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Перейти в витрину 🛒', web_app: { url: WEBAPP_URL } }]
      ]
    }
  });
});

// echo-ответ для всех прочих сообщений
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/start')) return;
  bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});
