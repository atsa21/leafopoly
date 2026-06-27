import { SquareKind } from './square-kind';
import { ShopCategory } from './shop-category';
import { LeafCategory } from './leaf-category';
import { RestCategory } from './rest-category';

export interface BoardSquare {
  i: number;
  kind: SquareKind;
  shop?: string;
  category?: ShopCategory | LeafCategory | RestCategory;
  icon?: string; // item-icon key shown on the square
  delta?: number;
  skip?: boolean;
  msg?: string;
  label: string;
  sub: string;
  accent: string;
  corner: boolean;
  gr: number; // grid row (1..7)
  gc: number; // grid column (1..7)
}
