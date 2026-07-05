import { Part } from './part';
import { BED } from './bed';
import { TABLE } from './table';
import { CHAIR } from './chair';
import { CAT } from './cat';
import { DOG } from './dog';
import { FISH } from './fish';
import { SOFA } from './sofa';
import { LAMP } from './lamp';
import { PLANT } from './plant';
import { RUG } from './rug';
import { COFFEE } from './coffee';
import { BONE } from './bone';
import { BOOKS } from './books';
import { CAT_TOY } from './cat-toy';
import { GUITAR } from './guitar';
import { BOTTLE_OF_JUICE } from './bottle-of-juice';
import { POSTER } from './poster';
import { WINDOW } from './window';
import { TABLE_CLOCK } from './table-clock';
import { CURTAIN } from './curtain';
import { NIGHTSTAND } from './nightstand';
import { FERN_IN_POT } from './fern-in-pot';
import { PET_BED } from './pet-bed';
import { EMPTY_SHELF } from './empty-shelf';
import { DESK } from './desk';
import { CACTUS } from './cactus';
import { BOOKSHELF } from './bookshelf';
import { MUG } from './mug';
import { JUICE } from './juice';
import { BANANA_PLANT } from './banana-plant';
import { HANGING_PLANT } from './hanging-plant';
import { MIRROR } from './mirror';
import { BRUSH_JAR } from './brush-jar';
import { WALL_LAMP } from './wall-lamp';
import { BLINDS } from './blinds';

/** All cozy 3D model part-lists, keyed by model name. */
export const MODELS_DATA: Record<string, Part[]> = {
  bed: BED,
  table: TABLE,
  chair: CHAIR,
  cat: CAT,
  dog: DOG,
  fish: FISH,
  sofa: SOFA,
  lamp: LAMP,
  plant: PLANT,
  rug: RUG,
  coffee: COFFEE,
  bone: BONE,
  books: BOOKS,
  'cat toy': CAT_TOY,
  guitar: GUITAR,
  'bottle of juice': BOTTLE_OF_JUICE,
  poster: POSTER,
  window: WINDOW,
  'table clock': TABLE_CLOCK,
  curtain: CURTAIN,
  nightstand: NIGHTSTAND,
  'fern in pot': FERN_IN_POT,
  'pet bed': PET_BED,
  'empty shelf': EMPTY_SHELF,
  desk: DESK,
  cactus: CACTUS,
  bookshelf: BOOKSHELF,
  mug: MUG,
  juice: JUICE,
  'banana plant': BANANA_PLANT,
  'hanging plant': HANGING_PLANT,
  mirror: MIRROR,
  'brush jar': BRUSH_JAR,
  'wall lamp': WALL_LAMP,
  blinds: BLINDS,
};
