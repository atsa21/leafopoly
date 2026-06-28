import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { MultiplayerService, MatchSnapshot } from './multiplayer.service';
import { Player } from '../models';

function player(over: Partial<Player> = {}): Player {
  return {
    name: 'P',
    color: '#000',
    init: 'P',
    leaves: 50,
    pos: 0,
    coupons: [],
    room: [],
    skip: false,
    ...over,
  };
}

function snapshot(over: Partial<MatchSnapshot> = {}): MatchSnapshot {
  return {
    players: [player(), player()],
    current: 0,
    dice: 1,
    log: [],
    seq: 1,
    by: 0,
    ...over,
  };
}

describe('GameService.applyRemote', () => {
  let game: GameService;
  let mp: MultiplayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    game = TestBed.inject(GameService);
    mp = TestBed.inject(MultiplayerService);
  });

  it('ignores an out-of-turn remote snapshot during my turn so it cannot close my shop or rewind my move', () => {
    // I am slot 0 and it is my turn; I have rolled, walked to pos 5 and opened the shop.
    mp.online.set(true);
    mp.mySlot.set(0);
    game.current.set(0);
    game.players.set([
      player({ name: 'Me', pos: 5 }),
      player({ name: 'Them', room: [] }),
    ]);
    game.view.set('shop');
    game.dice.set(6);

    // The other player rearranges their room and pushes a full snapshot. It carries
    // my *pre-roll* state (pos 0) because I haven't synced since rolling.
    mp.onRemote!(
      snapshot({
        current: 0,
        dice: 1,
        players: [
          player({ name: 'Me', pos: 0 }),
          player({ name: 'Them', room: [{ id: 'a', key: 'lamp', x: 10, y: 20, rot: 0 }] }),
        ],
      }),
    );

    // My own state is preserved...
    expect(game.players()[0].pos).toBe(5);
    expect(game.view()).toBe('shop');
    expect(game.dice()).toBe(6);
    expect(game.current()).toBe(0);
    // ...but the other player's room edit is adopted.
    expect(game.players()[1].room).toHaveLength(1);
    expect(game.players()[1].room[0].id).toBe('a');
  });

  it('fully applies a turn-handoff snapshot that arrives while it is still the opponent turn locally', () => {
    // I am slot 0; locally it is the opponent's turn (current = 1).
    mp.online.set(true);
    mp.mySlot.set(0);
    game.current.set(1);
    game.view.set('board');
    game.players.set([player({ name: 'Me', pos: 3 }), player({ name: 'Them', pos: 8 })]);

    // Opponent ends their turn: snapshot hands the turn to me (current = 0).
    mp.onRemote!(
      snapshot({
        current: 0,
        dice: 4,
        players: [player({ name: 'Me', pos: 3 }), player({ name: 'Them', pos: 12 })],
      }),
    );

    expect(game.current()).toBe(0);
    expect(game.dice()).toBe(4);
    expect(game.view()).toBe('board');
    expect(game.players()[1].pos).toBe(12);
  });
});
