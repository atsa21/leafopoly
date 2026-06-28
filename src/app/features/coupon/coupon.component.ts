import { Component, inject, computed, signal } from '@angular/core';
import { GameService } from '@core/services/game.service';
import { SoundService } from '@core/services/sound.service';

type Point = [number, number];

const W = 300;
const H = 178;

const SEG = [W, H, W, H];
const PERIM = SEG[0] + SEG[1] + SEG[2] + SEG[3];
const BOUNDS = [SEG[0], SEG[0] + SEG[1], SEG[0] + SEG[1] + SEG[2], PERIM];
const REACH = 130;

@Component({
  selector: 'app-coupon',
  templateUrl: './coupon.component.html',
  styleUrl: './coupon.component.scss',
})
export class CouponComponent {
  game = inject(GameService);
  private sound = inject(SoundService);

  dragging = signal(false);
  private progress = signal(0);

  scissors = computed<Point>(() => this.pointAt(this.progress()));
  fills = computed(() => {
    const d = this.progress();
    return {
      top: this.frac(d, 0, SEG[0]),
      right: this.frac(d, BOUNDS[0], SEG[1]),
      bottom: this.frac(d, BOUNDS[1], SEG[2]),
      left: this.frac(d, BOUNDS[2], SEG[3]),
    };
  });

  onDown(e: PointerEvent) {
    if (this.game.couponDone()) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.dragging.set(true);
    this.track(e);
  }

  onMove(e: PointerEvent) {
    if (this.dragging()) this.track(e);
  }

  // iOS Safari doesn't always honor `touch-action: none` mid-gesture, so cancel
  // the native scroll explicitly while the scissors are being dragged.
  onTouchMove(e: TouchEvent) {
    if (this.dragging()) e.preventDefault();
  }

  onUp() {
    this.dragging.set(false);
  }

  onClick(e: MouseEvent) {
    if (e.detail !== 0) return;
    const next = BOUNDS.find((b) => b > this.progress() + 0.5) ?? PERIM;
    this.advance(next);
  }

  private track(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;

    const cur = this.progress();
    let arc = this.project(x, y, cur);
    if (arc >= PERIM - 16) arc = PERIM;
    if (arc > cur) this.advance(Math.min(arc, cur + REACH));
  }

  private advance(next: number) {
    if (next <= this.progress()) return;
    this.progress.set(Math.min(next, PERIM));

    let crossed = 0;
    for (const b of BOUNDS) if (this.progress() >= b - 0.5) crossed++;
    while (this.game.cutStep() < crossed) this.snip();
  }

  private snip() {
    const before = this.game.cutStep();
    this.game.cut();
    if (this.game.cutStep() > before) this.sound.scissors(this.game.cutStep() >= 4);
  }

  private frac(d: number, start: number, len: number): number {
    return Math.max(0, Math.min(1, (d - start) / len));
  }

  private pointAt(d: number): Point {
    if (d <= SEG[0]) return [d, 0];
    d -= SEG[0];
    if (d <= SEG[1]) return [W, d];
    d -= SEG[1];
    if (d <= SEG[2]) return [W - d, H];
    d -= SEG[2];
    return [0, H - d];
  }

  private project(x: number, y: number, cur: number): number {
    const cx = Math.max(0, Math.min(W, x));
    const cy = Math.max(0, Math.min(H, y));
    const dist = [
      Math.hypot(x - cx, y), // top
      Math.hypot(x - W, y - cy), // right
      Math.hypot(x - cx, y - H), // bottom
      Math.hypot(x, y - cy), // left
    ];
    const arc = [cx, BOUNDS[0] + cy, BOUNDS[1] + (W - cx), BOUNDS[2] + (H - cy)];
    dist[this.segOf(cur)] -= 8;

    let best = 0;
    for (let i = 1; i < 4; i++) if (dist[i] < dist[best]) best = i;
    return arc[best];
  }

  private segOf(d: number): number {
    if (d < BOUNDS[0]) return 0;
    if (d < BOUNDS[1]) return 1;
    if (d < BOUNDS[2]) return 2;
    return 3;
  }
}
