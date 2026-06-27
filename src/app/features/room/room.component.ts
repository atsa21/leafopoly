import {
  Component,
  inject,
  signal,
  ElementRef,
  viewChild,
  afterNextRender,
  DestroyRef,
} from '@angular/core';
import { GameService } from '@core/services/game.service';
import { ItemIconComponent } from '@shared/icons/item-icon.component';
import { ITEMS } from '@core/constants';

import { Player } from '@core/models';

@Component({
  selector: 'app-room',
  imports: [ItemIconComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  game = inject(GameService);
  private destroyRef = inject(DestroyRef);
  surface = viewChild<ElementRef<HTMLDivElement>>('surface');
  owner = (): Player => this.game.players()[this.game.roomOwner()];

  private readonly BASE_W = 720;
  private readonly ROOM_H = 440;
  private readonly UNIT = 50;
  scale = signal(1);

  constructor() {
    afterNextRender(() => {
      const el = this.surface()?.nativeElement;
      if (!el) return;
      const measure = () => this.scale.set((el.clientWidth || this.BASE_W) / this.BASE_W);
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  label(key: string): string {
    return ITEMS[key]?.name ?? key;
  }

  // --- design-space (720×440) sizes; the template multiplies by scale() ---
  size(key: string): number {
    switch(key) {
      case 'curtain':
        return Math.round(this.height(key) * (60 / 88));
      case 'lamp':
        return Math.round(this.height(key) * (60 / 88));
      case 'shelf':
        return Math.round(this.height(key) * (60 / 40));
      case 'window':
        return Math.round(this.height(key) * (30 / 44));
      case 'bed':
        return Math.round(this.height(key) * (88 / 60));
      case 'rug':
        return Math.round(this.UNIT * (ITEMS[key]?.size ?? 1) * 2);
      default:
        return Math.round(this.UNIT * (ITEMS[key]?.size ?? 1));
    }
  }

  height(key: string): number {
    if (key === 'curtain') return Math.round(this.ROOM_H * 0.75);
    if (key === 'lamp') return Math.round(this.UNIT * (ITEMS[key]?.size ?? 1));
    if (key === 'shelf') return Math.round(this.UNIT * 1.4);
    if (key === 'window') return Math.round(this.ROOM_H * 0.4);
    if (key === 'bed') return Math.round(this.UNIT * (ITEMS[key]?.size ?? 1));
    if (key === 'rug') return Math.round(this.size(key) * (28 / 60));

    return this.size(key);
  }

  private drag: { id: string; dx: number; dy: number } | null = null;

  onDown(e: PointerEvent, id: string) {
    e.preventDefault();
    const el = this.surface()!.nativeElement;
    const item = this.owner().room.find((r) => r.id === id)!;
    const rect = el.getBoundingClientRect();
    const s = this.scale();

    this.drag = {
      id,
      dx: (e.clientX - rect.left) / s - item.x,
      dy: (e.clientY - rect.top) / s - item.y,
    };
    this.game.bringToFront(id);
    el.setPointerCapture(e.pointerId);
  }

  onMove(e: PointerEvent) {
    if (!this.drag) return;
    const rect = this.surface()!.nativeElement.getBoundingClientRect();
    const s = this.scale();
    const item = this.owner().room.find((r) => r.id === this.drag!.id);
    const w = (item ? this.size(item.key) : this.UNIT) + 4;
    const h = (item ? this.height(item.key) : this.UNIT) + 4;
    const x = Math.max(4, Math.min(this.BASE_W - w, (e.clientX - rect.left) / s - this.drag.dx));
    const y = Math.max(4, Math.min(this.ROOM_H - h, (e.clientY - rect.top) / s - this.drag.dy));
    this.game.moveItem(this.drag.id, x, y);
  }

  onUp(e: PointerEvent) {
    if (this.drag) {
      this.surface()!.nativeElement.releasePointerCapture(e.pointerId);
      this.drag = null;
    }
  }
}
