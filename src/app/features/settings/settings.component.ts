import { Component, inject, input, signal } from '@angular/core';
import { form, min, max, maxLength } from '@angular/forms/signals';
import { GameService } from '@core/services/game.service';
import { SettingsFormComponent } from '@shared/settings-form/settings-form.component';

@Component({
  selector: 'app-settings',
  imports: [SettingsFormComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private game = inject(GameService);

  readonly showNewGame = input(true);

  protected readonly model = signal({
    name: this.game.playerNames()[this.game.mySlot()] ?? 'Robin',
    startingLeaves: this.game.startingLeaves(),
    passGoBonus: this.game.passGoBonus(),
    categoryGoal: this.game.categoryGoal(),
  });

  protected readonly f = form(this.model, (p) => {
    maxLength(p.name, 14);
    min(p.startingLeaves, 0);
    min(p.passGoBonus, 0);
    min(p.categoryGoal, 1);
    max(p.categoryGoal, 4);
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
      categoryGoal: v.categoryGoal,
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
