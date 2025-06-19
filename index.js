/**********************************************************************
 * index.js  (Webhook-вариант без двойного listen)
 *********************************************************************/
import 'dotenv/config';
import express      from 'express';
import bodyParser   from 'body-parser';
import TelegramBot  from 'node-telegram-bot-api';
import path         from 'node:path';
import { fileURLToPath } from 'node:url';

const token   = process.env.BOT_TOKEN;
const baseURL = process.env.RENDER_EXTERNAL_URL;   // Render даёт автоматически
const port    = process.env.PORT || 3000;          // Render пробросит свой

// ────────────────────────────────────────────────────────────────────
// 1) Express
// ────────────────────────────────────────────────────────────────────
const app = express();
app.use(bodyParser.json());

// Health-check
app.get('/', (_, res) => res.send('OK — bot running'));

// Если потом положите «витрину» (vite build → dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'webapp', 'dist')));

// ────────────────────────────────────────────────────────────────────
// 2) Telegram-бот (без polling, без собственного порта!)
// ────────────────────────────────────────────────────────────────────
const bot = new TelegramBot(token);        // ←  убрали { webHook:{ port } }

// секретный путь для Webhook
const secretPath = `/bot${token}`;

// Маршрут, куда Telegram будет POST-ить обновления
app.post(secretPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

//  Настраиваем Webhook (делается при старте контейнера)
bot.setWebHook(`${baseURL}${secretPath}`);

// ────────────────────────────────────────────────────────────────────
// 3) Обработчики
// ────────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать! Напишите текст — я повторю.');
});

bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Вы написали: «${msg.text}»`);
  }
});

// ────────────────────────────────────────────────────────────────────
// 4) Запуск Express (единственный listen)
// ────────────────────────────────────────────────────────────────────
app.listen(port, () =>
  console.log(`✅  Express & Telegram Webhook listening on :${port}`),
);
