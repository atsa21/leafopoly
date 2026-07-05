import { Routes } from '@angular/router';
import { startedGuard } from '@core/guards/started.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/start/start.component').then((m) => m.StartComponent),
  },
  {
    path: 'game',
    canActivate: [startedGuard],
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  { path: '**', redirectTo: '' },
];
