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

  protected bg = computed(() => {
    const base = { cork: '#9c7d52', slate: '#5d6673', olive: '#6d7144' }[this.game.tableColor()];
    return `radial-gradient(1200px 500px at 50% -10%, rgba(255,245,220,.10), transparent 60%),
            radial-gradient(900px 600px at 50% 120%, rgba(0,0,0,.20), transparent 60%),
            repeating-linear-gradient(135deg, rgba(120,90,50,.06) 0 3px, transparent 3px 7px),
            ${base}`;
  });
}
