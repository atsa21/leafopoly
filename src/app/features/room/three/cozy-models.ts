import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial } from 'three';
import { MODELS_DATA } from './constants/models-data';
import { MODELS_COLOR_PALETTE } from './constants';

/**
 * Cozy Room 3D 
 * compact box table with vertex colors: no textures, no async GLB loading, so
 * this stays synchronous and SSR-safe like the rest of the scene.
 *
 * Convention (from the pack): each model stands on the floor (y = 0), faces −z,
 * and is centered in x/z. Coordinates are in the pack's own units (≈5 cm each),
 * so callers scale down to fit the room.
 */

const PALETTE = MODELS_COLOR_PALETTE;

/** sRGB → linear, so vertex colors look right under lit materials. */
function s2l(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

const LINEAR: [number, number, number][] = PALETTE.map((hx) => [
  s2l(parseInt(hx.slice(1, 3), 16) / 255),
  s2l(parseInt(hx.slice(3, 5), 16) / 255),
  s2l(parseInt(hx.slice(5, 7), 16) / 255),
]);

// The 6 cube faces: outward normal + the 4 corner selectors into [x,y,z] pairs.
const FACES: { n: [number, number, number]; c: [number, number, number][] }[] = [
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
];

/** All available cozy model names. */
export const COZY_NAMES = Object.keys(MODELS_DATA);

export function createCozyModel(name: string, scale = 1, yOffset = 0, rotYDeg = 0): Group | null {
  const parts = MODELS_DATA[name];
  if (!parts) return null;

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (const q of parts) {
    const X = [q[0], q[0] + q[3]];
    const Y = [q[1], q[1] + q[4]];
    const Z = [q[2], q[2] + q[5]];
    const col = LINEAR[q[6]];
    for (const face of FACES) {
      const base = positions.length / 3;
      for (let v = 0; v < 4; v++) {
        const cn = face.c[v];
        positions.push(X[cn[0]], Y[cn[1]], Z[cn[2]]);
        normals.push(face.n[0], face.n[1], face.n[2]);
        colors.push(col[0], col[1], col[2]);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);

  const mesh = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, metalness: 0, roughness: 0.95 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.scale.setScalar(scale);
  mesh.position.y = yOffset;
  mesh.rotation.y = (rotYDeg * Math.PI) / 180;

  const wrapper = new Group();
  wrapper.add(mesh);
  return wrapper;
}
