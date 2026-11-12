import { describe, expect, it } from "vitest";
import { betKey, colorOf, covers, settle, WHEEL_ORDER } from "./engine";

describe("roulette", () => {
  it("has 37 distinct pockets and 18 reds", () => {
    expect(new Set(WHEEL_ORDER).size).toBe(37);
    expect(WHEEL_ORDER.filter((n) => colorOf(n) === "rouge").length).toBe(18);
    expect(colorOf(0)).toBe("vert");
    expect(colorOf(32)).toBe("rouge");
    expect(colorOf(15)).toBe("noir");
  });

  it("covers the layout correctly", () => {
    expect(covers({ type: "douzaine", index: 1 }, 13)).toBe(true);
    expect(covers({ type: "douzaine", index: 1 }, 25)).toBe(false);
    expect(covers({ type: "colonne", index: 2 }, 36)).toBe(true);
    expect(covers({ type: "colonne", index: 0 }, 34)).toBe(true);
    expect(covers({ type: "passe" }, 19)).toBe(true);
    expect(covers({ type: "pair" }, 0)).toBe(false);
  });

  it("pays 35 to 1 on a plein and loses outside bets on zero", () => {
    const bets = { [betKey({ type: "plein", number: 17 })]: 10, rouge: 20, [betKey({ type: "douzaine", index: 1 })]: 10 };
    const at17 = settle(bets, 17);
    expect(at17.reduce((s, r) => s + r.payout, 0)).toBe(360 + 0 + 30);
    const at0 = settle(bets, 0);
    expect(at0.every((r) => !r.won)).toBe(true);
  });

  it("has the house edge of a single-zero wheel", () => {
    // Expected return of a 1-unit plein over every pocket: 36 / 37.
    let ret = 0;
    for (let n = 0; n <= 36; n++) ret += settle({ "plein-7": 1 }, n)[0].payout;
    expect(ret / 37).toBeCloseTo(36 / 37);
  });
});
