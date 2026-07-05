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

  wind(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.7;

    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      const p = i / frames;
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * p);
    });

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
    lp.frequency.linearRampToValueAtTime(380, t + dur);
    lp.Q.value = 4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }

  /** Cosy rainfall — a soft filtered wash with a few scattered droplet plinks. */
  rain(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 2.4;

    // steady rain wash: filtered noise fading in and out
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      data[i] = Math.random() * 2 - 1;
    });

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.Q.value = 0.6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.5);
    g.gain.setValueAtTime(0.13, t + dur - 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(hp).connect(lp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);

    // a handful of gentle droplet plinks scattered through the shower
    const drops = 7;
    for (let i = 0; i < drops; i++) {
      const start = t + 0.3 + (i / drops) * (dur - 0.8) + Math.random() * 0.12;
      const freq = 1400 + Math.random() * 1600;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, start + 0.05);

      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0.0001, start);
      dg.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.02, start + 0.005);
      dg.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);

      osc.connect(dg).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.09);
    }
  }

  /** Sweet lemonade break — icy clinks over a soft fizzy sparkle. */
  lemonade(): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 1.3;

    // soft fizz: high, sparse noise crackle that settles like carbonation
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    data.forEach((_, i) => {
      const p = i / frames;
      const pop = Math.random() < 0.25 ? 1 : 0.15;
      data[i] = (Math.random() * 2 - 1) * pop * Math.exp(-1.6 * p);
    });

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4500;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(hp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);

    // a few bright glassy clinks — ice cubes settling in the glass
    const clinks = [0, 0.14, 0.33];
    clinks.forEach((offset, i) => {
      const start = t + offset;
      const freq = 2100 + i * 380 + Math.random() * 120;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // a faint overtone gives the clink a glassy ring
      const ring = ctx.createOscillator();
      ring.type = 'sine';
      ring.frequency.value = freq * 2.76;

      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.0001, start);
      cg.gain.exponentialRampToValueAtTime(0.12, start + 0.004);
      cg.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0.0001, start);
      rg.gain.exponentialRampToValueAtTime(0.04, start + 0.004);
      rg.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      osc.connect(cg).connect(ctx.destination);
      ring.connect(rg).connect(ctx.destination);
      osc.start(start);
      ring.start(start);
      osc.stop(start + 0.24);
      ring.stop(start + 0.24);
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
