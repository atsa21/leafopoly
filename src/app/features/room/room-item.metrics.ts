import { ITEMS } from '@core/constants';

export const ROOM_H = 440;
export const UNIT = 50;

export function itemSize(key: string): number {
  switch (key) {
    case 'curtain':
    case 'lamp':
    case 'shelf':
      return Math.round(itemHeight(key) * (60 / 88));
    case 'window':
      return Math.round(itemHeight(key) * (30 / 44));
    case 'bed':
    case 'desk':
      return Math.round(itemHeight(key) * (88 / 60));
    case 'rug':
      return Math.round(UNIT * (ITEMS[key]?.size ?? 1) * 2);
    default:
      return Math.round(UNIT * (ITEMS[key]?.size ?? 1));
  }
}

export function itemHeight(key: string): number {
  switch (key) {
    case 'curtain':
      return Math.round(ROOM_H * 0.75);
    case 'lamp':
      return Math.round(UNIT * (ITEMS[key]?.size ?? 1));
    case 'shelf':
      return Math.round(ROOM_H * 0.7);
    case 'window':
      return Math.round(ROOM_H * 0.4);
    case 'bed':
    case 'desk':
      return Math.round(UNIT * (ITEMS[key]?.size ?? 1));
    case 'rug':
      return Math.round(itemSize(key) * (28 / 60));
    default:
      return itemSize(key);
  }
}
