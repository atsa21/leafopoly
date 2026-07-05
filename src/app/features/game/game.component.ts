import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@core/services/game.service';
import { BoardComponent } from '../board/board.component';
import { ControlsComponent } from '../controls/controls.component';
import { ShopComponent } from '../shop/shop.component';
import { CouponComponent } from '../coupon/coupon.component';
import { RoomComponent } from '../room/room.component';
import { LobbyComponent } from '../lobby/lobby.component';
import { SettingsComponent } from '../settings/settings.component';
import { WinComponent } from '../win/win.component';
import { ItemIconComponent } from '@shared/icons/item-icon.component';
import { MuteButtonComponent } from '@shared/mute-button/mute-button.component';

@Component({
  selector: 'app-game',
  imports: [
    BoardComponent,
    ControlsComponent,
    ShopComponent,
    CouponComponent,
    RoomComponent,
    LobbyComponent,
    SettingsComponent,
    WinComponent,
    ItemIconComponent,
    MuteButtonComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  protected game = inject(GameService);
  private router = inject(Router);

  protected backToStart() {
    this.game.exitToStart();
    this.router.navigate(['']);
  }

  protected leafBurst(slot: number) {
    const g = this.game.leafGain();
    return g && g.slot === slot ? [g] : [];
  }

  protected leafLossBurst(slot: number) {
    const g = this.game.leafLoss();
    return g && g.slot === slot ? [g] : [];
  }
}
