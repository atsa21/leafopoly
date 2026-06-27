import { ShopCategory } from './shop-category';
import { ItemDef } from './item-def';

export interface ShopDef {
  name: string;
  accent: string;
  category: ShopCategory;
  items: ItemDef[];
}
