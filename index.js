// index.js  (ES-module)
import dotenv      from 'dotenv';
import express     from 'express';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const PORT  = process.env.PORT || 10000;
const URL   = process.env.PUBLIC_URL;   // https://miniappcontest-anin.onrender.com

const app = express();
app.use(express.json());                // Telegram шлёт JSON

// —––– 1. Создаём бота БЕЗ polling
const bot = new TelegramBot(TOKEN);

// —––– 2. Регистрируем Webhook у Telegram
await bot.setWebHook(`${URL}/bot${TOKEN}`);

// —––– 3. Express-роут, куда Telegram будет POST’ить обновления
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);          // передаём обнову библиотеке
  res.sendStatus(200);
});

// —––– 4. Любые хендлеры
bot.on('message', (msg) => {
  bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});

app.get('/', (_req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`✅  Express & Webhook on :${PORT}`));
