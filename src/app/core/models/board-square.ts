import { SquareKind } from './square-kind';
import { EShopCategory } from '../enums';
import { LeafCategory } from './leaf-category';
import { RestCategory } from './rest-category';

export interface BoardSquare {
  i: number;
  kind: SquareKind;
  shop?: EShopCategory;
  category?: EShopCategory | LeafCategory | RestCategory;
  icon?: string;
  img?: string;
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
