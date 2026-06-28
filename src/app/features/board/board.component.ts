import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { GameService } from '@core/services/game.service';
import { Player } from '@core/models';
import { ItemIconComponent } from '@shared/icons/item-icon.component';
import { LogoComponent } from "@shared/logo/logo.component";

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  imports: [ItemIconComponent, LogoComponent, NgOptimizedImage],
})
export class BoardComponent {
  game = inject(GameService);

  tokensOn(i: number): Player[] {
    return this.game.players().filter((p) => p.pos === i);
  }
}
