/**
 * The one AudioContext of the app, shared by sound effects and music. Browsers only let it
 * start after a user gesture, so it is created lazily and resumed on the first touch.
 */

let ctx: AudioContext | null = null;
let bus: DynamicsCompressorNode | null = null;
let noise: AudioBuffer | null = null;

export interface AudioCore {
  ctx: AudioContext;
  /** Final stage before the speakers (a gentle compressor). */
  bus: AudioNode;
  /** One second of white noise, reused by every noisy sound. */
  noise: AudioBuffer;
}

export function getAudio(): AudioCore | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    // A touch of compression keeps stacked sounds from clipping.
    bus = ctx.createDynamicsCompressor();
    bus.threshold.value = -14;
    bus.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, bus: bus!, noise: noise! };
}
