import { EShopCategory } from '../enums';
import { SHOPS } from './shops';

/** Maps every item key to the shop category it belongs to. */
export const ITEM_CATEGORY: Record<string, EShopCategory> = Object.fromEntries(
  Object.values(SHOPS).flatMap((s) => s.items.map((it) => [it.key, s.category])),
);

export const CATEGORY_GOAL = 3;

export const CATEGORY_LABELS: { key: EShopCategory; label: string }[] = [
  { key: EShopCategory.Comfort, label: 'Comfort' },
  { key: EShopCategory.Study, label: 'Study' },
  { key: EShopCategory.Plants, label: 'Plants' },
  { key: EShopCategory.Odds, label: 'Odds & Art' },
  { key: EShopCategory.Room, label: 'Room' },
  { key: EShopCategory.Pet, label: 'Pets' },
  { key: EShopCategory.Bits, label: 'Bits & Bobs' },
];
