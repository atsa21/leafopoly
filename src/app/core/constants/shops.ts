import { ShopDef } from '../models';
import { EShopCategory } from '../enums';

export const SHOPS: Record<EShopCategory, ShopDef> = {
  [EShopCategory.Furniture]: {
    name: 'Furniture Barn',
    accent: '#7a6a2e',
    category: EShopCategory.Furniture,
    items: [
      { key: 'lamp', name: 'Reading Lamp', tag: 'warm glow', price: 9, size: 3 },
      { key: 'shelf', name: 'Book Nook', tag: 'holds 30', price: 14, size: 3 },
      { key: 'rug', name: 'Woven Rug', tag: 'soft underfoot', price: 12, size: 1.4 },
      { key: 'table', name: 'Side Table', tag: 'sturdy oak', price: 11, size: 1.2 },
      { key: 'bed', name: 'Cosy Bed', tag: 'comfy nap', price: 20, size: 3 },
      { key: 'desk', name: 'Study Desk', tag: 'get to work', price: 15, size: 3 },
      { key: 'chair', name: 'Wooden Chair', tag: 'take a seat', price: 10, size: 1.6 },
    ],
  },
  [EShopCategory.Decor]: {
    name: 'Decor & More',
    accent: '#6a4a7a',
    category: EShopCategory.Decor,
    items: [
      { key: 'poster', name: 'Art Poster', tag: 'framed', price: 5, size: 3 },
      { key: 'guitar', name: 'Guitar', tag: 'strum along', price: 8, size: 3 },
      { key: 'teddy', name: 'Teddy Bear', tag: 'well hugged', price: 10, size: 1 },
      { key: 'cactus', name: 'Lil Cactus', tag: 'no fuss', price: 5, size: 1.1 },
    ],
  },
  [EShopCategory.Room]: {
    name: 'Room Fittings',
    accent: '#36617e',
    category: EShopCategory.Room,
    items: [
      { key: 'window', name: 'Bay Window', tag: 'lets light in', price: 16, size: 2 },
      { key: 'curtain', name: 'Linen Curtains', tag: 'soft drape', price: 9, size: 1.3 },
      { key: 'plant', name: 'Window Plant', tag: 'blooms weekly', price: 7, size: 1 },
      { key: 'fern', name: 'Leafy Fern', tag: 'easy keeper', price: 6, size: 1 },
      { key: 'ceiling_lamp', name: 'Ceiling Lamp', tag: 'warm glow', price: 13, size: 1.4 },
    ],
  },
  [EShopCategory.Pet]: {
    name: 'Pet Planet',
    accent: '#a5683b',
    category: EShopCategory.Pet,
    items: [
      { key: 'cat', name: 'Tabby Kitten', tag: 'purrs free', price: 15, size: 1.05 },
      { key: 'dog', name: 'Spotty Pup', tag: 'good boy', price: 18, size: 1.2 },
      { key: 'fish', name: 'Goldfish', tag: 'blub blub', price: 6, size: 0.85 },
      { key: 'pet_bed', name: 'Pet Bed', tag: 'snug naps', price: 12, size: 1.5 },
      { key: 'bone', name: 'Chew Bone', tag: 'gnaw gnaw', price: 4, size: 0.9 },
      { key: 'cat_toy', name: 'Cat Toy', tag: 'pounce ready', price: 5, size: 1 },
    ],
  },
  [EShopCategory.Other]: {
    name: 'Sundries',
    accent: '#5d7d39',
    category: EShopCategory.Other,
    items: [
      { key: 'juice', name: 'Apple Juice', tag: 'cold, 1 bottle', price: 5, size: 0.8 },
      { key: 'clock', name: 'Table Clock', tag: 'tick tock', price: 4, size: 0.85 },
      { key: 'books', name: 'Books', tag: 'a good read', price: 3, size: 0.8 },
      { key: 'mug', name: 'Cocoa Mug', tag: 'no chips!', price: 3, size: 0.75 },
    ],
  },
};
