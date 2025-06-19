import React, { useState } from 'react';
import { products, Product } from './api';

const tg = window?.Telegram?.WebApp;

export default function App() {
  const [cart, setCart] = useState<Product[]>([]);

  // ——— добавить / убрать товар ———
  const toggle = (p: Product) =>
    setCart((c) =>
      c.find((i) => i.id === p.id) ? c.filter((i) => i.id !== p.id) : [...c, p]
    );

  // ——— сумма ———
  const total = cart.reduce((s, p) => s + p.price, 0);

  // ——— оформить заказ ———
  const checkout = () => {
    tg?.showAlert(`Заказ на ${total} ₽ оформлен!`);
    setCart([]);
  };

  React.useEffect(() => {
    tg?.ready();
    tg?.MainButton.setText(`Оплатить ${total} ₽`);
    cart.length ? tg?.MainButton.show() : tg?.MainButton.hide();
    tg?.MainButton.onClick(checkout);
    return () => tg?.MainButton.offClick(checkout);
  }, [cart, total]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Жетоны</h1>

      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-xl bg-[#232323] overflow-hidden cursor-pointer"
            onClick={() => toggle(p)}
          >
            <img src={p.image} className="w-full aspect-square object-cover" />
            <div className="p-3 space-y-1">
              <div className="text-sm leading-snug">{p.title}</div>
              <div className="font-semibold">{p.price} ₽</div>
              <button
                className={`w-full rounded-md py-1.5 text-sm ${
                  cart.find((i) => i.id === p.id)
                    ? 'bg-red-600'
                    : 'bg-emerald-600'
                }`}
              >
                {cart.find((i) => i.id === p.id)
                  ? 'Убрать из корзины'
                  : 'Добавить в корзину'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg">Корзина</h2>
          {cart.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.title}</span>
              <span>{p.price} ₽</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold">
            <span>Итого</span>
            <span>{total} ₽</span>
          </div>
        </div>
      )}
    </div>
  );
}
