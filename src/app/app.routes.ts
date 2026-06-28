import { Routes } from '@angular/router';
import { startedGuard } from '@core/guards/started.guard';

export const routes: Routes = [
  {
    path: 'start',
    loadComponent: () =>
      import('./features/start/start.component').then((m) => m.StartComponent),
  },
  {
    path: '',
    canActivate: [startedGuard],
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  { path: '**', redirectTo: '' },
];
