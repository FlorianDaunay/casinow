import { getAudio } from "./context";

/**
 * Generative 1920s jazz, played live with the Web Audio API. Each room has a style: a chord
 * progression, a tempo and a band (electric piano, double bass, brushes, ride, reed, celesta).
 * The parts are improvised bar by bar from the chords, so the music never loops verbatim.
 */

export type MusicStyle = "salon" | "blackjack" | "roulette" | "machines" | "poker" | "arcane";

type Quality = "maj9" | "maj7#11" | "6" | "m9" | "m7" | "m6" | "9" | "13" | "13sus" | "7b9" | "7alt" | "m7b5" | "dim7";
interface Chord {
  /** Semitones above the key. */
  root: number;
  q: Quality;
}

/** Rootless piano voicings, in semitones above the chord root. */
const VOICING: Record<Quality, number[]> = {
  maj9: [4, 7, 11, 14],
  "maj7#11": [4, 11, 14, 18],
  "6": [4, 7, 9, 14],
  m9: [3, 7, 10, 14],
  m7: [3, 7, 10, 15],
  m6: [3, 7, 9, 14],
  "9": [4, 7, 10, 14],
  "13": [4, 10, 14, 21],
  "13sus": [5, 10, 14, 21],
  "7b9": [4, 10, 13, 19],
  "7alt": [4, 10, 15, 20],
  m7b5: [3, 6, 10, 17],
  dim7: [3, 6, 9, 12],
};

/** Notes a soloist may use over each chord. */
const SCALE: Record<Quality, number[]> = {
  maj9: [0, 2, 4, 7, 9, 11],
  "maj7#11": [0, 2, 4, 6, 7, 11],
  "6": [0, 2, 4, 7, 9],
  m9: [0, 2, 3, 5, 7, 10],
  m7: [0, 3, 5, 7, 10],
  m6: [0, 2, 3, 5, 7, 9],
  "9": [0, 2, 4, 7, 9, 10],
  "13": [0, 2, 4, 7, 9, 10],
  "13sus": [0, 2, 5, 7, 9, 10],
  "7b9": [0, 1, 4, 7, 8, 10],
  "7alt": [0, 1, 3, 4, 8, 10],
  m7b5: [0, 3, 5, 6, 10],
  dim7: [0, 3, 6, 9],
};

const THIRD: Record<Quality, number> = { maj9: 4, "maj7#11": 4, "6": 4, m9: 3, m7: 3, m6: 3, "9": 4, "13": 4, "13sus": 5, "7b9": 4, "7alt": 4, m7b5: 3, dim7: 3 };
const FIFTH: Record<Quality, number> = { maj9: 7, "maj7#11": 7, "6": 7, m9: 7, m7: 7, m6: 7, "9": 7, "13": 7, "13sus": 7, "7b9": 7, "7alt": 8, m7b5: 6, dim7: 6 };

interface Style {
  /** Pitch class of the key (C = 0). */
  key: number;
  tempo: number;
  /** Position of the off-beat eighth within a beat (0.5 straight, ~0.66 swung). */
  swing: number;
  /** One or two chords per bar. */
  bars: Chord[][];
  bass: "two" | "walk" | "habanera" | "pedal";
  comp: "sparse" | "charleston" | "stabs" | "arp";
  drums: "brushes" | "swing" | "tango" | "none";
  lead: "rhodes" | "reed" | "celesta";
  /** Chance per bar that the lead plays a phrase. */
  density: number;
  level: number;
}

const c = (root: number, q: Quality): Chord => ({ root, q });

