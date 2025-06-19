<!-- public/shop.html -->
<!doctype html><html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>💎 Тестовая витрина</title>
  <style>
    body{margin:0;padding:0;background:#111;color:#fff;font:16px/1.4 system-ui}
    .wrap{max-width:900px;margin:0 auto;padding:18px}
    .card{border:1px solid #444;margin:12px 0;padding:12px}
    .title{font-weight:700;margin-bottom:4px}
    button{cursor:pointer;width:100%;padding:12px;background:#31b84a;border:0;color:#fff;font-size:15px}
    .cart{position:fixed;right:12px;bottom:12px;background:#222;padding:14px 20px;border:1px solid #444}
    .cart h4{margin:0 0 8px;font-size:15px}
    .cart ul{margin:0;padding:0;list-style:none}
    .cart li{display:flex;justify-content:space-between}
    .cart-total{margin-top:8px;font-weight:700}
    .checkout{margin-top:12px;width:100%}
  </style>
</head>
<body>
<div class="wrap" id="app"></div>

<script type="module">
const tg = window.Telegram?.WebApp;           // если открыли из Telegram
if (tg) tg.ready();

const goods = [
  { id:"steel-token",  title:"Купон стальной", price:380 },
  { id:"leather-brace",title:"Браслет кожаный", price:550 }
];

let cart = [];

function render(){
  const app = document.getElementById('app');
  app.innerHTML = '';

  goods.forEach(g=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="title">${g.title}</div>
      <div>Цена: ${g.price} ₽</div>
      <button data-id="${g.id}">Купить</button>
    `;
    app.appendChild(el);
  });

  // cart widget
  const c = document.createElement('div');
  c.className = 'cart';
  const sum = cart.reduce((s,i)=>s+i.price,0);
  c.innerHTML = `
    <h4>Корзина (${cart.length})</h4>
    <ul>${cart.map(i=>`<li>${i.title}<span>${i.price}₽</span></li>`).join('')}</ul>
    <div class="cart-total">Итого: ${sum} ₽</div>
    <button class="checkout" ${cart.length? '':'disabled'}>Оформить</button>
  `;
  app.appendChild(c);
}

// click listeners
document.body.addEventListener('click',e=>{
  if(e.target.tagName==='BUTTON' && e.target.dataset.id){
    const g = goods.find(x=>x.id===e.target.dataset.id);
    cart.push(g); render();
  }
  if(e.target.classList.contains('checkout') && cart.length){
    checkout();
  }
});

function checkout(){
  const text = cart.map(i=>`• ${i.title} — ${i.price}₽`).join('\n')+
               `\n───\nИтого: ${cart.reduce((s,i)=>s+i.price,0)}₽`;
  fetch('/api/order',{           // frontend → backend
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({cart})
  }).catch(console.error);

  if (tg){
    tg.sendData(text);           // сообщение в бот (callbackQuery.data)
    tg.close();
  }else{
    alert('Заказ отправлен!\n\n'+text);
  }
  cart=[]; render();
}

render();
</script>
</body></html>
