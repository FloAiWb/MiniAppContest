// index.js  (CommonJS → оставить как есть)
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const PORT  = process.env.PORT || 10000;
const TOKEN = process.env.BOT_TOKEN;
const URL   = process.env.BASE_URL;           // https://miniappcontest-anin.onrender.com

const app = express();
app.use(bodyParser.json());

// ===== статические файлы storefront
app.use('/shop', express.static('public'));

// ===== API из витрины (push заказа)
app.post('/api/order',(req,res)=>{
  console.log('[order]',req.body);
  res.sendStatus(200);
});

// ===== Telegram bot
const bot   = new TelegramBot(TOKEN, {polling:false});
bot.setWebHook(`${URL}/bot${TOKEN}`);

app.post(`/bot${TOKEN}`, (req,res)=>{
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start — шлём кнопку с ссылкой на витрину
bot.onText(/\/start/,msg=>{
  bot.sendMessage(msg.chat.id,'Добро пожаловать!',{
    reply_markup:{
      inline_keyboard:[
        [{text:'Открыть магазин 🛍️', web_app:{url:`${URL}/shop`}}]
      ]
    }
  });
});

// ловим sendData из витрины
bot.on('web_app_data',ctx=>{
  bot.sendMessage(ctx.chat.id,`📦 Ваш заказ:\n${ctx.web_app_data.data}`);
});

app.listen(PORT,()=>console.log('✅  Express & Webhook on :'+PORT));
