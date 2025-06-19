// index.js
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app   = express();
const port  = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;
const host  = process.env.SITE_URL;            // https://miniappcontest-anin.onrender.com

/* ---------- статическая витрина ---------- */
app.use("/shop", express.static(path.join(process.cwd(), "public")));

/* ---------- health-check ---------- */
app.get("/", (_r, res) => res.send("OK — bot & webhook running"));

/* ---------- запускаем HTTP-сервер ---------- */
const server = app.listen(port, () =>
  console.log(`✅ Express listening on :${port}`)
);

/* ---------- Telegram через Webhook ---------- */
const bot = new TelegramBot(token);
const webhookPath = `/bot${token}`;            // «секретный» URL
bot.setWebHook(`${host}${webhookPath}`);

app.post(webhookPath, express.json(), (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

/* ---------- обработчики ---------- */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать!", {
    reply_markup: {
      inline_keyboard: [[{
        text: "Открыть магазин",
        web_app: { url: `${host}/shop` }
      }]]
    }
  });
});

bot.on("message", (msg) => {
  if (!/\/start/.test(msg.text))
    bot.sendMessage(msg.chat.id, `Вы написали: ${msg.text}`);
});
