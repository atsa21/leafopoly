import { ItemDef } from '../models';
import { SHOPS } from './shops';

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  Object.values(SHOPS).flatMap((s) => s.items.map((it) => [it.key, it])),
);
