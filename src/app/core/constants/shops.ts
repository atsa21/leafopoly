import { ShopDef } from '../models';
import { EShopCategory } from '../enums';

export const SHOPS: Record<EShopCategory, ShopDef> = {
  [EShopCategory.Comfort]: {
    name: 'Comfort Barn',
    accent: '#7a6a2e',
    category: EShopCategory.Comfort,
    items: [
      { key: 'sofa', name: 'Comfy Sofa', tag: 'lounge about', price: 22 },
      { key: 'chair', name: 'Wooden Chair', tag: 'take a seat', price: 10 },
      { key: 'bed', name: 'Cosy Bed', tag: 'comfy nap', price: 20 },
      { key: 'rug', name: 'Woven Rug', tag: 'soft underfoot', price: 12 },
    ],
  },
  [EShopCategory.Study]: {
    name: 'Study Barn',
    accent: '#8a6a3e',
    category: EShopCategory.Study,
    items: [
      { key: 'desk', name: 'Study Desk', tag: 'get to work', price: 15 },
      { key: 'nightstand', name: 'Nightstand', tag: 'sturdy oak', price: 11 },
      { key: 'bookshelf', name: 'Book Shelf', tag: 'holds 30', price: 14 },
      { key: 'lamp', name: 'Reading Lamp', tag: 'warm glow', price: 9 },
    ],
  },
  [EShopCategory.Plants]: {
    name: 'Greenhouse',
    accent: '#5d7d39',
    category: EShopCategory.Plants,
    items: [
      { key: 'cactus', name: 'Lil Cactus', tag: 'no fuss', price: 5 },
      { key: 'plant', name: 'Window Plant', tag: 'blooms weekly', price: 7 },
      { key: 'fern', name: 'Leafy Fern', tag: 'easy keeper', price: 6 },
      { key: 'banana_plant', name: 'Banana Plant', tag: 'tall & leafy', price: 8 },
      { key: 'hanging_plant', name: 'Hanging Plant', tag: 'trails down', price: 7 },
    ],
  },
  [EShopCategory.Odds]: {
    name: 'Odds & Art',
    accent: '#6a4a7a',
    category: EShopCategory.Odds,
    items: [
      { key: 'poster', name: 'Art Poster', tag: 'framed', price: 5 },
      { key: 'guitar', name: 'Guitar', tag: 'strum along', price: 8 },
      { key: 'mirror', name: 'Wall Mirror', tag: 'reflects light', price: 9 },
      { key: 'brush_jar', name: 'Brush Jar', tag: 'arty clutter', price: 6 },
    ],
  },
  [EShopCategory.Room]: {
    name: 'Room Fittings',
    accent: '#36617e',
    category: EShopCategory.Room,
    items: [
      { key: 'window', name: 'Bay Window', tag: 'lets light in', price: 16 },
      { key: 'curtain', name: 'Linen Curtains', tag: 'soft drape', price: 9 },
      { key: 'wall_lamp', name: 'Wall Lamp', tag: 'soft sconce', price: 10 },
      { key: 'blinds', name: 'Roller Blinds', tag: 'shade it', price: 8 },
      { key: 'wall_shelf', name: 'Wall Shelf', tag: 'holds items', price: 8 },
    ],
  },
  [EShopCategory.Pet]: {
    name: 'Pet Planet',
    accent: '#a5683b',
    category: EShopCategory.Pet,
    items: [
      { key: 'cat', name: 'Tabby Kitten', tag: 'purrs free', price: 15 },
      { key: 'dog', name: 'Spotty Pup', tag: 'good boy', price: 18 },
      { key: 'fish', name: 'Goldfish', tag: 'blub blub', price: 6 },
      { key: 'pet_bed', name: 'Pet Bed', tag: 'snug naps', price: 12 },
      { key: 'bone', name: 'Chew Bone', tag: 'gnaw gnaw', price: 4 },
      { key: 'cat_toy', name: 'Cat Toy', tag: 'pounce ready', price: 5 },
    ],
  },
  [EShopCategory.Bits]: {
    name: 'Bits & Bobs',
    accent: '#5d7d39',
    category: EShopCategory.Bits,
    items: [
      { key: 'juice', name: 'Apple Juice', tag: 'cold, 1 bottle', price: 5 },
      { key: 'clock', name: 'Table Clock', tag: 'tick tock', price: 4 },
      { key: 'books', name: 'Books', tag: 'a good read', price: 3 },
      { key: 'mug', name: 'Cocoa Mug', tag: 'no chips!', price: 3 },
    ],
  },
};
