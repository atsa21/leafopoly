import { Component, inject, computed, signal, afterNextRender } from '@angular/core';
import { GameService } from './core/services/game.service';
import { BoardComponent } from './features/board/board.component';
import { ControlsComponent } from './features/controls/controls.component';
import { ShopComponent } from './features/shop/shop.component';
import { CouponComponent } from './features/coupon/coupon.component';
import { RoomComponent } from './features/room/room.component';
import { LobbyComponent } from './features/lobby/lobby.component';
import { SettingsComponent } from './features/settings/settings.component';
import { StartComponent } from './features/start/start.component';
import { WinComponent } from './features/win/win.component';
import { ItemIconComponent } from "./shared/icons/item-icon.component";
import { MuteButtonComponent } from './shared/mute-button/mute-button.component';

const STAGE_W = 1280;
const STAGE_H = 820;

@Component({
  selector: 'app-root',
  imports: [
    BoardComponent,
    ControlsComponent,
    ShopComponent,
    CouponComponent,
    RoomComponent,
    LobbyComponent,
    SettingsComponent,
    StartComponent,
    WinComponent,
    ItemIconComponent,
    MuteButtonComponent
],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:resize)': 'measure()' },
})
export class App {
  game = inject(GameService);

  /** Scale factor that fits the fixed stage within the current viewport. */
  protected scale = signal(1);

  constructor() {
    afterNextRender(() => {
      this.measure();
      const id = new URLSearchParams(window.location.search).get('m');
      if (id && this.game.online() === false) {
        this.game.joinRoom(id);
      }
    });
  }

  protected measure() {
    this.scale.set(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  }

  /** The active leaf-gain burst for a given player slot, as a 0- or 1-item list for `@for`. */
  protected leafBurst(slot: number) {
    const g = this.game.leafGain();
    return g && g.slot === slot ? [g] : [];
  }

  protected leafLossBurst(slot: number) {
    const g = this.game.leafLoss();
    return g && g.slot === slot ? [g] : [];
  }

  bg = computed(() => {
    const base = { cork: '#9c7d52', slate: '#5d6673', olive: '#6d7144' }[this.game.tableColor()];
    return `radial-gradient(1200px 500px at 50% -10%, rgba(255,245,220,.10), transparent 60%),
            radial-gradient(900px 600px at 50% 120%, rgba(0,0,0,.20), transparent 60%),
            repeating-linear-gradient(135deg, rgba(120,90,50,.06) 0 3px, transparent 3px 7px),
            ${base}`;
  });
}
