require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const PORT  = process.env.PORT     || 10000;
const TOKEN = process.env.BOT_TOKEN;
const URL   = process.env.BASE_URL;            // Render URL

//--------------------------------------------------
//  Express
//--------------------------------------------------
const app = express();
app.use(bodyParser.json());

// статика мини-приложения
app.use('/shop', express.static('public'));

// тестовый энд-пойнт «оплата»
app.post('/api/order', (req, res) => {
  console.log('[ORDER]', req.body);
  res.sendStatus(200);
});

//--------------------------------------------------
//  Telegram Bot (webhook)
//--------------------------------------------------
const bot = new TelegramBot(TOKEN, { polling: false });
bot.setWebHook(`${URL}/bot${TOKEN}`);

// маршрутизируем входящие апдейты
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start ➜ кнопка «Открыть магазин»
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, 'Добро пожаловать!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть магазин 🛍️', web_app: { url: `${URL}/shop` } }]
      ]
    }
  });
});

// данные из mini-app (JSON-строка)
bot.on('web_app_data', ctx => {
  bot.sendMessage(
    ctx.chat.id,
    `📦 Ваш заказ:\n${ctx.web_app_data.data}`
  );
});

//--------------------------------------------------
app.listen(PORT, () => console.log('✅  Express & Webhook on :' + PORT));
