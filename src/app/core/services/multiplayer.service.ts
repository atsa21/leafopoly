import { Service, signal } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore, Unsubscribe } from 'firebase/firestore';
import { firebaseConfig, firebaseReady } from '../firebase.config';
import { Player } from '../models';

/** The shared truth for a match — everything else (open modals, drag state) is local. */
export interface MatchSnapshot {
  players: Player[];
  current: number;
  dice: number;
  log: string[];
  seq: number; // monotonic; the higher snapshot wins
  by: number; // slot that wrote this snapshot
  joined?: boolean; // joiner sets this so the host knows a peer connected
}

export type MatchState = Omit<MatchSnapshot, 'seq' | 'by' | 'joined'>;
export type ConnStatus = 'idle' | 'hosting' | 'joining' | 'connected' | 'error';

/** Ephemeral turn event so the watching player can replay the tumble + walk (or a skip). */
export interface RollAnim {
  n: number;
  slot: number; 
  nonce: number;
  skip?: boolean;
}

@Service()
export class MultiplayerService {
  online = signal(false);
  matchId = signal<string | null>(null);
  mySlot = signal(0);
  status = signal<ConnStatus>('idle');
  peerJoined = signal(false);

  /** Set by GameService to apply incoming snapshots from the other player. */
  onRemote: ((snap: MatchSnapshot) => void) | null = null;
  /** Set by GameService to replay the other player's roll animation. */
  onAnim: ((anim: RollAnim) => void) | null = null;

  private db: Firestore | null = null;
  private fs: typeof import('firebase/firestore') | null = null;
  private unsub: Unsubscribe | null = null;
  private seq = 0;
  private animCounter = 0;
  private lastAnimNonce = -1;
  private gen = 0;

  get available(): boolean {
    return firebaseReady();
  }

  async host(state: MatchState): Promise<string> {
    const id = this.genId();
    this.matchId.set(id);
    this.mySlot.set(0);
    this.online.set(true);
    this.status.set('hosting');
    this.seq = 1;
    const { db, fs } = await this.ensure();
    await fs.setDoc(fs.doc(db, 'matches', id), { ...state, seq: 1, by: 0 } satisfies MatchSnapshot);
    this.listen(id);
    return id;
  }

  join(id: string): void {
    this.matchId.set(id);
    this.mySlot.set(1);
    this.online.set(true);
    this.status.set('joining');
    this.listen(id);
  }

  reconnect(id: string, slot: number): void {
    this.matchId.set(id);
    this.mySlot.set(slot);
    this.online.set(true);
    this.status.set(slot === 0 ? 'connected' : 'joining');
    this.seq = 0;
    this.listen(id);
  }

  async push(state: MatchState): Promise<void> {
    const id = this.matchId();
    if (!this.online() || !id) return;
    this.seq += 1;
    const { db, fs } = await this.ensure();
    await fs.setDoc(fs.doc(db, 'matches', id), { ...state, seq: this.seq, by: this.mySlot() } satisfies MatchSnapshot);
  }

  /** Broadcast a roll result on a side channel (does not touch authoritative state). */
  async pushAnim(roll: Omit<RollAnim, 'nonce'>): Promise<void> {
    const id = this.matchId();
    if (!this.online() || !id) return;
    // slot-prefixed so the two players' nonces never collide and always rise.
    const nonce = this.mySlot() * 1_000_000 + ++this.animCounter;
    const { db, fs } = await this.ensure();
    await fs.updateDoc(fs.doc(db, 'matches', id), { anim: { ...roll, nonce } });
  }

  leave(): void {
    this.gen++; // invalidate any in-flight listen()
    this.unsub?.();
    this.unsub = null;
    this.online.set(false);
    this.matchId.set(null);
    this.status.set('idle');
    this.peerJoined.set(false);
    this.seq = 0;
    this.lastAnimNonce = -1;
  }

  private async listen(id: string): Promise<void> {
    this.unsub?.();
    this.unsub = null;
    const myGen = ++this.gen;
    const { db, fs } = await this.ensure();
    if (this.gen !== myGen) return;

    const ref = fs.doc(db, 'matches', id);
    this.unsub = fs.onSnapshot(ref, (d) => {
      const data = d.data() as MatchSnapshot | undefined;
      if (!data) return;

      if (this.status() === 'joining') {
        this.status.set('connected');
        fs.updateDoc(ref, { joined: true }).catch(() => {});
      }
      if (this.mySlot() === 0 && data.joined) {
        this.peerJoined.set(true);
        if (this.status() === 'hosting') this.status.set('connected');
      }

      // Replay the other player's roll (side channel, doesn't bump seq).
      const anim = (data as MatchSnapshot & { anim?: RollAnim }).anim;
      if (anim && anim.nonce !== this.lastAnimNonce && anim.slot !== this.mySlot()) {
        this.lastAnimNonce = anim.nonce;
        this.onAnim?.(anim);
      }

      // Only adopt snapshots newer than ours; our own writes are ignored.
      if (data.seq > this.seq) {
        this.seq = data.seq;
        this.onRemote?.(data);
      }
    }, () => this.status.set('error'));
  }


  private async ensure(): Promise<{ db: Firestore; fs: typeof import('firebase/firestore') }> {
    if (!this.db || !this.fs) {
      const [{ getApps, initializeApp }, fs] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ]);
      const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      this.db = fs.getFirestore(app);
      this.fs = fs;
    }
    return { db: this.db, fs: this.fs };
  }

  private genId(): string {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  }
}
