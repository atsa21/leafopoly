import { Component, computed, inject } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { CATEGORY_LABELS } from '@core/constants';

@Component({
  selector: 'app-win',
  templateUrl: './win.component.html',
  styleUrl: './win.component.scss',
})
export class WinComponent {
  protected game = inject(GameService);

  protected winnerName = computed(() => {
    const i = this.game.winner();
    return i === null ? '' : (this.game.players()[i]?.name ?? '');
  });

  protected winnerColor = computed(() => {
    const i = this.game.winner();
    return i === null ? 'var(--ink)' : (this.game.players()[i]?.color ?? 'var(--ink)');
  });

  protected rows = computed(() => {
    const i = this.game.winner();
    if (i === null) return [];
    const tally = this.game.categoryTally(this.game.players()[i]);
    const goal = this.game.categoryGoal();
    return CATEGORY_LABELS.map((c) => ({
      label: c.label,
      count: tally[c.key],
      goal,
    }));
  });

  seeRoom(): void {
    const i = this.game.winner();
    if (i !== null) this.game.openRoom(i);
  }

  playAgain(): void {
    this.game.newGame();
  }
}
