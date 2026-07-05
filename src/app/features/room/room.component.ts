import { Component, computed, inject } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { SoundService } from '@core/services/sound.service';
import { CATEGORY_LABELS } from '@core/constants';

import { Player } from '@core/models';
import { Room3dComponent, ItemMove } from './components/room-3d/room-3d.component';

@Component({
  selector: 'app-room',
  imports: [Room3dComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss',
})
export class RoomComponent {
  game = inject(GameService);
  private sound = inject(SoundService);

  owner = (): Player => this.game.players()[this.game.roomOwner()];

  protected rows = computed(() => {
    const p = this.game.players()[this.game.roomOwner()];
    if (!p) return [];
    const tally = this.game.categoryTally(p);
    const goal = this.game.categoryGoal();
    return CATEGORY_LABELS.map((c) => ({
      label: c.label,
      count: tally[c.key],
      goal,
      done: tally[c.key] >= goal,
    }));
  });

  protected onPick(id: string): void {
    if (!this.game.canEditRoom()) return;
    const item = this.owner().room.find((r) => r.id === id);
    this.game.bringToFront(id);
    this.playPickup(item?.key ?? '');
  }

  protected onMoved(move: ItemMove): void {
    this.game.moveItem(move.id, move.x, move.y);
  }

  protected onDrop(): void {
    this.game.commitRoom();
  }

  private playPickup(key: string): void {
    if (key === 'cat') this.sound.meow();
    else if (key === 'dog') this.sound.woof();
    else this.sound.pickUp();
  }
}