const STYLES: Record<MusicStyle, Style> = {
  // Slow lounge in D flat: two-feel bass, brushes, a sparse electric piano.
  salon: {
    key: 1,
    tempo: 68,
    swing: 0.64,
    bars: [[c(0, "maj9")], [c(9, "m9")], [c(2, "m9"), c(7, "13")], [c(0, "maj9"), c(5, "13")], [c(4, "m7"), c(9, "7b9")], [c(2, "m9")], [c(7, "13sus"), c(7, "13")], [c(0, "maj9")]],
    bass: "two",
    comp: "sparse",
    drums: "brushes",
    lead: "rhodes",
    density: 0.35,
    level: 0.85,
  },
  // Minor swing in C for the card table.
  blackjack: {
    key: 0,
    tempo: 104,
    swing: 0.66,
    bars: [[c(0, "m9")], [c(0, "m9")], [c(5, "m9")], [c(5, "m9")], [c(0, "m9")], [c(8, "13"), c(7, "7alt")], [c(0, "m9")], [c(2, "m7b5"), c(7, "7b9")]],
    bass: "walk",
    comp: "charleston",
    drums: "swing",
    lead: "rhodes",
    density: 0.45,
    level: 0.8,
  },
  // Tango in D minor around the wheel.
  roulette: {
    key: 2,
    tempo: 94,
    swing: 0.5,
    bars: [[c(0, "m6")], [c(0, "m6")], [c(7, "7b9")], [c(7, "7b9")], [c(5, "m6")], [c(0, "m6")], [c(1, "9"), c(7, "7b9")], [c(0, "m6")]],
    bass: "habanera",
    comp: "stabs",
    drums: "tango",
    lead: "reed",
    density: 0.6,
    level: 0.8,
  },
  // Up-tempo rhythm changes in F for the hall of machines.
  machines: {
    key: 5,
    tempo: 138,
    swing: 0.63,
    bars: [[c(0, "6"), c(9, "7b9")], [c(2, "m7"), c(7, "9")], [c(0, "6"), c(9, "7b9")], [c(2, "m7"), c(7, "9")], [c(7, "m7"), c(0, "9")], [c(5, "6"), c(6, "dim7")], [c(0, "6"), c(9, "7b9")], [c(2, "m7"), c(7, "9")]],
    bass: "walk",
    comp: "charleston",
    drums: "swing",
    lead: "celesta",
    density: 0.5,
    level: 0.72,
  },
  // A smoky ii-V-I ballad in B flat for the poker room.
  poker: {
    key: 10,
    tempo: 82,
    swing: 0.64,
    bars: [[c(2, "m9")], [c(7, "13")], [c(0, "maj9")], [c(9, "7b9")], [c(2, "m9")], [c(7, "7alt")], [c(0, "6"), c(9, "7b9")], [c(2, "m7"), c(7, "13sus")]],
    bass: "walk",
    comp: "sparse",
    drums: "brushes",
    lead: "rhodes",
    density: 0.4,
    level: 0.85,
  },
  // Floating, drumless arpeggios for the boutique and the album.
  arcane: {
    key: 3,
    tempo: 58,
    swing: 0.5,
    bars: [[c(0, "maj7#11")], [c(9, "m9")], [c(5, "maj9")], [c(7, "13sus")]],
    bass: "pedal",
    comp: "arp",
    drums: "none",
    lead: "celesta",
    density: 0.3,
    level: 1.25,
  },
};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const chance = (p: number) => Math.random() < p;
const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/* Instruments ---------------------------------------------------------------- */

interface Out {
  ctx: AudioContext;
  dry: AudioNode;
  wet: AudioNode;
  noise: AudioBuffer;
}

function env(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setTargetAtTime(peak * 0.55, t + attack, hold);
  g.gain.setTargetAtTime(0.0001, t + attack + hold, release);
}

function connect(o: Out, node: AudioNode, send: number) {
  node.connect(o.dry);
  if (send > 0) {
    const s = o.ctx.createGain();
    s.gain.value = send;
    node.connect(s).connect(o.wet);
  }
}

/** Electric piano: a two-operator FM tine with a bell attack, warm and slightly detuned. */
function rhodes(o: Out, t: number, midi: number, dur: number, vel: number) {
  const { ctx } = o;
  const f = hz(midi);
  const car = ctx.createOscillator();
  car.frequency.value = f * rand(0.998, 1.002);
  const mod = ctx.createOscillator();
  mod.frequency.value = f;
  const index = ctx.createGain();
  index.gain.setValueAtTime(f * 1.8 * vel, t);
  index.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.5);
  mod.connect(index).connect(car.frequency);
  const tine = ctx.createOscillator();
  tine.frequency.value = f * 7;
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.0001, t);
  tg.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.003);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  const g = ctx.createGain();
  env(g, t, 0.21 * vel, 0.006, Math.max(0.15, dur * 0.6), 0.25);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  car.connect(g);
  tine.connect(tg).connect(g);
  g.connect(lp);
  connect(o, lp, 0.35);
  const end = t + dur + 1.5;
  for (const osc of [car, mod, tine]) {
    osc.start(t);
    osc.stop(end);
  }
}

