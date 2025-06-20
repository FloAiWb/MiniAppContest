// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();  // развернуть

let cart = [];

// Загрузка товаров
async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const container = document.getElementById('products');
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div><strong>${p.name}</strong></div>
      <div>Артикул: ${p.article}</div>
      <div>Размер: ${p.size}</div>
      <button>В корзину</button>
    `;
    const btn = card.querySelector('button');
    btn.onclick = () => {
      cart.push(p);
      document.getElementById('checkout').disabled = false;
    };
    container.append(card);
  });
}

// Оформление
document.getElementById('checkout').onclick = () => {
  // отправляем данные боту
  tg.sendData(JSON.stringify(cart));
};

loadProducts();
