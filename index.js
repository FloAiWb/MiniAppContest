/* index.js — CommonJS  */
require("dotenv").config();         // .env (BOT_TOKEN, DATABASE_URL, BASE_URL …)

const path         = require("path");
const express      = require("express");
const bodyParser   = require("body-parser");
const TelegramBot  = require("node-telegram-bot-api");
const productRoute = require("./routes/products");   // ← наш API-роутер

const PORT  = process.env.PORT       || 10000;
const TOKEN = process.env.BOT_TOKEN;                 // задаётся в Render → Environment
const URL   = process.env.BASE_URL;                  // https://xxxx.onrender.com

//--------------------------------------------------
//  Express
//--------------------------------------------------
const app = express();
app.use(bodyParser.json());

// статика мини-приложения (React/Vite билд лежит в public/)
app.use("/shop", express.static(path.join(__dirname, "public")));

// JSON-API для мини-приложения
app.use("/api", productRoute);      // ← теперь действительно Router, а не «Module»

// тестовый энд-поинт «оплата» (можно убрать)
app.post("/api/order", (req, res) => {
  console.log("[ORDER]", req.body);
  res.sendStatus(200);
});

//--------------------------------------------------
//  Telegram Bot — webhook
//--------------------------------------------------
const bot = new TelegramBot(TOKEN, { polling: false });
bot.setWebHook(`${URL}/bot${TOKEN}`);

// входящие апдейты от Telegram
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start ➜ кнопка «Открыть магазин»
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать!", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Открыть магазин 🛍️", web_app: { url: `${URL}/shop` } }],
      ],
    },
  });
});

// данные, присланные из mini-app
bot.on("web_app_data", (ctx) => {
  bot.sendMessage(ctx.chat.id, `📦 Ваш заказ:\n${ctx.web_app_data.data}`);
});

//--------------------------------------------------
app.listen(PORT, () =>
  console.log(`✅  Express & Webhook listening on :${PORT}`)
);
