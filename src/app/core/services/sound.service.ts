import { Service } from '@angular/core';

/**
 * Tiny Web Audio helper for UI sound effects. Sounds are synthesised at
 * runtime, so there are no audio assets to ship. The AudioContext is created
 * lazily on first use — that keeps it browser-only (SSR-safe) and satisfies
 * the "resume after a user gesture" autoplay policy, since every call here
 * originates from a click.
 */
@Service()
export class SoundService {
  private ctx?: AudioContext;

  private audio(): AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return undefined;
    this.ctx ??= new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /**
   * One scissor cut through the coupon. Pass `free = true` for the final cut,
   * when the coupon comes loose — that gives a fuller, lower paper tear.
   */
  scissors(free = false) {
    const ctx = this.audio();
    if (!ctx) return;
    this.snip(ctx, ctx.currentTime, free);
  }

  /** A tumbling die: a scatter of small wooden knocks over ~0.6s. */
  dice() {
    const ctx = this.audio();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // Knocks bunch up then thin out, like a die losing momentum before it settles.
    const offsets = [0, 0.06, 0.13, 0.21, 0.31, 0.43, 0.57];
    for (let i = 0; i < offsets.length; i++) {
      // Each later knock is a little quieter and lower — the die running out of bounce.
      this.knock(ctx, t0 + offsets[i], 220 - i * 14, 0.5 - i * 0.05);
    }
  }

  /** One wooden tap: a brief burst of low-passed noise with a fast decay. */
  private knock(ctx: AudioContext, start: number, freq: number, gain: number) {
    const dur = 0.05;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 4);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = freq * 8;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(Math.max(0.05, gain), start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(low).connect(amp).connect(ctx.destination);
    src.start(start);
    src.stop(start + dur);
  }

  /**
   * One scissor snip: a quick decaying burst of high-passed noise (the paper
   * shear) layered with a short downward chirp (the blades closing). A `free`
   * snip is a touch longer and lower — the fuller tear as the coupon releases.
   */
  private snip(ctx: AudioContext, t: number, free: boolean) {
    const dur = free ? 0.16 : 0.085;

    // --- the paper shear: a quick decaying burst of noise ---
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = free ? 900 : 1500;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = free ? 2400 : 3300;
    bp.Q.value = 0.7;

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(free ? 0.42 : 0.5, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(hp).connect(bp).connect(ng).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);

    // --- the blades closing: a short downward square chirp ---
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2700, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.03);

    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.07, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(og).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}
