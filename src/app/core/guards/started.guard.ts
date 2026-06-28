import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '@core/services/game.service';

export const startedGuard: CanActivateFn = (route) => {
  const game = inject(GameService);
  const router = inject(Router);

  const matchId = route.queryParamMap.get('m');
  if (matchId && !game.online()) {
    game.joinRoom(matchId);
  }

  return game.started() ? true : router.createUrlTree(['/start']);
};
