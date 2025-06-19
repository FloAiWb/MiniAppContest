import dotenv from 'dotenv';
dotenv.config();                       // подтягиваем .env
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app  = express();
const port = process.env.PORT || 3000;

const token        = process.env.BOT_TOKEN;
const host         = process.env.SITE_URL;     // https://….onrender.com
const webhookPath  = process.env.WEBHOOK_PATH; // /bot<token>
const webhookURL   = `${host}${webhookPath}`;  // полная ссылка

// 1) проверка «жив»
app.get('/', (_req, res) => res.send('OK — bot running'));

// 2) парсинг JSON-тел
app.use(express.json());

// 3) инициализация бота в режиме WEBHOOK
const bot = new TelegramBot(token, { webHook: { port } });

// 4) регистрируем маршрут у Express,
//    чтобы Telegram посылал апдейты сюда
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 5) ставим вебхук (один раз при старте)
(async () => {
  await bot.setWebHook(webhookURL);
  console.log(`✅ Webhook set: ${webhookURL}`);
})();

// 6) ваши handlers
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Добро пожаловать! Нажмите кнопку, чтобы открыть витрину.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть магазин 🛍', web_app: { url: `${host}/shop` } }]
        ]
      }
    }
  );
});

// 7) запуск Express
app.listen(port, () => console.log(`✅  Express listening on :${port}`));
