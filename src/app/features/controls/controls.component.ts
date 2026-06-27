import { Component, inject, computed } from '@angular/core';
import { GameService } from '@core/services/game.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss',
})
export class ControlsComponent {
  game = inject(GameService);
  rollLabel = computed(() => {
    if (!this.game.isMyTurn()) return 'Their turn';
    if (this.game.cur().skip) return 'Skip turn ▸';
    return this.game.rolling() ? '…rolling' : 'Roll!';
  });
}
