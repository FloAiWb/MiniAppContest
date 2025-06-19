// ───────────────────────────────────────────────
// index.js — полноценный вариант “как есть”
// ───────────────────────────────────────────────

// ⬇️ 1. Загружаем переменные из .env (если файл есть локально)
import dotenv from 'dotenv';
dotenv.config();

// ⬇️ 2. Подключаем зависимости
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

// ⬇️ 3. Базовые переменные окружения
const port  = process.env.PORT || 3000;          // Render передаёт свой PORT
const token = process.env.BOT_TOKEN;             // Вы задали в Environment
const host  = process.env.SITE_URL               // https://miniappcontest-anin.onrender.com
             || `https://miniappcontest-anin.onrender.com`;

// Путь и URL вебхука формируем гарантированно правильно
const webhookPath = `/bot${token}`;              // начинаем со “/”
const webhookURL  = `${host}${webhookPath}`;     // полный публичный URL

// ⬇️ 4. Express-приложение
const app = express();
app.use(express.json());

// Маршрут-приёмник Telegram-вебхука
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);   // передаём апдейт боту
  res.sendStatus(200);
});

// Проверочный эндпоинт “жив/не жив”
app.get('/', (_req, res) => res.send('OK — bot running'));

// ⬇️ 5. Запускаем HTTP-сервер
app.listen(port, () => console.log(`✅ Express listening on :${port}`));

// ⬇️ 6. Telegram-бот (режим вебхука)
const bot = new TelegramBot(token, { webHook: { port } });

// Регистрируем вебхук у Telegram
(async () => {
  await bot.setWebHook(webhookURL);
  console.log(`✅ Webhook set: ${webhookURL}`);
})();

// ⬇️ 7. Обработчики бота
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Добро пожаловать! Нажмите кнопку, чтобы открыть витрину.',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: 'Открыть магазин 🛍', web_app: { url: `${host}/shop` } }
        ]]
      }
    }
  );
});

// пример “эхо”-обработчика (можно удалить)
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Вы написали: «${msg.text}»`);
  }
});
