import { describe, expect, it } from "vitest";
import { findWins, spin, type Grid, type Sym } from "./engine";

let seed = 11;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const grid = (rows: Sym[][]): Grid => rows[0].map((_, r) => rows.map((row, k) => ({ sym: row[r], id: k * 10 + r })));

/** Average return of one paid spin, free spins it triggers included. */
export function measureRtp(spins: number, wildBoost = false): { rtp: number; hit: number; free: number } {
  let paid = 0;
  let won = 0;
  let hits = 0;
  let frees = 0;
  for (let i = 0; i < spins; i++) {
    paid += 20;
    const res = spin(20, random, { wildBoost });
    won += res.total;
    if (res.total > 0) hits++;
    let queue = res.freeSpins;
    if (queue) frees++;
    while (queue > 0) {
      queue--;
      const f = spin(20, random, { wildBoost, free: true });
      won += f.total;
      queue += f.freeSpins ? 5 : 0;
    }
  }
  return { rtp: won / paid, hit: hits / spins, free: frees / spins };
}

describe("slots", () => {
  it("counts ways across consecutive reels, jokers included", () => {
    const g = grid([
      ["soleil", "joker", "soleil", "pique", "coeur"],
      ["soleil", "cle", "pique", "soleil", "coeur"],
      ["lune", "lune", "lune", "trefle", "coeur"],
    ]);
    const wins = findWins(g, 20);
    const sun = wins.find((w) => w.sym === "soleil")!;
    expect(sun.reels).toBe(4);
    expect(sun.ways).toBe(2 * 1 * 1 * 1);
    expect(wins.find((w) => w.sym === "lune")!.reels).toBe(3);
  });

  it("cascades until nothing pays, and the steps chain", () => {
    for (let i = 0; i < 200; i++) {
      const res = spin(20, random);
      const last = res.steps[res.steps.length - 1];
      expect(last.wins.length).toBe(0);
      expect(res.total).toBe(res.steps.reduce((s, x) => s + x.amount, 0));
      for (const s of res.steps) expect(s.grid.every((reel) => reel.length === 3)).toBe(true);
    }
  });

  // Long-run RTP measured at 94.6 % over 800 000 spins (RTP_SPINS=800000). Free spins make
  // short samples noisy, hence the wide band for the default run.
  it("returns roughly 95 % over many spins", () => {
    const { rtp, hit, free } = measureRtp(Number(process.env.RTP_SPINS ?? 60000));
    console.log(`RTP ${(rtp * 100).toFixed(2)} %  hit ${(hit * 100).toFixed(1)} %  free 1/${Math.round(1 / free)}`);
    expect(rtp).toBeGreaterThan(0.85);
    expect(rtp).toBeLessThan(1.05);
  });
});
