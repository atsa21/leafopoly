import {
  Component,
  computed,
  inject,
  signal,
  ElementRef,
  viewChild,
  afterNextRender,
  DestroyRef,
} from '@angular/core';
import { GameService } from '@core/services/game.service';
import { SoundService } from '@core/services/sound.service';
import { ViewportService } from '@core/services/viewport.service';
import { CATEGORY_LABELS } from '@core/constants';

import { Player } from '@core/models';
import { RoomItemComponent } from './components/room-item/room-item.component';
import { ROOM_H, UNIT, itemHeight, itemSize } from './room-item.metrics';

@Component({
  selector: 'app-room',
  imports: [RoomItemComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  game = inject(GameService);
  private sound = inject(SoundService);
  private viewport = inject(ViewportService);

  /** True when the viewport is at most 660px wide. */
  isMobile = this.viewport.isMobile;
  private destroyRef = inject(DestroyRef);
  surface = viewChild<ElementRef<HTMLDivElement>>('surface');
  owner = (): Player => this.game.players()[this.game.roomOwner()];

  protected rows = computed(() => {
    const p = this.game.players()[this.game.roomOwner()];
    if (!p) return [];
    const tally = this.game.categoryTally(p);
    const goal = this.game.categoryGoal;
    return CATEGORY_LABELS.map((c) => ({
      label: c.label,
      count: tally[c.key],
      goal,
      done: tally[c.key] >= goal,
    }));
  });

  private readonly BASE_W = 720;
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

  private drag: { id: string; dx: number; dy: number } | null = null;

  onDown(e: PointerEvent, id: string) {
    if (!this.game.canEditRoom()) return;
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
    this.playPickup(item.key);
  }

  private playPickup(key: string): void {
    if (key === 'cat') this.sound.meow();
    else if (key === 'dog') this.sound.woof();
    else this.sound.pickUp();
  }

  onMove(e: PointerEvent) {
    if (!this.drag) return;
    const rect = this.surface()!.nativeElement.getBoundingClientRect();
    const s = this.scale();
    const item = this.owner().room.find((r) => r.id === this.drag!.id);
    const w = (item ? itemSize(item.key) : UNIT) + 4;
    const h = (item ? itemHeight(item.key) : UNIT) + 4;
    const x = Math.max(4, Math.min(this.BASE_W - w, (e.clientX - rect.left) / s - this.drag.dx));
    const y = Math.max(4, Math.min(ROOM_H - h, (e.clientY - rect.top) / s - this.drag.dy));
    this.game.moveItem(this.drag.id, x, y);
  }

  onUp(e: PointerEvent) {
    if (this.drag) {
      this.surface()!.nativeElement.releasePointerCapture(e.pointerId);
      this.drag = null;
      this.game.commitRoom();
    }
  }
}
