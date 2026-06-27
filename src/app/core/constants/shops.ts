import { ShopDef } from '../models';

export const SHOPS: Record<string, ShopDef> = {
  furniture: {
    name: 'Furniture Barn',
    accent: '#7a6a2e',
    category: 'furniture',
    items: [
      { key: 'lamp', name: 'Reading Lamp', tag: 'warm glow', price: 9, size: 1.05 },
      { key: 'shelf', name: 'Book Nook', tag: 'holds 30', price: 14, size: 1.3 },
      { key: 'rug', name: 'Woven Rug', tag: 'soft underfoot', price: 12, size: 1.4 },
    ],
  },
  decor: {
    name: 'Decor & More',
    accent: '#6a4a7a',
    category: 'decor',
    items: [
      { key: 'poster', name: 'Art Poster', tag: 'framed', price: 5, size: 1.1 },
      { key: 'paints', name: 'Paint Set', tag: '12 colours', price: 8, size: 0.9 },
      { key: 'teddy', name: 'Teddy Bear', tag: 'well hugged', price: 10, size: 1 },
      { key: 'cactus', name: 'Lil Cactus', tag: 'no fuss', price: 5, size: 0.85 },
    ],
  },
  room: {
    name: 'Room Fittings',
    accent: '#36617e',
    category: 'room',
    items: [
      { key: 'window', name: 'Bay Window', tag: 'lets light in', price: 16, size: 1.35 },
      { key: 'curtain', name: 'Linen Curtains', tag: 'soft drape', price: 9, size: 1.3 },
      { key: 'plant', name: 'Window Plant', tag: 'blooms weekly', price: 7, size: 1 },
      { key: 'fern', name: 'Leafy Fern', tag: 'easy keeper', price: 6, size: 1 },
    ],
  },
  other: {
    name: 'Sundries',
    accent: '#5d7d39',
    category: 'other',
    items: [
      { key: 'juice', name: 'Apple Juice', tag: 'cold, 1 bottle', price: 5, size: 0.8 },
      { key: 'bread', name: 'Fresh Bread', tag: 'baked today', price: 4, size: 0.85 },
      { key: 'cookies', name: 'Cookie Tin', tag: 'a soft dozen', price: 3, size: 0.8 },
      { key: 'mug', name: 'Cocoa Mug', tag: 'no chips!', price: 3, size: 0.75 },
      { key: 'cat', name: 'Tabby Kitten', tag: 'purrs free', price: 15, size: 1.05 },
      { key: 'dog', name: 'Spotty Pup', tag: 'good boy', price: 18, size: 1.2 },
      { key: 'fish', name: 'Goldfish', tag: 'blub blub', price: 6, size: 0.85 },
    ],
  },
};
