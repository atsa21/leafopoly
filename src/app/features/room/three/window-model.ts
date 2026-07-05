import {
  AdditiveBlending,
  Box3,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomItem } from '@core/models';

/**
 * The "bay window": the empty window frame (window-empty.glb) with a landscape
 * seen through the opening, warm daylight streaming into the room, and a soft
 * visible sunbeam. Dragging the window pans the landscape (parallax) via the
 * {@link RoomItem}-driven `onPlace` hook the scene calls after positioning it.
 *
 * Everything is a child of the returned Group, so it moves/rotates with the
 * item. The GLB frame loads asynchronously and pops in when ready; the returned
 * group is usable immediately (landscape, light and beam are built synchronously).
 */

/** Served copy of cozy-room-3d-models/glb/window-empty.glb (see public/models). */
const FRAME_URL = 'models/window-empty.glb';
/** Landscape seen through the window (committed with the window-background work). */
const LANDSCAPE_URL = 'img/background_window.png';

/** Frame width in floor tiles after normalizing the GLB's native ~5cm units. */
const TARGET_WIDTH = 3.6;

/**
 * Height the window's base hangs at (mirrors WALL_MOUNT.window.mountY in
 * room-scene). The whole group is lifted by this, so anything meant to sit on the
 * real floor must be dropped by MOUNT_Y in the group's local space.
 */
const MOUNT_Y = 2.6;

/**
 * How far the window stands in front of the wall (mirrors OFF in room-scene
 * placeOnWall). After the group is rotated to face the room the wall sits at local
 * +z = WALL_STANDOFF, so the exterior view must stay just in front of that or the
 * wall occludes it.
 */
const WALL_STANDOFF = 0.15;

/**
 * The 720×440 drag space the game positions items in (mirrors SRC_W/SRC_H in
 * room-scene). Used only to map the window's position to a parallax offset.
 */
const DRAG_W = 720;
const DRAG_H = 440;

/**
 * Fraction of the landscape visible through the window at once. Leaving 1−REPEAT
 * of the image off-frame is exactly the room we have to pan across as the window
 * is dragged, so offset stays in [0, 1−REPEAT] and never wraps.
 */
const REPEAT = 0.6;

export function buildWindowModel(): Group {
  const g = new Group();

  const landscape = buildLandscape();
  g.add(landscape.mesh);
  g.add(buildWindowLight());
  loadFrame(g);

  // Called by the scene after it repositions the item: pan the landscape so the
  // view through the glass shifts with the window (parallax depth illusion).
  const pan = 1 - REPEAT;
  g.userData['onPlace'] = (item: RoomItem): void => {
    const u = clamp01(item.x / DRAG_W);
    const v = clamp01(item.y / DRAG_H);
    landscape.tex.offset.set(u * pan, (1 - v) * pan);
  };

  return g;
}

/** Unlit plane behind the frame showing the exterior, its texture offset animatable. */
function buildLandscape(): { mesh: Mesh; tex: ReturnType<TextureLoader['load']> } {
  const tex = new TextureLoader().load(LANDSCAPE_URL);
  tex.colorSpace = SRGBColorSpace;
  // Zoom in so there is off-frame image to reveal while panning; clamp (never
  // wrap) since offset+repeat stays within [0, 1].
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.repeat.set(REPEAT, REPEAT);
  tex.offset.set((1 - REPEAT) / 2, (1 - REPEAT) / 2); // start centered

  // Built as a 1×1 plane; loadFrame scales it to the measured frame opening and
  // parks it just behind the frame front so the exterior fills the whole opening.
  // DoubleSide so the view reads no matter which way placeOnWall turns the frame.
  const mesh = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: tex, toneMapped: false, side: DoubleSide }),
  );
  mesh.userData['landscape'] = true; // marker so loadFrame can center it on the opening
  return { mesh, tex };
}

/**
 * The window's light, built fresh: a warm directional light that actually
 * brightens the room, a soft sun-pool splashed on the floor just inside the sill,
 * and a single gentle shaft linking the opening to the pool. Room side is −z (the
 * group is rotated to face the room), so all of it runs toward −z. The pool and
 * shaft are additive and don't write depth, so they read as light laid over the
 * floor and items rather than solid geometry.
 */
function buildWindowLight(): Group {
  const g = new Group();
  g.add(buildDaylight());
  g.add(buildSunPool());
  g.add(buildSunShaft());
  return g;
}

/** Warm daylight streaming from the window onto the floor and the frame front. */
function buildDaylight(): Group {
  const g = new Group();
  const light = new DirectionalLight(0xfff1cf, 1.1);
  // High on the room side (−z), aimed down and into the room floor.
  light.position.set(0.3, 3.0, -0.5);
  const target = new Object3D();
  target.position.set(-0.4, 0.2, -3.6);
  light.target = target;
  g.add(light);
  g.add(target);
  return g;
}

