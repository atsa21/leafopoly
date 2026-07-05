import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RoomItem } from '@core/models';
import { RoomScene } from '../../three/room-scene';

export interface ItemMove {
  id: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-room-3d',
  templateUrl: './room-3d.component.html',
  styleUrl: './room-3d.component.scss',
  host: {
    '[class.editable]': 'canEdit()',
    '(pointerdown)': 'onDown($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onUp($event)',
    '(pointercancel)': 'onUp($event)',
  },
})
export class Room3dComponent {
  items = input.required<readonly RoomItem[]>();
  canEdit = input(true);

  picked = output<string>();
  moved = output<ItemMove>();
  dropped = output<void>();

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private destroyRef = inject(DestroyRef);

  private scene: RoomScene | null = null;
  private dragId: string | null = null;

  constructor() {
    afterNextRender(() => {
      const scene = new RoomScene(this.canvas().nativeElement);
      this.scene = scene;
      scene.setItems(this.items());

      const hostEl = this.host().nativeElement;
      const resize = () => scene.resize(hostEl.clientWidth, hostEl.clientHeight);
      resize();
      scene.start();

      const ro = new ResizeObserver(resize);
      ro.observe(hostEl);

      this.destroyRef.onDestroy(() => {
        ro.disconnect();
        scene.dispose();
        this.scene = null;
      });
    });

    effect(() => {
      const items = this.items();
      this.scene?.setItems(items);
    });
  }

  protected onDown(event: PointerEvent): void {
    if (!this.canEdit() || !this.scene) return;
    const id = this.scene.pick(...this.toNdc(event));
    if (!id) return;
    event.preventDefault();
    this.dragId = id;
    this.host().nativeElement.setPointerCapture(event.pointerId);
    this.picked.emit(id);
  }

  protected onMove(event: PointerEvent): void {
    if (!this.dragId || !this.scene) return;
    const point = this.scene.floorPoint(...this.toNdc(event));
    if (point) this.moved.emit({ id: this.dragId, x: point.x, y: point.y });
  }

  protected onUp(event: PointerEvent): void {
    if (!this.dragId) return;
    this.dragId = null;
    this.host().nativeElement.releasePointerCapture(event.pointerId);
    this.dropped.emit();
  }

  private toNdc(event: PointerEvent): [number, number] {
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    return [x, y];
  }
}
