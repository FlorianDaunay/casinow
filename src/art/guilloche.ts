/**
 * Guilloché patterns: the engraved rosettes of banknotes and watch dials, drawn as
 * epitrochoids. Several curves with slightly shifted parameters give the moiré depth.
 */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const round = (n: number) => Math.round(n * 100) / 100;

export interface RosetteOptions {
  /** Outer radius of the pattern, in user units. */
  radius: number;
  /** Number of petals (lobes) around the circle. */
  petals: number;
  /** 0..1: how deep the lobes cut towards the center. */
  depth: number;
  /** Phase rotation in radians. */
  phase?: number;
  /** Points per lobe (smoothness). */
  resolution?: number;
}

/** One closed rosette as an SVG path `d`, centered on 0,0. */
export function rosettePath({ radius, petals, depth, phase = 0, resolution = 28 }: RosetteOptions): string {
  // Epitrochoid with R = petals * r closes after one turn and shows `petals` lobes.
  const r = 1;
  const R = petals * r;
  const d = depth * 6;
  const scale = radius / (R + r + d);
  const steps = petals * resolution;
  const turns = r / gcd(R, r);
  const parts: string[] = [];
  for (let i = 0; i <= steps * turns; i++) {
    const t = (i / steps) * Math.PI * 2;
    const k = (R + r) / r;
    const x = ((R + r) * Math.cos(t) - d * Math.cos(k * t)) * scale;
    const y = ((R + r) * Math.sin(t) - d * Math.sin(k * t)) * scale;
    const cos = Math.cos(phase);
    const sin = Math.sin(phase);
    parts.push(`${i === 0 ? "M" : "L"}${round(x * cos - y * sin)} ${round(x * sin + y * cos)}`);
  }
  return parts.join("") + "Z";
}

/** A woven band of rosettes between two radii (the classic banknote ring). */
export function guillocheBand(inner: number, outer: number, petals: number, lines: number, twist = 0.5): string[] {
  const paths: string[] = [];
  for (let i = 0; i < lines; i++) {
    const f = lines === 1 ? 0 : i / (lines - 1);
    const radius = inner + (outer - inner) * f;
    paths.push(rosettePath({ radius, petals, depth: 0.55 + 0.25 * Math.sin(f * Math.PI), phase: (f * twist * Math.PI * 2) / petals }));
  }
  return paths;
}

/** A sine-wave interference pattern filling a rectangle (security-paper background). */
export function wavePaper(width: number, height: number, rows: number, amplitude: number, waves: number): string[] {
  const paths: string[] = [];
  for (let row = 0; row < rows; row++) {
    const y0 = (row / (rows - 1)) * height;
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const x = (i / 80) * width;
      const y = y0 + Math.sin((x / width) * Math.PI * 2 * waves + row * 0.45) * amplitude;
      pts.push(`${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`);
    }
    paths.push(pts.join(""));
  }
  return paths;
}
