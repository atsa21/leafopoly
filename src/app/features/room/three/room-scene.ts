import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  OrthographicCamera,
  PCFShadowMap,
  Plane,
  Raycaster,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomItem } from '@core/models';
import { buildPixelModel } from './pixel-models';
import { buildRoomBox } from './room-box';

/** The 2D drag surface is a 720×440 box; we map item x/y onto the floor. */
const SRC_W = 720;
const SRC_H = 440;

/** Floor size in tile units. */
const FLOOR_W = 16;
const FLOOR_D = 12;

/** Internal render downscale for the chunky "pixel" look (>=1). */
const PIXEL_SCALE = 3;

/**
 * Wall-hung items: instead of standing on the floor they snap flush to whichever
 * wall their dragged position is nearest. `mountY` is how high the model's base
 * hangs; `margin` keeps it clear of the corners. The window is tall and hangs
 * low like a bay window; the poster hangs high like a picture; the curtain is
 * floor-length, so it mounts at the floor and reaches up the wall; the blinds
 * hang against the wall like the curtain; the wall lamp is a sconce that sits
 * flush against the wall like the poster.
 */
const WALL_MOUNT: Record<string, { mountY: number; margin: number }> = {
  poster: { mountY: 2.6, margin: 1.4 },
  window: { mountY: 2.6, margin: 2.2 },
  curtain: { mountY: 2.6, margin: 2.4 },
  blinds: { mountY: 2.6, margin: 2.4 },
  wall_lamp: { mountY: 2.4, margin: 1.0 },
};

/**
 * Owns a single Three.js WebGL scene rendering the room as a low-poly pixel
 * diorama. Browser-only: instantiate inside `afterNextRender`, never on the
 * server. Call {@link setItems} whenever the room contents change, {@link resize}
 * on layout changes, and {@link dispose} on teardown.
 */
