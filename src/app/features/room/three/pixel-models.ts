import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
} from 'three';
import { createCozyModel } from './cozy-models';
import { buildWindowModel } from './window-model';

/**
 * Builds chunky, voxel/pixel-style 3D representations of shop items.
 *
 * Every model is a {@link Group} of axis-aligned boxes so the whole room reads
 * as a low-poly "pixel" diorama. Item keys with a dedicated builder get a
 * hand-shaped model; everything else falls back to a colored crate so no item
 * is ever missing from the room.
 *
 * Coordinate convention for a model: it sits on the floor plane (y = 0) and is
 * roughly centered on the origin in X/Z. The caller positions/rotates the whole
 * group. One "unit" is one floor tile.
 */

/** Small cache so repeated colors share a material (cheaper, fewer GC churn). */
const materials = new Map<number, MeshLambertMaterial>();

function mat(color: number): MeshLambertMaterial {
  let m = materials.get(color);
  if (!m) {
    m = new MeshLambertMaterial({ color });
    materials.set(color, m);
  }
  return m;
}

/** A single voxel box. Position is the box center, in tile units. */
function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(w, h, d), mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function group(...parts: Object3D[]): Group {
  const g = new Group();
  for (const p of parts) g.add(p);
  return g;
}

// ---- Palette -------------------------------------------------------------
const OAK = 0x9c6b3f;
const OAK_DARK = 0x7a4f2c;
const LEAF = 0x5a9c46;
const LEAF_DARK = 0x3f7a30;
const TERRACOTTA = 0xb56a43;

// ---- Per-item builders ---------------------------------------------------
// Each returns a Group centered on the origin, standing on the floor.

// Only keys that are neither intercepted by a dedicated builder (lamp, window,
// wall_lamp) nor mapped to a cozy model in COZY_MAP fall through to here. Today
// that's just nightstand and cactus; every other item resolves to a cozy model.
const BUILDERS: Record<string, () => Group> = {
  nightstand: () =>
    group(
      box(2.2, 0.3, 1.6, OAK, 0, 1.4, 0),
      box(0.25, 1.4, 0.25, OAK_DARK, -0.9, 0.7, -0.6),
      box(0.25, 1.4, 0.25, OAK_DARK, 0.9, 0.7, -0.6),
      box(0.25, 1.4, 0.25, OAK_DARK, -0.9, 0.7, 0.6),
      box(0.25, 1.4, 0.25, OAK_DARK, 0.9, 0.7, 0.6),
    ),

  cactus: () =>
    group(
      box(0.8, 0.6, 0.8, TERRACOTTA, 0, 0.3, 0),
      box(0.6, 1.3, 0.6, LEAF, 0, 1.2, 0),
      box(0.3, 0.5, 0.3, LEAF_DARK, -0.45, 1.5, 0),
      box(0.3, 0.5, 0.3, LEAF_DARK, 0.45, 1.2, 0),
    ),
};

/**
 * Maps our shop item keys to a cozy-room model name, a scale that fits the room
 * (models are authored at ~5 cm/unit, far bigger than a floor tile), and an
 * optional vertical lift for hanging items.
 */
const COZY_MAP: Record<string, { name: string; scale: number; y?: number; rotY?: number }> = {
  banana_plant: { name: 'banana plant', scale: 0.15 },
  bed: { name: 'bed', scale: 0.2 },
  blinds: { name: 'blinds', scale: 0.2 },
  bone: { name: 'bone', scale: 0.1 },
  books: { name: 'books', scale: 0.1 },
  bookshelf: { name: 'bookshelf', scale: 0.16, rotY: -90 },
  brush_jar: { name: 'brush jar', scale: 0.1 },
  cactus: { name: 'cactus', scale: 0.1 },
  cat: { name: 'cat', scale: 0.1, rotY: 180 },
  cat_toy: { name: 'cat toy', scale: 0.14 },
  chair: { name: 'chair', scale: 0.16 },
  clock: { name: 'table clock', scale: 0.08, rotY: 180 },
  curtain: { name: 'curtain', scale: 0.15 },
  desk: { name: 'desk', scale: 0.18, rotY: 180 },
  dog: { name: 'dog', scale: 0.1, rotY: 180 },
  fern: { name: 'fern in pot', scale: 0.15 },
  fish: { name: 'fish', scale: 0.12 },
  guitar: { name: 'guitar', scale: 0.13, rotY: -90 },
  hanging_plant: { name: 'hanging plant', scale: 0.12 },
  juice: { name: 'bottle of juice', scale: 0.09 },
  lamp: { name: 'lamp', scale: 0.14 },
  mirror: { name: 'mirror', scale: 0.14, rotY: 180 },
  mug: { name: 'coffee', scale: 0.08 },
  nightstand: { name: 'nightstand', scale: 0.1, rotY: 180 },
  pet_bed: { name: 'pet bed', scale: 0.11, rotY: 180 },
  plant: { name: 'plant', scale: 0.12 },
  poster: { name: 'poster', scale: 0.14 },
  rug: { name: 'rug', scale: 0.2 },
  sofa: { name: 'sofa', scale: 0.18, rotY: 180 },
  wall_lamp: { name: 'wall lamp', scale: 0.16, rotY: -90 },
  wall_shelf: { name: 'empty shelf', scale: 0.16, rotY: -90 },
  window: { name: 'window', scale: 0.16 },
};

