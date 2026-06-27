import { Service, signal, computed, inject, afterNextRender } from '@angular/core';
import { Player, View, TableColor, RoomItem } from '../models';
import { EShopCategory } from '../enums';
import { ITEMS, LUCKY_ITEMS, ITEM_CATEGORY, CATEGORY_GOAL, buildBoard } from '../constants';
import { MatchSnapshot, MultiplayerService, RollAnim } from './multiplayer.service';
import { SoundService } from './sound.service';

const SAVE_KEY = 'leafopoly_v2';
const SETTINGS_KEY = 'leafopoly_settings_v1';

const DEFAULT_NAMES = ['Robin', 'Sage'];
const PLAYER_COLORS = ['#b0473b', '#36617e'];

@Service()
export class GameService {
  private mp = inject(MultiplayerService);
  private sound = inject(SoundService);
  private applying = false;

  startingLeaves = signal(50);
  passGoBonus = signal(10);
  playerNames = signal<string[]>([...DEFAULT_NAMES]);
  tableColor = signal<TableColor>('slate');

  board = computed(() => buildBoard(this.passGoBonus()));

  started = signal(false);
  mode = signal<'solo' | 'multi' | null>(null);
  inviteLink = signal('');
  hasSave = signal(false);

  players = signal<Player[]>([]);
  current = signal(0);
  view = signal<View>('board');
  dice = signal(1);
  rolling = signal(false);
  toastMsg = signal('');
  log = signal<string[]>([]);
  leafGain = signal<{ slot: number; amount: number; id: number } | null>(null);
  leafLoss = signal<{ slot: number; amount: number; id: number } | null>(null);

  activeShop = signal<EShopCategory | null>(null);
  cutStep = signal(0);
  couponVal = signal(0);
  couponDone = signal(false);
  roomOwner = signal(0);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private leafTimer: ReturnType<typeof setTimeout> | undefined;
  private leafGainId = 0;
  private leafLossTimer: ReturnType<typeof setTimeout> | undefined;
  private leafLossId = 0;

  private savedMode: 'solo' | 'multi' | null = null;
  private savedMatchId: string | null = null;
  private savedSlot = 0;

  constructor() {
    this.players.set(this.freshPlayers());
    this.mp.onRemote = (s) => this.applyRemote(s);
    this.mp.onAnim = (a) => this.playWatch(a);

    afterNextRender(() => {
      this.loadSettings();
      const saved = this.load();
      if (saved) {
        this.players.set(saved);
        this.hasSave.set(true);
      } else {
        this.players.set(this.freshPlayers());
      }
    });
  }

  cur = computed(() => this.players()[this.current()]);
  isMyTurn = computed(() => !this.mp.online() || this.current() === this.mp.mySlot());
  canEditRoom = computed(() => !this.mp.online() || this.roomOwner() === this.mp.mySlot());
  online = computed(() => this.mp.online());
  mySlot = computed(() => this.mp.mySlot());
  dicePips = computed(() => {
    const m: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const set = new Set(m[this.dice()] ?? []);
    return Array.from({ length: 9 }, (_, i) => set.has(i));
  });

  readonly categoryGoal = CATEGORY_GOAL;

  categoryTally(p: Player): Record<EShopCategory, number> {
    const tally = {
      [EShopCategory.Furniture]: 0,
      [EShopCategory.Decor]: 0,
      [EShopCategory.Room]: 0,
      [EShopCategory.Pet]: 0,
      [EShopCategory.Other]: 0,
    };
    for (const item of p.room) {
      const cat = ITEM_CATEGORY[item.key];
      if (cat) tally[cat]++;
    }
    return tally;
  }

  winner = computed<number | null>(() => {
    const players = this.players();
    const cats = Object.values(EShopCategory);
    for (let i = 0; i < players.length; i++) {
      const tally = this.categoryTally(players[i]);
      if (cats.every((c) => tally[c] >= this.categoryGoal)) return i;
    }
    return null;
  });

  private soloName(): string {
    return this.playerNames()[0]?.trim() || DEFAULT_NAMES[0];
  }

  private beginFresh(names: string[]): void {
    clearTimeout(this.timer);
    clearTimeout(this.toastTimer);
    this.players.set(this.freshPlayers(names));
    this.current.set(0);
    this.view.set('board');
    this.dice.set(1);
    this.rolling.set(false);
    this.toastMsg.set('');
    this.log.set([]);
  }

