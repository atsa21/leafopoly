import { BoardSquare } from '../models';
import { EShopCategory } from '../enums';
import { SHOPS } from './shops';

const DEFS: Array<Partial<BoardSquare>> = [
  { kind: 'start' },
  { kind: 'shop', shop: EShopCategory.Furniture },
  { kind: 'coupon' },
  { kind: 'shop', shop: EShopCategory.Decor },
  { kind: 'leaf', delta: 5 },
  { kind: 'shop', shop: EShopCategory.Room },
  { kind: 'rest', category: 'rain' },
  { kind: 'shop', shop: EShopCategory.Pet },
  { kind: 'shop', shop: EShopCategory.Other },
  { kind: 'leaf', delta: -3 },
  { kind: 'shop', shop: EShopCategory.Furniture },
  { kind: 'luckyfind' },
  { kind: 'rest', category: 'lemonade' },
  { kind: 'shop', shop: EShopCategory.Decor },
  { kind: 'leaf', delta: 6 },
  { kind: 'shop', shop: EShopCategory.Room },
  { kind: 'coupon' },
  { kind: 'shop', shop: EShopCategory.Other },
  { kind: 'rest', category: 'rain' },
  { kind: 'shop', shop: EShopCategory.Furniture },
  { kind: 'leaf', delta: -4 },
  { kind: 'shop', shop: EShopCategory.Decor },
  { kind: 'coupon' },
  { kind: 'shop', shop: EShopCategory.Room },
];

function gridPos(i: number): { r: number; c: number } {
  if (i <= 6) return { r: 1, c: i + 1 };
  if (i <= 12) return { r: i - 5, c: 7 };
  if (i <= 18) return { r: 7, c: 19 - i };
  return { r: 25 - i, c: 1 };
}

export function buildBoard(passGoBonus: number): BoardSquare[] {
  return DEFS.map((d, i) => {
    const p = gridPos(i);
    const corner = i % 6 === 0;
    let label = '',
      sub = '',
      accent = '',
      icon = '',
      msg = d.msg ?? '';
    let category = d.category;

    switch (d.kind) {
      case 'start':
        label = 'START';
        sub = 'collect ' + passGoBonus;
        accent = '#5d7d39';
        icon = 'tree';
        break;
      case 'shop':
        const s = SHOPS[d.shop!];
        label = s.name;
        sub = 'tap to shop';
        accent = s.accent;
        icon = s.items[0].key;
        category = s.category;
        break;
      case 'coupon':
        label = 'COUPONS';
        sub = 'snip a deal';
        accent = '#caa42e';
        break;
      case 'leaf':
        const gain = (d.delta || 0) >= 0;
        category = gain ? 'positive' : 'negative';
        if (gain) {
          label = 'LEAF PILE';
          sub = '+' + d.delta + ' leaves';
          accent = '#5d7d39';
          icon = 'leaves';
          msg = 'found ' + d.delta + ' leaves on the path!';
        } else {
          label = 'OOPS';
          sub = d.delta + ' leaves';
          accent = '#9a4036';
          icon = 'gust';
          msg = 'a gust blew some leaves away (' + d.delta + ').';
        }
        break;
      case 'rest':
        if (d.category === 'lemonade') {
          label = 'LEMONADE';
          sub = 'sip & rest';
          accent = '#caa42e';
          icon = 'lemonade';
          msg = 'lemonade stand — a sweet little break.';
        } else {
          label = 'RAINY DAY';
          sub = 'stay cosy';
          accent = '#5b7287';
          icon = 'rain';
          msg = 'rainy day — cosy indoors for a moment.';
        }
        break;
      default:
        label = 'LUCKY FIND';
        sub = 'free for your room';
        accent = '#7a9a4e';
        icon = 'gift';
    }

    return { ...d, i, label, sub, accent, icon, msg, category, corner, gr: p.r, gc: p.c } as BoardSquare;
  });
}
