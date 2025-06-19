/**
 * index.js — один-единственный экземпляр бота.
 * Работает через Express и Webhook (без polling).
 *
 * ⓘ  Требуются переменные окружения:
 *     BOT_TOKEN   — токен из BotFather
 *     RENDER_EXTERNAL_URL — Render подставляет, вида https://<service>.onrender.com
 */

import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import TelegramBot from 'node-telegram-bot-api';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const token   = process.env.BOT_TOKEN;
const baseURL = process.env.RENDER_EXTERNAL_URL;      // Render задаёт автоматически
const port    = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());              // тело запроса в req.body

// === Telegram-бот, режим "webHook" ==========================
const bot = new TelegramBot(token, { webHook: { port } });

// Устанавливаем URL, по которому Telegram будет слать апдейты
const secretPath = `/bot${token}`;       // уникальный путь, никто не угадает
await bot.setWebHook(`${baseURL}${secretPath}`);

// Express-ендпойнт, куда Telegram POST-ит апдейты
app.post(secretPath, (req, res) => {
  bot.processUpdate(req.body);
  res.status(200).send('OK');
});

// ======= ваш Front (vite build → dist) ======================
app.use(express.static(path.join(__dirname, 'dist')));

// Health-check
app.get('/', (_, res) => res.send('OK — bot running'));

// Запускаемся
app.listen(port, () => console.log(`Express & Telegram Webhook on :${port}`));

// ======= обработчики сообщений ==============================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать! ✨\nНапишите любой текст — я повторю.');
});

bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Вы написали: «${msg.text}»`);
  }
});
