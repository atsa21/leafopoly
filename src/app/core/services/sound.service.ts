import { Service, signal } from '@angular/core';

@Service()
export class SoundService {
  private ctx?: AudioContext;

  readonly muted = signal(false);

  toggleMute(): void {
    this.muted.update((m) => !m);
  }

  private audio(): AudioContext | undefined {
    if (this.muted()) return undefined;
    if (typeof window === 'undefined') return undefined;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return undefined;
    this.ctx ??= new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  scissors(free = false) {
    const ctx = this.audio();
    if (!ctx) return;
    this.snip(ctx, ctx.currentTime, free);
  }

  step(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;

    const dur = 0.045;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 5);
    });

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 1.2;

    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.32, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(bp).connect(ng).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }

  leaves(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.5;

    // dry, papery noise — the rustle of a handful of leaves pulled off a tree
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      const p = i / frames;
      // two soft swells so it reads as a grab-and-release rustle, not one hiss
      const env = (Math.exp(-12 * p) + 0.6 * Math.exp(-7 * Math.abs(p - 0.4))) * (1 - p);
      // sparse grains crinkle the noise into many tiny leaf flutters
      const crinkle = Math.random() < 0.55 ? 1 : 0.2;
      data[i] = (Math.random() * 2 - 1) * env * crinkle;
    });

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    // trim rumble, then a moving bandpass for the brittle leafy texture
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(4200, t);
    bp.frequency.linearRampToValueAtTime(6200, t + dur);
    bp.Q.value = 0.8;

    // the rustle sits quietly underneath the melodic shimmer
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(hp).connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);

    // warm pentatonic shimmer on top for a cozy, rewarding vibe
    const notes = [659.25, 880, 1318.5]; // E5, A5, E6
    notes.forEach((freq, i) => {
      const start = t + i * 0.08;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // a faintly detuned twin gives the note a soft, glistening shimmer
      const shimmer = ctx.createOscillator();
      shimmer.type = 'triangle';
      shimmer.frequency.value = freq * 1.004;

      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, start);
      ng.gain.exponentialRampToValueAtTime(0.055, start + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

      osc.connect(ng);
      shimmer.connect(ng);
      ng.connect(ctx.destination);
      osc.start(start);
      shimmer.start(start);
      osc.stop(start + 0.46);
      shimmer.stop(start + 0.46);
    });
  }

  pickUp(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(760, t + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  meow(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.5;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    // "me-ow" pitch arc: rise then fall
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(780, t + 0.16);
    osc.frequency.linearRampToValueAtTime(430, t + dur);

    // gentle vibrato for a cat-like warble
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain).connect(osc.frequency);

    // formant sweep "ee" -> "ow"
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 5;
    bp.frequency.setValueAtTime(1900, t);
    bp.frequency.linearRampToValueAtTime(900, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    g.gain.setValueAtTime(0.22, t + dur - 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(bp).connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
  }

  woof(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.18;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(90, t + dur);

    // formant sweep "w" -> "oof"
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.linearRampToValueAtTime(500, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(bp).connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  dice(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    const offsets = [0, 0.06, 0.13, 0.21, 0.31, 0.43, 0.57];
    offsets.forEach((offset, i) => {
      this.knock(ctx, t0 + offset, 220 - i * 14, 0.5 - i * 0.05);
    });
  }

  private knock(ctx: AudioContext, start: number, freq: number, gain: number): void {
    const dur = 0.05;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 4);
    });

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

  private snip(ctx: AudioContext, t: number, free: boolean): void {
    const dur = free ? 0.16 : 0.085;

    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
    });

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
