import { Component, computed, inject, signal } from '@angular/core';
import { form, min, max, maxLength } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '@core/services/game.service';
import { MultiplayerService } from '@core/services/multiplayer.service';
import { LogoComponent } from '@shared/logo/logo.component';
import { SettingsFormComponent } from '@shared/settings-form/settings-form.component';
import { SettingsComponent } from '../settings/settings.component';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
  imports: [LogoComponent, SettingsComponent, SettingsFormComponent],
})
export class StartComponent {
  protected game = inject(GameService);
  protected mp = inject(MultiplayerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    const id = this.route.snapshot.queryParamMap.get('code');

    if (id && !this.game.online()) {
      this.game.joinRoom(id);
      this.router.navigate(['/game'], { queryParams: { code: id } });
    }
  }

  protected panel = signal<'choose' | 'solo' | 'friends'>('choose');
  protected joinId = signal('');
  protected creating = signal(false);
  protected copied = signal(false);

  protected roomId = computed(() => this.mp.matchId());
  protected link = computed(() => this.game.inviteLink());
  protected canJoin = computed(() => this.joinId().trim().length >= 4);

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

  solo(): void {
    this.panel.set('solo');
  }

  private applyFormSettings(): void {
    const v = this.model();
    this.game.applySettings({
      name: v.name,
      startingLeaves: v.startingLeaves,
      passGoBonus: v.passGoBonus,
      categoryGoal: v.categoryGoal,
    });
  }

  startSolo(): void {
    this.applyFormSettings();
    this.game.startSolo();
    this.router.navigate(['/game']);
  }

  friends(): void {
    this.panel.set('friends');
  }

  back(): void {
    this.panel.set('choose');
  }

  async createRoom(): Promise<void> {
    if (this.roomId() || this.creating() || !this.f().valid()) return;
    this.applyFormSettings();
    this.creating.set(true);
    try {
      await this.game.createRoom();
    } finally {
      this.creating.set(false);
    }
  }

  enter(): void {
    this.game.enterGame();
    this.router.navigate(['/game'], { queryParams: { code: this.roomId() } });
  }

  join(): void {
    const id = this.joinId().trim().toLowerCase();
    if (!id) return;
    this.game.joinRoom(id);
    this.router.navigate(['/game'], { queryParams: { code: id } });
  }

  resume(): void {
    this.game.resume();
    this.router.navigate(['/game']);
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {}
  }
}
