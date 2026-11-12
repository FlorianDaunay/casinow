import type { Random } from "@/core/cards/playing";

/**
 * Slot machine "Le Grand Hall": 5 reels × 3 rows, 243 ways (a symbol pays when it lands on
 * consecutive reels from the left, on any row). Winning symbols burst and the ones above fall
 * into place (cascade), each cascade raising the multiplier. Three sceaux or more open free
 * spins with a steeper multiplier ladder. Pure: the caller handles the wallet and the atouts.
 */

export const SYMBOLS = ["pique", "coeur", "carreau", "trefle", "coupe", "cle", "lune", "couronne", "soleil", "joker", "sceau"] as const;
export type Sym = (typeof SYMBOLS)[number];
export type PayingSym = Exclude<Sym, "joker" | "sceau">;

export const REELS = 5;
export const ROWS = 3;

/** Pay per way for 3, 4 and 5 reels, in units of bet / 20. */
export const PAYTABLE: Record<PayingSym, [number, number, number]> = {
  pique: [4, 14, 36],
  coeur: [4, 14, 36],
  carreau: [4, 14, 36],
  trefle: [4, 14, 36],
  coupe: [9, 23, 62],
  cle: [9, 23, 62],
  lune: [14, 36, 104],
  couronne: [23, 68, 190],
  soleil: [35, 115, 380],
};

const BASE_WEIGHTS: Record<Sym, number> = {
  pique: 15,
  coeur: 15,
  carreau: 15,
  trefle: 15,
  coupe: 10,
  cle: 10,
  lune: 8,
  couronne: 5,
  soleil: 3.5,
  joker: 2.4,
  sceau: 2.6,
};

/** Cascade multipliers: the n-th cascade of a spin uses the n-th step (the last repeats). */
export const LADDER = [1, 2, 3, 5];
export const FREE_LADDER = [2, 4, 6, 10];

/** Free spins awarded for 3, 4, 5 sceaux. */
export const FREE_SPINS: Record<number, number> = { 3: 8, 4: 12, 5: 20 };

export interface Cell {
  sym: Sym;
  /** Unique per symbol instance, so the UI can animate each one as it falls. */
  id: number;
}

/** grid[reel][row], row 0 at the top. */
export type Grid = Cell[][];

export interface Win {
  sym: PayingSym;
  reels: number;
  ways: number;
  amount: number;
}

export interface Step {
  grid: Grid;
  wins: Win[];
  /** Cells that burst after this step (same shape as the grid). */
  burst: boolean[][];
  multiplier: number;
  /** Jetons won by this step (multiplier applied). */
  amount: number;
}

export interface SpinResult {
  steps: Step[];
  total: number;
  scatters: number;
  freeSpins: number;
}

export interface SpinOptions {
  /** Jokers land more often (atout). */
  wildBoost?: boolean;
  /** Part of a free-spin round (steeper ladder, no new bet). */
  free?: boolean;
}

function weightsFor(reel: number, opts: SpinOptions): [Sym, number][] {
  return SYMBOLS.map((s) => {
    let w = BASE_WEIGHTS[s];
    // Jokers never land on the first reel, so every win starts with a real symbol.
    if (s === "joker") w = reel === 0 ? 0 : w * (opts.wildBoost ? 1.6 : 1);
    return [s, w];
  });
}

function draw(reel: number, opts: SpinOptions, random: Random): Sym {
  const weights = weightsFor(reel, opts);
  const total = weights.reduce((t, [, w]) => t + w, 0);
  let roll = random() * total;
  for (const [s, w] of weights) {
    roll -= w;
    if (roll < 0) return s;
  }
  return weights[weights.length - 1][0];
}

/** Every paying combination on a grid. */
export function findWins(grid: Grid, bet: number): Win[] {
  const wins: Win[] = [];
  for (const sym of Object.keys(PAYTABLE) as PayingSym[]) {
    let ways = 1;
    let reels = 0;
    for (let r = 0; r < REELS; r++) {
      const count = grid[r].filter((c) => c.sym === sym || (r > 0 && c.sym === "joker")).length;
      if (!count) break;
      ways *= count;
      reels++;
    }
    if (reels >= 3) wins.push({ sym, reels, ways, amount: (PAYTABLE[sym][reels - 3] * ways * bet) / 20 });
  }
  return wins;
}

function burstMask(grid: Grid, wins: Win[]): boolean[][] {
  return grid.map((reel, r) =>
    reel.map((c) => wins.some((w) => r < w.reels && (c.sym === w.sym || (r > 0 && c.sym === "joker"))))
  );
}

/** Plays one spin to the end of its cascades. */
export function spin(bet: number, random: Random, opts: SpinOptions = {}): SpinResult {
  let id = 0;
  let grid: Grid = Array.from({ length: REELS }, (_, r) => Array.from({ length: ROWS }, () => ({ sym: draw(r, opts, random), id: id++ })));
  const scatters = grid.flat().filter((c) => c.sym === "sceau").length;
  const ladder = opts.free ? FREE_LADDER : LADDER;
  const steps: Step[] = [];
  let total = 0;

  for (let n = 0; ; n++) {
    const wins = findWins(grid, bet);
    const multiplier = ladder[Math.min(n, ladder.length - 1)];
    const amount = Math.floor(wins.reduce((s, w) => s + w.amount, 0) * multiplier);
    const burst = burstMask(grid, wins);
    steps.push({ grid, wins, burst, multiplier, amount });
    total += amount;
    if (!wins.length) break;
    // Survivors fall to the bottom of their reel, new symbols drop in above them.
    grid = grid.map((reel, r) => {
      const kept = reel.filter((_, row) => !burst[r][row]);
      const fresh = Array.from({ length: ROWS - kept.length }, () => ({ sym: draw(r, opts, random), id: id++ }));
      return [...fresh, ...kept];
    });
  }

  return { steps, total, scatters, freeSpins: FREE_SPINS[Math.min(scatters, 5)] ?? 0 };
}
