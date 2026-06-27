import { Service } from '@angular/core';

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
