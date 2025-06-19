// index.js
import express      from 'express';
import path         from 'path';
import { fileURLToPath } from 'url';
import TelegramBot  from 'node-telegram-bot-api';

const TOKEN = process.env.BOT_TOKEN;
const PORT  = process.env.PORT || 3000;

const bot  = new TelegramBot(TOKEN, { polling: false });
const app  = express();

//--- service utils ---
app.use(express.json());

// health-check
app.get('/', (_, res) => res.send('OK'));

// статика «витрины»
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/shop', express.static(path.join(__dirname, 'public')));

// веб-хук
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// команды бота
bot.onText(/\/start/, msg => {
  const url = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/shop`;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть магазин 🛍️', web_app: { url } }]
      ]
    }
  };

  bot.sendMessage(msg.chat.id, 'Добро пожаловать! Нажмите кнопку, чтобы открыть витрину.', opts);
});

app.listen(PORT, () =>
  console.log(`✅  Express & Webhook on :${PORT}`)
);
