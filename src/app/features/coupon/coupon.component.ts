import { Component, inject, computed } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { SoundService } from '@core/services/sound.service';

@Component({
  selector: 'app-coupon',
  templateUrl: './coupon.component.html',
  styleUrl: './coupon.component.scss',
})
export class CouponComponent {
  game = inject(GameService);
  private sound = inject(SoundService);

  private corners = [
    [0, 0],
    [300, 0],
    [300, 178],
    [0, 178],
  ];

  corner = computed(() => this.corners[Math.min(this.game.cutStep(), 3)]);

  snip() {
    const before = this.game.cutStep();
    this.game.cut();
    const after = this.game.cutStep();

    if (after > before) {
      this.sound.scissors(after >= 4);
    }
  }
}
