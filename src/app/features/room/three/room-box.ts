import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshLambertMaterial,
  SRGBColorSpace,
} from 'three';

export function buildRoomBox(floorW: number, floorD: number): Group {
  const g = new Group();
  const wallH = 9;
  const t = 0.6; // wall/floor thickness

  const floorMat = new MeshLambertMaterial({ map: makeWoodFloorTexture() });
  const backMat = new MeshLambertMaterial({ color: 0xf2e9d6 });
  const leftMat = new MeshLambertMaterial({ color: 0xe9dcc2 });

  const floor = new Mesh(new BoxGeometry(floorW, t, floorD), floorMat);
  floor.position.set(0, -t / 2, 0);
  floor.receiveShadow = true;
  g.add(floor);

  const back = new Mesh(new BoxGeometry(floorW, wallH, t), backMat);
  back.position.set(0, wallH / 2, -floorD / 2 - t / 2);
  back.receiveShadow = true;
  g.add(back);

  const left = new Mesh(new BoxGeometry(t, wallH, floorD), leftMat);
  left.position.set(-floorW / 2 - t / 2, wallH / 2, 0);
  left.receiveShadow = true;
  g.add(left);

  return g;
}

const WOOD_TONE: readonly [number, number, number] = [206, 168, 108];

function makeWoodFloorTexture(): CanvasTexture {
  const W = 768;
  const H = 576; // 4:3 to match the 16×12 floor, keeping boards un-squished
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const rowH = 46; // board width (the visual height of a plank row)
  const gap = 2.5; // dark seam between boards

  ctx.fillStyle = '#7a5628';
  ctx.fillRect(0, 0, W, H);

  let row = 0;
  for (let y = 0; y < H; y += rowH) {
    // Stagger each row's starting seam so end-joints don't line up.
    const stagger = (rand(seed(row, 11)) - 0.5) * 260;
    let x = -260 - stagger;
    let i = 0;
    while (x < W) {
      const len = 150 + rand(seed(row, i)) * 150; // varied board lengths
      drawPlank(ctx, x, y, len, rowH, gap, seed(row * 131 + i, 7));
      x += len;
      i++;
    }
    row++;
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Draw a single horizontal wood board with its top-left corner at (x, y),
 * complete with lengthwise grain and a soft top/bottom bevel for relief.
 */
function drawPlank(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number,
  s: number,
): void {
  const px = x + gap / 2;
  const py = y + gap / 2;
  const pw = w - gap;
  const ph = h - gap;

  const [r, g, b] = WOOD_TONE;
  ctx.fillStyle = rgb(r, g, b);
  ctx.fillRect(px, py, pw, ph);

  // Lengthwise grain streaks.
  const streaks = 3;
  for (let k = 1; k <= streaks; k++) {
    const off = (ph * k) / (streaks + 1) + (rand(s + k * 7) - 0.5) * 4;
    ctx.strokeStyle = `rgba(70, 45, 18, ${0.05 + rand(s + k) * 0.08})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 1, py + off);
    ctx.lineTo(px + pw - 1, py + off);
    ctx.stroke();
  }

  // Bevel: light top edge, dark bottom edge for a little depth between rows.
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py + 0.5);
  ctx.lineTo(px + pw, py + 0.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60, 36, 12, 0.30)';
  ctx.beginPath();
  ctx.moveTo(px, py + ph - 0.5);
  ctx.lineTo(px + pw, py + ph - 0.5);
  ctx.stroke();
}

/** Deterministic hash so the floor looks identical every render (no Math.random). */
function seed(a: number, b: number): number {
  return (a * 374761 + b * 668265) % 100000;
}

function rand(x: number): number {
  const v = Math.sin(x * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
