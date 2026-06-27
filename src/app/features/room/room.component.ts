import { Component, inject, ElementRef, viewChild } from '@angular/core';
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
  surface = viewChild<ElementRef<HTMLDivElement>>('surface');
  owner = (): Player => this.game.players()[this.game.roomOwner()];

  private readonly ROOM_H = 440;

  label(key: string): string {
    return ITEMS[key]?.name ?? key;
  }

  size(key: string): number {
    if (key === 'curtain') return Math.round(this.height(key) * (60 / 88));
    if (key === 'window') return Math.round(this.height(key) * (30 / 44));
  
    return Math.round(74 * (ITEMS[key]?.size ?? 1));
  }

  height(key: string): number {
    return key === 'curtain' ? Math.round(this.ROOM_H * 0.75) : key === 'window' ? Math.round(window.innerHeight * 0.4) : this.size(key);
  }

  private drag: { id: string; dx: number; dy: number } | null = null;

  onDown(e: PointerEvent, id: string) {
    e.preventDefault();
    const el = this.surface()!.nativeElement;
    const item = this.owner().room.find((r) => r.id === id)!;
    const rect = el.getBoundingClientRect();
    this.drag = { id, dx: e.clientX - (rect.left + item.x), dy: e.clientY - (rect.top + item.y) };
    el.setPointerCapture(e.pointerId);
  }

  onMove(e: PointerEvent) {
    if (!this.drag) return;
    const rect = this.surface()!.nativeElement.getBoundingClientRect();
    const item = this.owner().room.find((r) => r.id === this.drag!.id);
    const w = (item ? this.size(item.key) : 74) + 4;
    const h = (item ? this.height(item.key) : 74) + 4;
    const x = Math.max(4, Math.min(rect.width - w, e.clientX - rect.left - this.drag.dx));
    const y = Math.max(4, Math.min(rect.height - h, e.clientY - rect.top - this.drag.dy));
    this.game.moveItem(this.drag.id, x, y);
  }

  onUp(e: PointerEvent) {
    if (this.drag) {
      this.surface()!.nativeElement.releasePointerCapture(e.pointerId);
      this.drag = null;
    }
  }
}
