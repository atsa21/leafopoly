import { SquareKind } from './square-kind';
import { ShopCategory } from './shop-category';
import { LeafCategory } from './leaf-category';
import { RestCategory } from './rest-category';

export interface BoardSquare {
  i: number;
  kind: SquareKind;
  shop?: string;
  category?: ShopCategory | LeafCategory | RestCategory;
  icon?: string;
  delta?: number;
  skip?: boolean;
  msg?: string;
  label: string;
  sub: string;
  accent: string;
  corner: boolean;
  gr: number;
  gc: number;
}
