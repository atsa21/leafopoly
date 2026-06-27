import { Component, inject, signal } from '@angular/core';
import { form, FormField, min, maxLength } from '@angular/forms/signals';
import { GameService } from '@core/services/game.service';

@Component({
  selector: 'app-settings',
  imports: [FormField],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private game = inject(GameService);

  protected readonly model = signal({
    name: this.game.playerNames()[this.game.mySlot()] ?? 'Robin',
    startingLeaves: this.game.startingLeaves(),
    passGoBonus: this.game.passGoBonus(),
  });

  protected readonly f = form(this.model, (p) => {
    maxLength(p.name, 14);
    min(p.startingLeaves, 0);
    min(p.passGoBonus, 0);
  });

  protected close() {
    this.game.closeSettings();
  }

  private apply() {
    const v = this.model();
    this.game.applySettings({
      name: v.name,
      startingLeaves: v.startingLeaves,
      passGoBonus: v.passGoBonus,
    });
  }

  protected save() {
    this.apply();
    this.game.closeSettings();
  }

  protected saveAndRestart() {
    this.apply();
    this.game.newGame();
  }
}