  startSolo(): void {
    this.mp.leave();
    this.inviteLink.set('');
    this.mode.set('solo');
    this.beginFresh([this.soloName()]);
    this.save();
    this.started.set(true);
  }

  async createRoom(): Promise<string> {
    this.mode.set('multi');
    this.beginFresh(this.playerNames());
    const id = await this.hostMatch();
    const { origin, pathname } = window.location;
    this.inviteLink.set(`${origin}${pathname}?m=${id}`);
    this.save();
    return id;
  }

  joinRoom(id: string): void {
    this.mode.set('multi');
    this.beginFresh(this.playerNames());
    this.joinMatch(id);
    this.started.set(true);
  }

  enterGame(): void {
    this.started.set(true);
  }

  resume(): void {
    if (this.savedMode === 'multi' && this.savedMatchId) {
      this.mode.set('multi');
      this.mp.reconnect(this.savedMatchId, this.savedSlot);
    } else {
      this.mode.set('solo');
    }
    this.started.set(true);
  }

  private freshPlayers(names: string[] = this.playerNames()): Player[] {
    return names.map((name, i) => ({
      name,
      color: PLAYER_COLORS[i] ?? '#5d7d39',
      init: (name.trim()[0] ?? '?').toUpperCase(),
      leaves: this.startingLeaves(),
      pos: 0,
      coupons: [],
      room: [],
      skip: false,
    }));
  }

