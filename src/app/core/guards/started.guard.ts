import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '@core/services/game.service';

export const startedGuard: CanActivateFn = (route) => {
  const game = inject(GameService);
  const router = inject(Router);

  // The game state lives in localStorage, which doesn't exist on the server.
  // Let the route render during SSR; the guard re-runs on the client after
  // hydration, where it can read the save and make the real decision.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  // Pick up a saved game synchronously so a reload on `/game` can resume it.
  game.ensureLoaded();

  // A room code in the query means "start a new multiplayer game" — join it.
  const matchId = route.queryParamMap.get('code');
  if (matchId && !game.online()) {
    game.joinRoom(matchId);
  }

  if (game.started()) return true;

  // A saved game means the player can pick up where they left off — resume it
  // instead of bouncing them back to the start screen.
  if (game.hasSave()) {
    game.resume();
    return true;
  }

  return router.createUrlTree(['']);
};