/** Celesta: a pure bell with a glassy upper partial. */
function celesta(o: Out, t: number, midi: number, dur: number, vel: number) {
  const { ctx } = o;
  const f = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(1.2, dur * 2));
  for (const [ratio, amp] of [
    [1, 1],
    [4, 0.18],
    [2.01, 0.12],
  ]) {
    const osc = ctx.createOscillator();
    osc.frequency.value = f * ratio;
    const a = ctx.createGain();
    a.gain.value = amp;
    osc.connect(a).connect(g);
    osc.start(t);
    osc.stop(t + Math.max(1.3, dur * 2) + 0.1);
  }
  connect(o, g, 0.5);
}

/** Reed (bandoneon-like): detuned saws through a soft filter, with vibrato. */
function reed(o: Out, t: number, midi: number, dur: number, vel: number) {
  const { ctx } = o;
  const f = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.05);
  g.gain.setValueAtTime(0.05 * vel, t + dur * 0.85);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.linearRampToValueAtTime(1800, t + 0.12);
  lp.Q.value = 1.2;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.2;
  const vibAmt = ctx.createGain();
  vibAmt.gain.setValueAtTime(0, t);
  vibAmt.gain.linearRampToValueAtTime(f * 0.006, t + 0.35);
  vib.connect(vibAmt);
  for (const d of [-6, 5]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = f;
    osc.detune.value = d;
    vibAmt.connect(osc.frequency);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + dur + 0.2);
  }
  vib.start(t);
  vib.stop(t + dur + 0.2);
  g.connect(lp);
  connect(o, lp, 0.3);
}

const LEAD = { rhodes, celesta, reed };

/** Double bass: a plucked, round low tone with a little thump. */
function bass(o: Out, t: number, midi: number, dur: number, vel: number) {
  const { ctx } = o;
  const f = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.24 * vel, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.1 * vel, t + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1100, t);
  lp.frequency.exponentialRampToValueAtTime(380, t + 0.25);
  for (const [type, ratio, amp] of [
    ["triangle", 1, 1],
    ["sine", 2, 0.25],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f * ratio * 1.012, t);
    osc.frequency.exponentialRampToValueAtTime(f * ratio, t + 0.04);
    const a = ctx.createGain();
    a.gain.value = amp;
    osc.connect(a).connect(g);
    osc.start(t);
    osc.stop(t + dur + 0.15);
  }
  g.connect(lp);
  connect(o, lp, 0.08);
}

function noiseHit(o: Out, t: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number, send = 0.15) {
  const { ctx } = o;
  const src = ctx.createBufferSource();
  src.buffer = o.noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  src.connect(f).connect(g);
  connect(o, g, send);
  src.start(t, Math.random() * 0.5);
  src.stop(t + attack + decay + 0.05);
}

/** Ride cymbal: metallic partials through a bright band, quick ping, long shimmer. */
function ride(o: Out, t: number, vel: number) {
  const { ctx } = o;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.055 * vel, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 5200;
  for (const f of [317, 433, 527, 701, 811, 1033]) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = f * 2.1;
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.75);
  }
  g.connect(hp);
  connect(o, hp, 0.2);
  noiseHit(o, t, "highpass", 8000, 0.5, 0.04 * vel, 0.002, 0.08);
}

const brushSwish = (o: Out, t: number, len: number, vel: number) => noiseHit(o, t, "bandpass", 3800, 0.5, 0.09 * vel, len * 0.4, len * 0.6, 0.1);
const brushTap = (o: Out, t: number, vel: number) => noiseHit(o, t, "bandpass", 4800, 0.9, 0.1 * vel, 0.004, 0.09, 0.1);

function kick(o: Out, t: number, vel: number) {
  const { ctx } = o;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25 * vel, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  osc.connect(g);
  connect(o, g, 0);
  osc.start(t);
  osc.stop(t + 0.3);
}

const clave = (o: Out, t: number, vel: number) => noiseHit(o, t, "bandpass", 2400, 6, 0.09 * vel, 0.002, 0.05, 0.2);