  private load(): Player[] | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as {
        players?: unknown;
        current?: unknown;
        dice?: unknown;
        log?: unknown;
        mode?: unknown;
        matchId?: unknown;
        slot?: unknown;
      };
      if (!Array.isArray(s.players)) return null;
      this.current.set(Number.isInteger(s.current) ? (s.current as number) : 0);
      this.dice.set((s.dice as number) || 1);
      this.log.set(Array.isArray(s.log) ? (s.log as string[]) : []);
      this.savedMode = s.mode === 'multi' ? 'multi' : 'solo';
      this.savedMatchId = typeof s.matchId === 'string' ? s.matchId : null;
      this.savedSlot = s.slot === 1 ? 1 : 0;
      // merge so older saves gain newer fields
      return (s.players as Array<Partial<Player>>).map((p) => ({
        coupons: [],
        room: [],
        skip: false,
        leaves: 0,
        pos: 0,
        ...p,
      })) as Player[];
    } catch {
      return null;
    }
  }

  private save() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          players: this.players(),
          current: this.current(),
          dice: this.dice(),
          log: this.log(),
          mode: this.mode(),
          matchId: this.mp.matchId(),
          slot: this.mp.mySlot(),
        }),
      );
    } catch {}
  }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as {
        startingLeaves?: unknown;
        passGoBonus?: unknown;
        playerNames?: unknown;
      };
      if (Number.isFinite(s.startingLeaves)) this.startingLeaves.set(s.startingLeaves as number);
      if (Number.isFinite(s.passGoBonus)) this.passGoBonus.set(s.passGoBonus as number);
      if (Array.isArray(s.playerNames) && s.playerNames.length) {
        this.playerNames.set(
          DEFAULT_NAMES.map((d, i) => {
            const n = s.playerNames as unknown[];
            return typeof n[i] === 'string' && (n[i] as string).trim() ? (n[i] as string) : d;
          }),
        );
      }
    } catch {}
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          startingLeaves: this.startingLeaves(),
          passGoBonus: this.passGoBonus(),
          playerNames: this.playerNames(),
        }),
      );
    } catch {}
  }

  openSettings() {
    this.view.set('settings');
  }

  closeSettings() {
    this.view.set('board');
  }
  applySettings(s: { name: string; startingLeaves: number; passGoBonus: number }) {
    const slot = this.mySlot();
    const name = s.name.trim() || DEFAULT_NAMES[slot] || 'Player';
    this.playerNames.update((names) => {
      const next = [...names];
      next[slot] = name;
      return next;
    });
    this.startingLeaves.set(Math.max(0, Math.round(s.startingLeaves) || 0));
    this.passGoBonus.set(Math.max(0, Math.round(s.passGoBonus) || 0));
    this.saveSettings();

    this.players.update((list) =>
      list.map((p, i) =>
        i === slot ? { ...p, name, init: (name[0] ?? '?').toUpperCase() } : p,
      ),
    );
    this.save();
    this.sync();
  }

  newGame() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {}
    this.hasSave.set(false);
    this.beginFresh(this.mode() === 'solo' ? [this.soloName()] : this.playerNames());
    this.sync();
  }

  private patchCurrent(fn: (p: Player) => Player) {
    this.players.update((list) => list.map((p, i) => (i === this.current() ? fn({ ...p }) : p)));
    this.save();
  }

  /** Plays the leaf chime and fires a floating "+N" burst over the player's leaf count. */
  private gainLeaves(slot: number, amount: number) {
    if (amount <= 0) return;
    this.sound.leaves();
    this.leafGain.set({ slot, amount, id: ++this.leafGainId });
    clearTimeout(this.leafTimer);
    this.leafTimer = setTimeout(() => this.leafGain.set(null), 1400);
  }

  private loseLeaves(slot: number, amount: number) {
    if (amount <= 0) return;
    this.sound.wind();
    this.leafLoss.set({ slot, amount, id: ++this.leafLossId });
    clearTimeout(this.leafLossTimer);
    this.leafLossTimer = setTimeout(() => this.leafLoss.set(null), 1400);
  }

  private toast(msg: string) {
    clearTimeout(this.toastTimer);
    const name = this.cur().name;
    this.toastMsg.set(msg);
    this.log.update((l) => [name + ': ' + msg, ...l].slice(0, 7));
    this.save();
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2900);
  }

  private watchToast(msg: string) {
    clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastTimer = setTimeout(() => this.toastMsg.set(''), 2900);
  }

  roll() {
    if (this.winner() !== null) {
      return;
    }
    if (this.rolling() || this.view() !== 'board' || !this.isMyTurn()) return;
    if (this.cur().skip) {
      this.mp.pushAnim({ n: 0, slot: this.current(), skip: true });
      this.patchCurrent((p) => ({ ...p, skip: false }));
      this.toast('skips this turn.');
      return this.endTurn();
    }

    const n = 1 + Math.floor(Math.random() * 6);
    this.mp.pushAnim({ n, slot: this.current() });
    this.rattle(n, () => this.walk(n));
  }

  private rattle(final: number, done: () => void) {
    this.rolling.set(true);
    this.toastMsg.set('');
    this.sound.dice();
    let ticks = 0;
    const tick = () => {
      this.dice.set(1 + Math.floor(Math.random() * 6));
      if (++ticks < 8) {
        this.timer = setTimeout(tick, 70);
      } else {
        this.dice.set(final);
        this.timer = setTimeout(done, 360);
      }
    };
    tick();
  }

  private walk(n: number) {
    let steps = n;
    const step = () => {
      let bonus = 0;
      this.patchCurrent((p) => {
        const pos = (p.pos + 1) % 24;
        if (pos === 0) bonus = this.passGoBonus();
        return { ...p, pos, leaves: p.leaves + bonus };
      });
      this.sound.step();
      if (bonus) this.gainLeaves(this.current(), bonus);
      if (--steps > 0) this.timer = setTimeout(step, 230);
      else this.timer = setTimeout(() => this.land(), 340);
    };
    step();
  }

  private playWatch(a: RollAnim) {
    clearTimeout(this.timer);
    if (a.skip) {
      const name = this.players()[a.slot]?.name ?? 'They';
      this.watchToast(name + ' skips this turn.');
      return;
    }
    this.rattle(a.n, () => {
      let steps = a.n;
      const slot = a.slot;
      const step = () => {
        this.players.update((list) =>
          list.map((p, i) => (i === slot ? { ...p, pos: (p.pos + 1) % 24 } : p)),
        );
        this.sound.step();
        if (--steps > 0) this.timer = setTimeout(step, 230);
        else this.rolling.set(false);
      };
      step();
    });
  }

  private land() {
    this.rolling.set(false);
    const sq = this.board()[this.cur().pos];
    if (sq.kind === 'shop') {
      this.activeShop.set(sq.shop!);
      this.view.set('shop');
    } else if (sq.kind === 'coupon') {
      this.cutStep.set(0);
      this.couponDone.set(false);
      this.couponVal.set([25, 30, 50][Math.floor(Math.random() * 3)]);
      this.view.set('coupon');
    } else if (sq.kind === 'start') {
      this.toast('home at START — collect ' + this.passGoBonus() + '.');
      this.endTurn();
    } else if (sq.kind === 'luckyfind') {
      const key = LUCKY_ITEMS[Math.floor(Math.random() * LUCKY_ITEMS.length)];
      this.patchCurrent((p) => ({ ...p, room: [...p.room, this.newRoomItem(key)] }));
      this.toast('lucky find — a free ' + ITEMS[key].name + ' for your room!');
      this.endTurn();
    } else {
      const d = sq.delta || 0;
      if (d || sq.skip)
        this.patchCurrent((p) => ({
          ...p,
          leaves: Math.max(0, p.leaves + d),
          skip: sq.skip ? true : p.skip,
        }));
      if (d > 0) this.gainLeaves(this.current(), d);
      else if (d < 0) this.loseLeaves(this.current(), -d);
      this.toast(sq.msg || 'a quiet square.');
      this.endTurn();
    }
  }

  private endTurn() {
    this.current.update((c) => (c + 1) % this.players().length);
    this.view.set('board');
    this.save();
    this.sync();
  }

  hostMatch(): Promise<string> {
    return this.mp.host(this.snapshot());
  }

  joinMatch(id: string) {
    this.mp.join(id);
  }

  private snapshot() {
    return {
      players: this.players(),
      current: this.current(),
      dice: this.dice(),
      log: this.log(),
    };
  }

  private sync() {
    if (this.mp.online() && !this.applying) this.mp.push(this.snapshot());
  }

  private applyRemote(s: MatchSnapshot) {
    this.applying = true;
    clearTimeout(this.timer);
    this.players.set(s.players);
    this.current.set(s.current);
    this.dice.set(s.dice);
    this.log.set(s.log ?? []);
    this.rolling.set(false);
    this.view.set('board');
    this.applying = false;
    this.save();
  }

  private newRoomItem(key: string): RoomItem {
    const id = 'it' + Date.now() + Math.floor(Math.random() * 999);

    if (key === 'rug') {
      return { id, key, x: 250 + Math.round(Math.random() * 80), y: 340, rot: 0 };
    }
    if (key === 'lamp') {
      return { id, key, x: 120 + Math.round(Math.random() * 420), y: 320, rot: 0 };
    }

    return {
      id,
      key,
      x: 140 + Math.random() * 360,
      y: 150 + Math.random() * 200,
      rot: Math.round(Math.random() * 16 - 8),
    };
  }

  buy(key: string) {
    const it = ITEMS[key];
    const p = this.cur();
    const price = p.coupons.length
      ? Math.max(1, Math.round(it.price * (1 - p.coupons[0] / 100)))
      : it.price;
    if (p.leaves < price) return this.toast('not enough leaves for that.');

    let used = false;
    this.patchCurrent((pl) => {
      const coupons = [...pl.coupons];
      if (coupons.length) {
        coupons.shift();
        used = true;
      }
      const room = [...pl.room, this.newRoomItem(key)];
      return { ...pl, leaves: pl.leaves - price, coupons, room };
    });
    this.toast('bought ' + it.name + (used ? ' (coupon used!)' : '') + ' — it’s in the room.');
    this.endTurn();
  }

  leaveShop() {
    this.toast('left empty-handed.');
    this.endTurn();
  }

  cut() {
    if (this.view() !== 'coupon' || this.couponDone() || this.cutStep() >= 4) return;
    const ns = this.cutStep() + 1;
    this.cutStep.set(ns);
    if (ns >= 4) this.timer = setTimeout(() => this.couponDone.set(true), 280);
  }

  collectCoupon() {
    const v = this.couponVal();
    this.patchCurrent((p) => ({ ...p, coupons: [...p.coupons, v] }));
    this.toast('snipped a ' + v + '% coupon!');
    this.endTurn();
  }

  openRoom(idx: number) {
    this.roomOwner.set(idx);
    this.view.set('room');
  }

  closeRoom() {
    this.view.set('board');
  }

  moveItem(id: string, x: number, y: number) {
    this.players.update((list) =>
      list.map((p, i) =>
        i !== this.roomOwner() ? p : { ...p, room: p.room.map((r) => (r.id === id ? { ...r, x, y } : r)) },
      ),
    );
  }

  commitRoom() {
    this.save();
    this.sync();
  }

  bringToFront(id: string) {
    this.players.update((list) =>
      list.map((p, i) => {
        if (i !== this.roomOwner()) return p;
        const item = p.room.find((r) => r.id === id);
        if (!item || p.room[p.room.length - 1]?.id === id) return p;
        return { ...p, room: [...p.room.filter((r) => r.id !== id), item] };
      }),
    );
    this.save();
  }
}
