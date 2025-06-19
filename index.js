// index.js ─ полный
import dotenv      from 'dotenv';
import express     from 'express';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();                     // BOT_TOKEN и PUBLIC_URL берём из .env/Render

const TOKEN = process.env.BOT_TOKEN;
const PORT  = process.env.PORT || 10000;
const URL   = process.env.PUBLIC_URL;            // ➜ https://<ваш-сабдомен>.onrender.com

if (!TOKEN || !URL) {
  console.error('⛔  BOT_TOKEN или PUBLIC_URL не заданы в переменных окружения');
  process.exit(1);
}

const app = express();
app.use(express.json());             // Telegram шлёт JSON

/* 1. создаём бота без polling */
const bot = new TelegramBot(TOKEN);

/* 2. говорим Telegram, куда слать обновления */
await bot.setWebHook(`${URL}/bot${TOKEN}`);

/* 3. Express-роут, принимающий Webhook */
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);       // прокидываем обнову в библиотеку
  res.sendStatus(200);
});

/* 4. хендлеры */
bot.on('message', (msg) => {
  bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});

/* 5. health-check Render’а */
app.get('/', (_req, res) => res.send('OK'));

/* 6. старт сервера */
app.listen(PORT, () => console.log(`✅  Express & Webhook on :${PORT}`));