/* The band ----------------------------------------------------------------- */

/** One musical event: when (in beats from the bar start) and what to do. */
type Play = (o: Out, t: number) => void;

class Band {
  private style: Style;
  private bar = 0;
  /** Centre of the last piano voicing, so chords move smoothly. */
  private center = 62;
  private leadPitch = 74;
  constructor(style: Style) {
    this.style = style;
  }

  get beat() {
    return 60 / this.style.tempo;
  }

  private chordAt(chords: Chord[], pos: number): Chord {
    return chords.length === 2 && pos >= 2 ? chords[1] : chords[0];
  }

  private voicing(ch: Chord): number[] {
    const intervals = VOICING[ch.q];
    const base = this.style.key + ch.root;
    let best: number[] = [];
    let bestDist = Infinity;
    for (let oct = 3; oct <= 5; oct++) {
      const notes = intervals.map((i) => base + i + oct * 12);
      const mean = notes.reduce((a, b) => a + b, 0) / notes.length;
      const d = Math.abs(mean - this.center);
      if (d < bestDist) {
        bestDist = d;
        best = notes;
      }
    }
    // Follow the voicing, but drift back towards the middle of the keyboard.
    const mean = best.reduce((a, b) => a + b, 0) / best.length;
    this.center = mean * 0.8 + 62 * 0.2;
    return best;
  }

