// index.js
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app   = express();
const port  = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;
const host  = process.env.SITE_URL;              // https://miniappcontest-anin.onrender.com

/* 1. отдаём статические файлы витрины */
app.use("/shop", express.static(path.join(process.cwd(), "public")));

/* 2. health-check */
app.get("/", (_req, res) => res.send("OK — bot & shop running"));

/* 3. стартуем сервер */
app.listen(port, () => console.log(`✅ Express listening on :${port}`));

/* 4. Telegram через long-polling (оставим как есть, работает) */
const bot = new TelegramBot(token, { polling: true });

/* 5. обработчики */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать!", {
    reply_markup: {
      inline_keyboard: [[{
        text: "Открыть магазин 🛍️",
        web_app: { url: `${host}/shop` }        // ← открываем нашу витрину
      }]]
    }
  });
});

bot.on("message", (msg) => {
  if (!/\/start/.test(msg.text))
    bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});
