import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@core/services/game.service';
import { MultiplayerService } from '@core/services/multiplayer.service';
import { LogoComponent } from '@shared/logo/logo.component';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
  imports: [LogoComponent],
})
export class StartComponent {
  protected game = inject(GameService);
  protected mp = inject(MultiplayerService);
  private router = inject(Router);

  protected panel = signal<'choose' | 'friends'>('choose');
  protected joinId = signal('');
  protected creating = signal(false);
  protected copied = signal(false);

  protected roomId = computed(() => this.mp.matchId());
  protected link = computed(() => this.game.inviteLink());
  protected canJoin = computed(() => this.joinId().trim().length >= 4);

  solo(): void {
    this.game.startSolo();
    this.router.navigate(['/']);
  }

  friends(): void {
    this.panel.set('friends');
  }

  back(): void {
    this.panel.set('choose');
  }

  async createRoom(): Promise<void> {
    if (this.roomId() || this.creating()) return;
    this.creating.set(true);
    try {
      await this.game.createRoom();
    } finally {
      this.creating.set(false);
    }
  }

  enter(): void {
    this.game.enterGame();
    this.router.navigate(['/']);
  }

  join(): void {
    const id = this.joinId().trim().toLowerCase();
    if (!id) return;
    this.game.joinRoom(id);
    this.router.navigate(['/']);
  }

  resume(): void {
    this.game.resume();
    this.router.navigate(['/']);
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {}
  }
}
