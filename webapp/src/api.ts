export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export const products: Product[] = [
  { id: 1, title: 'Жетон 50×28 глянец (10 шт)', price: 380, image: 'https://placehold.co/200?text=Jeton+1' },
  { id: 2, title: 'Жетон 50×28 сатин (10 шт)', price: 380, image: 'https://placehold.co/200?text=Jeton+2' }
];