const LAMP_SCALE = 0.16;

function buildLampModel(): Group {
  const g = createCozyModel('lamp', LAMP_SCALE) ?? new Group();

  const shadeCenterY = 20.75 * LAMP_SCALE;
  const shadeHeight = 9 * LAMP_SCALE;
  const shadeRTop = 4.2 * LAMP_SCALE;
  const shadeRBottom = 6.4 * LAMP_SCALE;

  const shade = new Mesh(
    new CylinderGeometry(shadeRTop, shadeRBottom, shadeHeight, 8, 1, true),
    new MeshStandardMaterial({
      color: 0xffe6b4,
      emissive: 0xffca78,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    }),
  );
  shade.position.y = shadeCenterY;
  g.add(shade);

  // Warm light cast into the room. Physically-correct (three r155+): decay 2
  // means intensity is high; drop it to dim the lamp, raise `distance` to spread.
  const light = new PointLight(0xffd9a0, 20, 14, 2);
  light.position.y = shadeCenterY;
  light.castShadow = false;
  g.add(light);

  return g;
}

const WALL_LAMP_SCALE = 0.13;

function buildWallLampModel(): Group {
  const g = createCozyModel('wall lamp', WALL_LAMP_SCALE) ?? new Group();

  // The shade is a downward-widening cone centered at pack (0, ~3, -3); its
  // opening faces the floor. Sit a warm emissive glow inside it and a point
  // light just below the opening so the sconce reads as lit and spills light
  // into the room.
  const shadeX = 0 * WALL_LAMP_SCALE;
  const shadeY = 2.3 * WALL_LAMP_SCALE;
  const shadeZ = -3.0 * WALL_LAMP_SCALE;

  const glow = new Mesh(
    new BoxGeometry(4.5 * WALL_LAMP_SCALE, 1.6 * WALL_LAMP_SCALE, 4.5 * WALL_LAMP_SCALE),
    new MeshStandardMaterial({
      color: 0xffe6b4,
      emissive: 0xffca78,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    }),
  );
  glow.position.set(shadeX, shadeY, shadeZ);
  g.add(glow);

  // Warm light cast into the room. Physically-correct (three r155+): decay 2
  // means intensity is high; drop it to dim the sconce, raise `distance` to spread.
  const light = new PointLight(0xffd9a0, 12, 10, 2);
  light.position.set(shadeX, 1.2 * WALL_LAMP_SCALE, shadeZ);
  light.castShadow = false;
  g.add(light);

  return g;
}

function fallbackColor(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffffff;
  return hash | 0x404040; // keep it from going too dark
}

export function buildPixelModel(key: string): Group {
  if (key === 'lamp') {
    return buildLampModel();
  }

  if (key === 'window') {
    return buildWindowModel();
  }

  if (key === 'wall_lamp') {
    return buildWallLampModel();
  }

  const cozy = COZY_MAP[key];
  if (cozy) {
    const model = createCozyModel(cozy.name, cozy.scale, cozy.y ?? 0, cozy.rotY ?? 0);
    if (model) return model;
  }

  const builder = BUILDERS[key];
  if (builder) {
    return builder();
  }

  return group(box(1.0, 1.0, 1.0, fallbackColor(key), 0, 0.5, 0));
}
