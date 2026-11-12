import { useProfile } from "@/store/profile";

/**
 * Sound effects synthesized with the Web Audio API: no audio files to ship, and every sound
 * is slightly varied so repeated actions never feel mechanical.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (useProfile.getState().muted) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    // A touch of compression keeps stacked sounds from clipping.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    master.connect(comp).connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: master! };
}

const vary = (value: number, amount = 0.06) => value * (1 + (Math.random() * 2 - 1) * amount);

function noise(c: AudioContext, out: AudioNode, at: number, duration: number, filter: BiquadFilterType, freq: number, q: number, gain: number, sweepTo?: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, at);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, at + duration);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  src.connect(f).connect(g).connect(out);
  src.start(at, Math.random() * 0.5);
  src.stop(at + duration + 0.02);
}

function tone(c: AudioContext, out: AudioNode, at: number, freq: number, duration: number, gain: number, type: OscillatorType = "sine", attack = 0.004) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + duration + 0.05);
}

/** A bell: a few inharmonic partials with a long decay. */
function bell(c: AudioContext, out: AudioNode, at: number, freq: number, gain: number, duration = 1.4) {
  [1, 2.01, 3.03, 4.2].forEach((ratio, i) => tone(c, out, at, freq * ratio, duration / (1 + i * 0.6), gain / (1 + i * 1.6)));
}

const NOTE = (semitones: number) => 440 * Math.pow(2, semitones / 12);