  /** Every event of the next bar. */
  nextBar(): { pos: number; play: Play }[] {
    const s = this.style;
    const chords = s.bars[this.bar % s.bars.length];
    const next = s.bars[(this.bar + 1) % s.bars.length][0];
    this.bar++;
    const ev: { pos: number; play: Play }[] = [];
    const add = (pos: number, play: Play) => ev.push({ pos, play });
    const lead = LEAD[s.lead];

    // Bass.
    // Bass notes stay between E2 and E♭3: an octave above a real double bass, so phone
    // speakers can still play them.
    const bassNote = (ch: Chord, offset = 0) => 40 + ((((s.key + ch.root + offset - 4) % 12) + 12) % 12);
    if (s.bass === "two") {
      chords.forEach((ch, i) => {
        const span = chords.length === 2 ? 2 : 4;
        add(i * 2, (o, t) => bass(o, t, bassNote(ch), this.beat * (span === 4 ? 1.8 : 1.6), 0.9));
        if (span === 4) add(2, (o, t) => bass(o, t, bassNote(ch, FIFTH[ch.q]), this.beat * 1.7, 0.75));
      });
    } else if (s.bass === "walk") {
      for (let b = 0; b < 4; b++) {
        const ch = this.chordAt(chords, b);
        let note: number;
        if (b === 0 || (chords.length === 2 && b === 2)) note = bassNote(ch);
        else if (b === 3) note = bassNote(next) + (chance(0.5) ? 1 : -1);
        else note = bassNote(ch, pick([THIRD[ch.q], FIFTH[ch.q], 2, SCALE[ch.q][SCALE[ch.q].length - 1]]));
        add(b, (o, t) => bass(o, t, note, this.beat * 0.92, b === 0 ? 0.95 : 0.8));
      }
    } else if (s.bass === "habanera") {
      for (const half of [0, 2]) {
        const ch = this.chordAt(chords, half);
        const r = bassNote(ch);
        add(half, (o, t) => bass(o, t, r, this.beat * 0.7, 1));
        add(half + 0.75, (o, t) => bass(o, t, r, this.beat * 0.2, 0.7));
        add(half + 1, (o, t) => bass(o, t, bassNote(ch, FIFTH[ch.q]), this.beat * 0.45, 0.85));
        add(half + 1.5, (o, t) => bass(o, t, r + 12, this.beat * 0.45, 0.75));
      }
    } else {
      add(0, (o, t) => bass(o, t, bassNote(chords[0]), this.beat * 3.8, 0.7));
    }

    // Piano / comping.
    const chordHit = (ch: Chord, pos: number, len: number, vel: number) => {
      const notes = this.voicing(ch);
      const inst = s.comp === "arp" ? celesta : rhodes;
      add(pos, (o, t) => notes.forEach((n, k) => inst(o, t + k * 0.008, n, this.beat * len, vel * rand(0.85, 1))));
    };
    if (s.comp === "sparse") {
      chords.forEach((ch, i) => {
        const pos = chords.length === 2 ? i * 2 : chance(0.4) ? 1.5 : 0;
        chordHit(ch, pos - (chance(0.25) && pos > 0 ? 0.5 : 0), chords.length === 2 ? 1.8 : 3.2, 0.55);
      });
    } else if (s.comp === "charleston") {
      chords.forEach((ch, i) => {
        const base = chords.length === 2 ? i * 2 : 0;
        chordHit(ch, base, 0.6, 0.6);
        if (chords.length === 1 || chance(0.5)) chordHit(ch, base + 1.5, 0.8, 0.5);
        if (chords.length === 1 && chance(0.35)) chordHit(ch, 3.5, 0.4, 0.4);
      });
    } else if (s.comp === "stabs") {
      for (let b = 0; b < 4; b++) chordHit(this.chordAt(chords, b), b, 0.3, b % 2 ? 0.4 : 0.6);
    } else {
      // Broken chords, up then down, one per eighth.
      const notes = this.voicing(chords[0]).map((n) => n + 12);
      const seq = [...notes, ...notes.slice(1, -1).reverse()];
      for (let k = 0; k < 8; k++) {
        const n = seq[k % seq.length];
        add(k * 0.5, (o, t) => celesta(o, t, n, this.beat * 1.2, 0.5 + (k === 0 ? 0.2 : 0)));
      }
    }

    // Lead phrase: a few notes of the chord scale, stepwise, landing on a chord tone.
    if (chance(s.density)) {
      const startPos = pick([0.5, 1, 1.5, 2]);
      const len = Math.floor(rand(3, 7));
      let pos = startPos;
      for (let k = 0; k < len && pos < 4; k++) {
        const ch = this.chordAt(chords, pos);
        const scale = SCALE[ch.q].map((x) => (x + s.key + ch.root) % 12);
        const step = pick([-2, -1, -1, 1, 1, 2]);
        let target = this.leadPitch + step;
        // Snap to the nearest scale tone, inside a comfortable register.
        for (let d = 0; d < 3; d++) {
          if (scale.includes(((target % 12) + 12) % 12)) break;
          target += step > 0 ? 1 : -1;
        }
        target = Math.min(84, Math.max(66, target));
        this.leadPitch = target;
        const last = k === len - 1;
        const dur = last ? pick([1, 1.5, 2]) : pick([0.5, 0.5, 1]);
        const note = target + (s.lead === "celesta" ? 12 : 0);
        add(pos, (o, t) => lead(o, t, note, this.beat * dur * 0.95, last ? 0.7 : 0.6));
        pos += dur;
      }
    }

    // Drums.
    if (s.drums === "swing") {
      for (const p of [0, 1, 1.5, 2, 3, 3.5]) add(p, (o, t) => ride(o, t, p % 1 ? 0.6 : 0.9));
      for (const p of [1, 3]) add(p, (o, t) => brushSwish(o, t, this.beat * 0.6, 0.8));
      for (const p of [0, 1, 2, 3]) add(p, (o, t) => kick(o, t, 0.25));
    } else if (s.drums === "brushes") {
      add(0, (o, t) => brushSwish(o, t, this.beat * 1.8, 0.7));
      add(2, (o, t) => brushSwish(o, t, this.beat * 1.8, 0.7));
      for (const p of [1, 3]) add(p, (o, t) => brushTap(o, t, 0.7));
      if (chance(0.5)) add(3.5, (o, t) => brushTap(o, t, 0.4));
    } else if (s.drums === "tango") {
      for (const p of [0, 0.75, 1, 1.5, 2, 2.75, 3, 3.5]) add(p, (o, t) => clave(o, t, p % 1 ? 0.5 : 0.8));
      for (const p of [0, 2]) add(p, (o, t) => kick(o, t, 0.3));
    }

    return ev;
  }
}

/* Engine ------------------------------------------------------------------- */

/** A crackling 78 rpm record under everything: sparse clicks over a soft hiss. */
function crackleBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * 0.012;
    if (Math.random() < 0.0004) d[i] += (Math.random() * 2 - 1) * 0.6;
  }
  return buf;
}

