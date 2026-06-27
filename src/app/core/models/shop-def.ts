import { EShopCategory } from '../enums';
import { ItemDef } from './item-def';

export interface ShopDef {
  name: string;
  accent: string;
  category: EShopCategory;
  items: ItemDef[];
}
