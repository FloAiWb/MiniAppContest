// index.js
require('dotenv').config();                 // если используете .env
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;      // PORT придёт из Render
const token = process.env.BOT_TOKEN;        // BOT_TOKEN вы задали в переменных окружения

// 1) Лаконичный HTTP-эндпоинт для проверки «живости» приложения
app.get('/', (_req, res) => res.send('OK'));

// 2) Запускаем сервер
app.listen(port, () => {
  console.log(`Express listening on port ${port}`);
});

// 3) Инициализируем Telegram-бота (long polling)
const bot = new TelegramBot(token, { polling: true });

// 4) Опишите здесь все ваши обработчики
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Вы написали: ${msg.text}`);
// ... ваш прежний код выше
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Открыть магазин', {
    reply_markup: {
      inline_keyboard: [[{
        text: 'Перейти в витрину 🛒',
        web_app: { url: process.env.WEBAPP_URL }   // добавим WEBAPP_URL в Render
      }]]
    }
  });
});
 необходимости — ещё вебхуки, команды и т.д.
