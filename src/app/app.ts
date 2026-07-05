import { Component, inject, computed, signal, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameService } from './core/services/game.service';

const STAGE_W = 1280;
const STAGE_H = 820;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: { '(window:resize)': 'measure()' },
})
export class App {
  protected game = inject(GameService);
  protected scale = signal(1);

  constructor() {
    afterNextRender(() => this.measure());
  }

  protected measure() {
    this.scale.set(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
  }
}