/**
 * A soft warm pool of sunlight on the floor just inside the sill: a perspective
 * trapezoid, narrow at the window and splaying wider as it reaches into the room.
 */
function buildSunPool(): Mesh {
  const nearHalf = TARGET_WIDTH * 0.36;
  const farHalf = TARGET_WIDTH * 0.7;
  const zNear = -0.4; // just inside the sill
  const zFar = -4.2; // reaches into the room
  // Drop to the real floor: the group is lifted by MOUNT_Y, so world y≈0 is here.
  const y = -MOUNT_Y + 0.04; // a hair above the floor to avoid z-fighting

  const geo = new BufferGeometry();
  geo.setAttribute(
    'position',
    new Float32BufferAttribute(
      [-nearHalf, y, zNear, nearHalf, y, zNear, farHalf, y, zFar, -farHalf, y, zFar],
      3,
    ),
  );
  geo.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);

  const pool = new Mesh(
    geo,
    new MeshBasicMaterial({
      map: buildGlowTexture(),
      color: 0xffe6a6,
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    }),
  );
  pool.renderOrder = 2;
  return pool;
}

/** One soft shaft of light sloping from the opening down to the floor pool. */
function buildSunShaft(): Mesh {
  const shaft = new Mesh(
    // Long enough to bridge the opening down to the floor pool MOUNT_Y below.
    new PlaneGeometry(TARGET_WIDTH * 0.72, 7.6),
    new MeshBasicMaterial({
      map: buildGlowTexture(),
      color: 0xffe6a6,
      transparent: true,
      opacity: 0.12,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    }),
  );
  // Centered between the opening (up high) and the floor pool (MOUNT_Y down).
  shaft.position.set(0, 1.7 - MOUNT_Y / 2, -1.8);
  shaft.rotation.x = Math.PI / 3.2; // lean it toward the floor, into the room
  shaft.renderOrder = 2;
  return shaft;
}

/**
 * A soft warm radial glow, brightest at the top-center (the sill edge) and fading
 * toward the room and the sides, painted once into a canvas texture so the pool
 * and shaft get natural falloff instead of a hard-edged quad.
 */
function buildGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, 0, 0, size / 2, 0, size * 1.15);
  grad.addColorStop(0, 'rgba(255,242,205,1)');
  grad.addColorStop(0.55, 'rgba(255,234,178,0.55)');
  grad.addColorStop(1, 'rgba(255,230,170,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Load the empty window frame, normalize it to the room's scale, and add it. */
function loadFrame(g: Group): void {
  new GLTFLoader().load(FRAME_URL, (gltf) => {
    const frame = gltf.scene;

    // Normalize the GLB's native units to TARGET_WIDTH and stand it on the floor.
    const box = new Box3().setFromObject(frame);
    const size = box.getSize(new Vector3());
    const scale = size.x > 0 ? TARGET_WIDTH / size.x : 1;
    frame.scale.setScalar(scale);

    const scaled = new Box3().setFromObject(frame);
    const center = scaled.getCenter(new Vector3());
    frame.position.x -= center.x; // center in x
    frame.position.z -= center.z; // center in z
    frame.position.y -= scaled.min.y; // base on the floor

    frame.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Park the landscape just behind the opening and centered on it so it reads
    // as the view through the glass. Measure the frame BEFORE parenting it to g,
    // so the bounds are in g's local space (setFromObject reads world matrices;
    // g may already be positioned in the room by the time this async load runs).
    const frameBox = new Box3().setFromObject(frame);
    const landscape = g.children.find((c) => c.userData['landscape']);
    if (landscape) {
      // Fill the opening; the plane sits behind the whole frame (below), so it
      // can be large without ever covering a rail or muntin.
      const cover = 0.92;
      landscape.scale.set(
        (frameBox.max.x - frameBox.min.x) * cover,
        (frameBox.max.y - frameBox.min.y) * cover,
        1,
      );
      landscape.position.set(
        (frameBox.min.x + frameBox.max.x) / 2,
        (frameBox.min.y + frameBox.max.y) / 2,
        // Sit just behind the ENTIRE frame (max.z) so every rail AND the middle
        // muntins stay in front of the view — recessing only to mid-depth left the
        // muntins level with the plane, so they vanished. Clamp to just in front of
        // the wall (local +z = WALL_STANDOFF) so a deep frame never pushes the view
        // behind the wall, where it would be occluded and show no exterior.
        Math.min(frameBox.max.z + 0.01, WALL_STANDOFF - 0.02),
      );
    }

    g.add(frame);
  });
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