function impulse(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

const LOOKAHEAD = 0.35;
const FADE = 1.4;

/** A style being played: its band, its faders and where the next bar starts. */
interface Layer {
  style: MusicStyle;
  band: Band;
  faders: GainNode[];
  out: Out;
  nextBar: number;
}

class MusicEngine {
  private enabled = true;
  private wanted: MusicStyle = "salon";
  private current: Layer | null = null;
  private timer = 0;
  private master: GainNode | null = null;
  private wet: AudioNode | null = null;
  private crackle: AudioBufferSourceNode | null = null;

  /** The room's style; switches with a crossfade. */
  play(style: MusicStyle) {
    this.wanted = style;
    if (this.enabled && this.running()) this.switchTo(style);
  }

  /** Turns the music on or off; when on, it starts at the next `start` (a user gesture). */
  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
  }

  /** Starts the band. Call it from a user gesture: browsers block audio before one. */
  start() {
    if (!this.enabled) return;
    const core = getAudio();
    if (!core || this.running()) return;
    const { ctx } = core;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(core.bus);
      const conv = ctx.createConvolver();
      conv.buffer = impulse(ctx, 2.4);
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.55;
      conv.connect(wetGain).connect(this.master);
      this.wet = conv;
    }
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(0.42, ctx.currentTime, 0.4);
    if (!this.crackle) {
      this.crackle = ctx.createBufferSource();
      this.crackle.buffer = crackleBuffer(ctx);
      this.crackle.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2400;
      bp.Q.value = 0.4;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      this.crackle.connect(bp).connect(g).connect(this.master);
      this.crackle.start();
    }
    this.switchTo(this.wanted);
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  stop() {
    window.clearInterval(this.timer);
    this.timer = 0;
    const core = getAudio();
    if (core && this.current) this.fadeOut(this.current, core.ctx.currentTime);
    this.current = null;
    if (this.crackle) {
      this.crackle.stop();
      this.crackle = null;
    }
  }

  private running() {
    return this.timer !== 0;
  }

  /**
   * Crossfades to another style. Each style has its own pair of faders, one for the dry
   * sound and one for its reverb send, so the old style's echoes fade out with it.
   */
  private switchTo(style: MusicStyle) {
    const core = getAudio();
    if (!core || !this.master || !this.wet) return;
    if (this.current?.style === style) return;
    const { ctx } = core;
    const t = ctx.currentTime;
    if (this.current) this.fadeOut(this.current, t);

    const dry = ctx.createGain();
    dry.gain.setValueAtTime(0.0001, t);
    dry.gain.linearRampToValueAtTime(STYLES[style].level, t + FADE);
    dry.connect(this.master);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(0.0001, t);
    wet.gain.linearRampToValueAtTime(STYLES[style].level, t + FADE);
    wet.connect(this.wet);
    this.current = { style, band: new Band(STYLES[style]), faders: [dry, wet], out: { ctx, dry, wet, noise: core.noise }, nextBar: t + 0.15 };
  }

  private fadeOut(layer: Layer, t: number) {
    for (const f of layer.faders) {
      f.gain.cancelScheduledValues(t);
      f.gain.setValueAtTime(Math.max(f.gain.value, 0.0001), t);
      f.gain.linearRampToValueAtTime(0.0001, t + FADE);
    }
    window.setTimeout(() => layer.faders.forEach((f) => f.disconnect()), (FADE + 3) * 1000);
  }

  private schedule() {
    const core = getAudio();
    const cur = this.current;
    if (!core || !cur) return;
    const now = core.ctx.currentTime;
    // After a long pause (tab in background), skip ahead instead of catching up.
    if (cur.nextBar < now - 1) cur.nextBar = now + 0.1;
    while (cur.nextBar < now + LOOKAHEAD) {
      const barStart = cur.nextBar;
      const band = cur.band;
      for (const e of band.nextBar()) {
        const whole = Math.floor(e.pos);
        const frac = e.pos - whole;
        const swing = Math.abs(frac - 0.5) < 1e-6 ? STYLES[cur.style].swing : frac;
        const t = barStart + (whole + swing) * band.beat + rand(-0.006, 0.006);
        e.play(cur.out, Math.max(t, now + 0.01));
      }
      cur.nextBar = barStart + 4 * band.beat;
    }
  }
}

export const music = new MusicEngine();