export class RoomScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;
  private readonly itemsGroup = new Group();

  /** 3D model per room-item id, so objects persist and move instead of rebuilding. */
  private readonly models = new Map<string, { key: string; group: Group }>();

  // Reusable picking helpers (avoid per-event allocations).
  private readonly raycaster = new Raycaster();
  private readonly floorPlane = new Plane(new Vector3(0, 1, 0), 0); // y = 0
  private readonly ndc = new Vector2();
  private readonly hitPoint = new Vector3();

  /** Center of the room's bounding box; the camera aims here to keep it framed. */
  private readonly target = new Vector3();
  /** Bounding-sphere radius of the room, used to size the ortho frustum. */
  private radius = FLOOR_W;

  private frame = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    this.scene.background = null;

    // Isometric-ish orthographic camera. Aim + frustum are set from the room's
    // bounding box below so the room sits centered in the view.
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.set(FLOOR_W, FLOOR_W * 0.9, FLOOR_W);

    this.addLights();
    const roomBox = buildRoomBox(FLOOR_W, FLOOR_D);
    this.scene.add(roomBox);
    this.scene.add(this.itemsGroup);

    // Center the camera on the room and remember its size for framing.
    const bounds = new Box3().setFromObject(roomBox);
    bounds.getCenter(this.target);
    const sphere = bounds.getBoundingSphere(new Sphere());
    this.radius = sphere.radius;
    this.camera.position.copy(this.target).add(new Vector3(FLOOR_W, FLOOR_W * 0.9, FLOOR_W));
    this.camera.lookAt(this.target);

    this.loop = this.loop.bind(this);
  }

  private addLights(): void {
    this.scene.add(new AmbientLight(0xfff2d6, 0.75));

    const key = new DirectionalLight(0xfff4e0, 0.9);
    key.position.set(8, 14, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const c = key.shadow.camera;
    c.left = -FLOOR_W;
    c.right = FLOOR_W;
    c.top = FLOOR_D;
    c.bottom = -FLOOR_D;
    c.near = 0.1;
    c.far = 60;
    this.scene.add(key);

    const fill = new DirectionalLight(0xbcd0e6, 0.35);
    fill.position.set(-8, 6, -4);
    this.scene.add(fill);
  }

  /**
   * Reconcile the 3D objects with the current room contents, keyed by item id.
   * New items (e.g. just bought in the shop) get a fresh model attached to their
   * id; existing items are moved in place; removed items are disposed. An item
   * whose key changed is rebuilt.
   */
  setItems(items: readonly RoomItem[]): void {
    const seen = new Set<string>();

    for (const item of items) {
      seen.add(item.id);
      let entry = this.models.get(item.id);

      if (!entry || entry.key !== item.key) {
        if (entry) this.removeModel(item.id);
        const group = buildPixelModel(item.key);
        group.userData['id'] = item.id; // lets raycasting map a hit back to the item
        entry = { key: item.key, group };
        this.models.set(item.id, entry);
        this.itemsGroup.add(group);
      }

      this.placeModel(entry.group, item);
    }

    // Drop models whose item is gone.
    for (const id of [...this.models.keys()]) {
      if (!seen.has(id)) this.removeModel(id);
    }
  }

  /** Position/orient a model from its room item. */
  private placeModel(group: Group, item: RoomItem): void {
    const wx = (item.x / SRC_W - 0.5) * FLOOR_W;
    // Smaller screen-y (higher up) reads as further back → more negative Z.
    const wz = (item.y / SRC_H - 0.5) * FLOOR_D;

    const mount = WALL_MOUNT[item.key];
    if (mount) {
      this.placeOnWall(group, wx, wz, mount);
    } else {
      group.position.set(wx, 0, wz);
      group.rotation.y = ((item.rot || 0) * Math.PI) / 180;
    }

    // Let a model react to being (re)placed — the window uses this to pan its
    // exterior view as it is dragged.
    const onPlace = group.userData['onPlace'] as ((item: RoomItem) => void) | undefined;
    onPlace?.(item);
  }

  /**
   * Hang a wall-mounted item (e.g. a poster) flush against whichever of the two
   * visible walls — back (−z) or left (−x) — its dragged position is nearest to,
   * and turn it to face into the room from that wall. Dragging it past the
   * halfway diagonal flips it onto the other wall and rotates it to match.
   */
  private placeOnWall(
    group: Group,
    wx: number,
    wz: number,
    mount: { mountY: number; margin: number },
  ): void {
    const halfW = FLOOR_W / 2;
    const halfD = FLOOR_D / 2;
    const OFF = 0.15; // stand just in front of the wall face to avoid z-fighting
    const { mountY, margin } = mount;

    // Cozy models face −z by default; rotate the whole group to face the room.
    if (wz + halfD <= wx + halfW) {
      // Nearer the back wall: slide along X, face +z.
      group.position.set(clamp(wx, -halfW + margin, halfW - margin), mountY, -halfD + OFF);
      group.rotation.y = Math.PI;
    } else {
      // Nearer the left wall: slide along Z, face +x.
      group.position.set(-halfW + OFF, mountY, clamp(wz, -halfD + margin, halfD - margin));
      group.rotation.y = -Math.PI / 2;
    }
  }

  private removeModel(id: string): void {
    const entry = this.models.get(id);
    if (!entry) return;
    this.itemsGroup.remove(entry.group);
    entry.group.traverse(disposeObject);
    this.models.delete(id);
  }

  private clearItems(): void {
    for (const id of [...this.models.keys()]) this.removeModel(id);
  }

  /**
   * Return the id of the item whose 3D model is under the given normalized
   * device coordinates (x/y in [-1, 1]), or null if none was hit.
   */
  pick(ndcX: number, ndcY: number): string | null {
    this.raycaster.setFromCamera(this.ndc.set(ndcX, ndcY), this.camera);
    const hits = this.raycaster.intersectObjects(this.itemsGroup.children, true);
    if (!hits.length) return null;
    let obj: Object3D | null = hits[0].object;
    while (obj && obj !== this.itemsGroup) {
      const id = obj.userData['id'];
      if (typeof id === 'string') return id;
      obj = obj.parent;
    }
    return null;
  }

  /**
   * Project the pointer onto the floor plane and return the corresponding
   * item-space position (the same 720×440 coordinate space the game uses),
   * clamped to the room. Returns null if the ray misses the floor.
   */
  floorPoint(ndcX: number, ndcY: number): { x: number; y: number } | null {
    this.raycaster.setFromCamera(this.ndc.set(ndcX, ndcY), this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.floorPlane, this.hitPoint);
    if (!hit) return null;
    const x = (hit.x / FLOOR_W + 0.5) * SRC_W;
    const y = (hit.z / FLOOR_D + 0.5) * SRC_H;
    return { x: clamp(x, 0, SRC_W), y: clamp(y, 0, SRC_H) };
  }

  /** Match the render target to the CSS pixel size of the canvas. */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    const aspect = width / height;
    // Half-height of the ortho frustum: fit the room's bounding sphere with a
    // small margin so it stays centered and fully visible at any aspect ratio.
    const margin = 1.08;
    const view = this.radius * margin;
    const halfH = aspect >= 1 ? view : view / aspect; // don't crop when narrow
    this.camera.left = -halfH * aspect;
    this.camera.right = halfH * aspect;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    // Render at reduced internal resolution, upscale via CSS for pixel crunch.
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(Math.max(1, Math.round(width / PIXEL_SCALE)), Math.max(1, Math.round(height / PIXEL_SCALE)), false);
  }

  start(): void {
    if (this.disposed) return;
    this.loop();
  }

  private loop(): void {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  }

  dispose(): void {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.clearItems();
    this.scene.traverse(disposeObject);
    this.renderer.dispose();
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Free geometries/materials (and their textures) on a subtree node to avoid GPU leaks. */
function disposeObject(obj: Object3D): void {
  if (!(obj instanceof Mesh)) return;
  obj.geometry?.dispose();
  const material = obj.material;
  const materials = Array.isArray(material) ? material : [material];
  for (const m of materials) {
    if (!m) continue;
    (m as { map?: { dispose?: () => void } }).map?.dispose?.();
    m.dispose?.();
  }
}

export { FLOOR_W, FLOOR_D, SRC_W, SRC_H };