export const sfx = {
  /** A card sliding off the shoe onto the felt. */
  deal() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    noise(a.ctx, a.out, t, vary(0.11), "bandpass", vary(2600), 0.9, 0.5, 900);
    noise(a.ctx, a.out, t + 0.09, 0.05, "lowpass", 1200, 0.7, 0.35);
  },
  /** Turning a card face up. */
  flip() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    noise(a.ctx, a.out, t, 0.07, "highpass", vary(3200), 0.8, 0.35);
    noise(a.ctx, a.out, t + 0.05, 0.04, "bandpass", 1800, 1.2, 0.3);
  },
  /** Clay chips clacking together. */
  chip(count = 1) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    for (let i = 0; i < Math.min(count, 4); i++) {
      const at = t + i * vary(0.045, 0.3);
      tone(a.ctx, a.out, at, vary(3400, 0.1), 0.05, 0.22, "triangle", 0.001);
      tone(a.ctx, a.out, at, vary(5200, 0.1), 0.03, 0.12, "sine", 0.001);
      noise(a.ctx, a.out, at, 0.035, "bandpass", vary(4500), 2, 0.4);
    }
  },
  /** Soft tick for interface buttons. */
  tick() {
    const a = audio();
    if (!a) return;
    tone(a.ctx, a.out, a.ctx.currentTime, vary(1800, 0.03), 0.04, 0.06, "sine", 0.001);
  },
  win() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    [0, 4, 7, 12].forEach((s, i) => bell(a.ctx, a.out, t + i * 0.08, NOTE(s + 3), 0.18));
  },
  blackjack() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    [0, 4, 7, 11, 12, 16, 19, 24].forEach((s, i) => bell(a.ctx, a.out, t + i * 0.07, NOTE(s + 3), 0.16, 1.8));
    for (let i = 0; i < 10; i++) tone(a.ctx, a.out, t + 0.5 + i * 0.05, vary(NOTE(27 + (i % 5) * 2), 0.01), 0.3, 0.04);
  },
  push() {
    const a = audio();
    if (!a) return;
    bell(a.ctx, a.out, a.ctx.currentTime, NOTE(-2), 0.12, 0.9);
  },
  /** Foil being torn open. */
  tear() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    for (let i = 0; i < 7; i++) noise(a.ctx, a.out, t + i * vary(0.035, 0.4), vary(0.06), "highpass", vary(2500 + i * 300), 1.5, 0.35);
    noise(a.ctx, a.out, t + 0.22, 0.25, "bandpass", 1400, 0.8, 0.3, 4000);
  },
  /** Cards sliding out of the pack. */
  whoosh() {
    const a = audio();
    if (!a) return;
    noise(a.ctx, a.out, a.ctx.currentTime, 0.4, "bandpass", 400, 1.2, 0.35, 3000);
  },
  /** The reveal of a card, grander with rarity (0 commune … 4 mythique). */
  reveal(tier: number) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    if (tier === 0) {
      bell(a.ctx, a.out, t, NOTE(3), 0.08, 0.6);
      return;
    }
    const chords = [[], [0, 7], [0, 4, 7, 11], [0, 4, 7, 12, 16, 19], [0, 3, 7, 10, 12, 15, 19, 24]];
    chords[tier].forEach((st, i) => bell(a.ctx, a.out, t + i * 0.06, NOTE(st + 3), 0.12 + tier * 0.02, 1 + tier * 0.4));
    if (tier >= 3) {
      tone(a.ctx, a.out, t, NOTE(-21), 1.6, 0.25, "sine", 0.01);
      noise(a.ctx, a.out, t, 1.2, "highpass", 6000, 0.5, 0.12);
      for (let i = 0; i < 14; i++) tone(a.ctx, a.out, t + 0.3 + i * 0.045, vary(NOTE(27 + (i % 6) * 2), 0.01), 0.35, 0.035);
    }
  },
  /**
   * Rising tension while a top card is held. Returns a stop function (call it on release or
   * once the card turns).
   */
  charge(): () => void {
    const a = audio();
    if (!a) return () => {};
    const { ctx: c, out } = a;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 1.3);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 1.3);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.4);
    o.connect(f).connect(g).connect(out);
    o.start(t);
    return () => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      o.stop(now + 0.2);
    };
  },
  /** Poussière d'or pouring in. */
  dust() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    for (let i = 0; i < 12; i++) tone(a.ctx, a.out, t + i * vary(0.03, 0.5), vary(NOTE(30), 0.15), 0.12, 0.03);
  },
  /** The ball rolling on the track, slowing over `seconds`. */
  roll(seconds: number) {
    const a = audio();
    if (!a) return;
    const { ctx: c, out } = a;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(2200, t);
    f.frequency.exponentialRampToValueAtTime(500, t + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.05, t + seconds * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + seconds + 0.05);
  },
  /** The ball skipping over a fret. */
  fret() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    tone(a.ctx, a.out, t, vary(2600, 0.15), 0.03, 0.08, "triangle", 0.001);
    noise(a.ctx, a.out, t, 0.025, "highpass", 3000, 1, 0.15);
  },
  /** The ball settling in its pocket. */
  clack() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    tone(a.ctx, a.out, t, 1900, 0.06, 0.2, "triangle", 0.001);
    tone(a.ctx, a.out, t + 0.07, 2100, 0.04, 0.1, "triangle", 0.001);
    noise(a.ctx, a.out, t, 0.08, "bandpass", 2500, 2, 0.3);
  },
  /** A reel locking into place. */
  reelStop(index: number) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    tone(a.ctx, a.out, t, 90 + index * 8, 0.12, 0.22, "sine", 0.002);
    noise(a.ctx, a.out, t, 0.05, "bandpass", vary(1500), 1.5, 0.25);
  },
  /** Reels whirring. */
  reelSpin(seconds: number) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    for (let i = 0; i < seconds / 0.06; i++) noise(a.ctx, a.out, t + i * 0.06, 0.04, "bandpass", vary(1100, 0.2), 2, 0.07);
  },
  /** Winning symbols bursting. */
  burst(size: number) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    noise(a.ctx, a.out, t, 0.18, "highpass", 4000, 0.7, 0.18);
    for (let i = 0; i < 3 + size; i++) tone(a.ctx, a.out, t + i * 0.035, vary(NOTE(24 + (i % 4) * 3), 0.02), 0.2, 0.05);
  },
  /** Tension when a third sceau may land. */
  tease() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    for (let i = 0; i < 8; i++) tone(a.ctx, a.out, t + i * 0.09, NOTE(i % 2 ? 7 : 5), 0.12, 0.05, "triangle");
  },
  lose() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    tone(a.ctx, a.out, t, NOTE(-14), 0.5, 0.14, "triangle", 0.01);
    tone(a.ctx, a.out, t + 0.16, NOTE(-17), 0.7, 0.12, "triangle", 0.01);
  },
};
