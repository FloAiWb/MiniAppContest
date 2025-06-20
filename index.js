// index.js
//--------------------------------------------------
//  Инициализация
//--------------------------------------------------
require("dotenv").config();        // .env (BOT_TOKEN, DATABASE_URL, …)

const express      = require("express");
const bodyParser   = require("body-parser");
const TelegramBot  = require("node-telegram-bot-api");

// роут с товарами (./src/routes/products.js) — см. ниже
const productsRouter = require("./src/routes/products");

// порт / URL, которые задаёт Render
const PORT = process.env.PORT      || 10000;
const URL  = process.env.BASE_URL;             // https://<service>.onrender.com
const TOKEN = process.env.BOT_TOKEN;

//--------------------------------------------------
//  Express-приложение
//--------------------------------------------------
const app = express();
app.use(bodyParser.json());

// статические файлы мини-магазина
app.use("/shop", express.static("public"));

/* ------------  API  ------------ */

// JSON-эндпойнт «товары»
app.use("/api/products", productsRouter);

// тестовый эндпойнт «создание заказа» (можете переименовать)
app.post("/api/order", (req, res) => {
  console.log("[ORDER]", req.body);
  res.sendStatus(200);
});

// «живой» пинг для Render / UptimeRobot
app.get("/", (_req, res) => res.send("OK"));

//--------------------------------------------------
//  Telegram Bot  (webhook)
//--------------------------------------------------
const bot = new TelegramBot(TOKEN, { polling: false });
bot.setWebHook(`${URL}/bot${TOKEN}`);

// приём апдейтов от Telegram
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start  → кнопка «Открыть магазин»
bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать!", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть магазин 🛍️",
            web_app: { url: `${URL}/shop` }
          }
        ]
      ]
    }
  });
});

// данные, пришедшие из Web-App (`window.Telegram.WebApp.sendData`)
bot.on("web_app_data", ctx => {
  bot.sendMessage(ctx.chat.id, `📦 Ваш заказ:\n${ctx.web_app_data.data}`);
});

//--------------------------------------------------
//  Старт сервера
//--------------------------------------------------
app.listen(PORT, () =>
  console.log(`✅  Express & Webhook listening on :${PORT}`)
);
