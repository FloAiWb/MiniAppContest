// index.js  — полный файл
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app   = express();
const port  = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;

// 1. «живой» энд-пойнт
app.get('/', (_req, res) => res.send('OK — bot running'));

// 2. статическая витрина
const publicDir = path.join(process.cwd(), 'public');
app.use('/shop', express.static(publicDir));

// 3. стартуем веб-сервер
app.listen(port, () => {
  console.log(`✅  Express & Telegram Webhook listening on :${port}`);
});

// 4. Telegram-бот (polling)
const bot = new TelegramBot(token, { polling: true });

// 5. /start ➜ кнопка «Открыть магазин»
bot.onText(/\/start/, (msg) => {
  const opts = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Открыть магазин',
          web_app: { url: `${process.env.SITE_URL}` }
        }
      ]]
    }
  };
  bot.sendMessage(msg.chat.id,
    'Добро пожаловать! Нажмите кнопку, чтобы открыть витрину.',
    opts
  );
});

// эхо-ответ на любое сообщение
bot.on('message', (msg) => {
  if (/\/start/.test(msg.text)) return;  // уже обработали выше
  bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});
