import { Component, computed, inject, signal } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { MultiplayerService } from '@core/services/multiplayer.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent {
  game = inject(GameService);
  mp = inject(MultiplayerService);

  protected link = computed(() => this.game.inviteLink());
  protected copied = signal(false);

  protected myName = computed(() => this.game.players()[this.mp.mySlot()]?.name ?? '');

  protected statusText = computed(() => {
    if (this.mp.peerJoined() || this.mp.status() === 'connected') return 'Connected ✓';
    if (this.mp.mySlot() === 0) return 'Waiting for a friend to join…';
    return 'Connecting…';
  });

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {}
  }
}
