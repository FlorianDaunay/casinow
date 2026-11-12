import { describe, expect, it } from "vitest";
import type { Card, Rank, Suit } from "@/core/cards/playing";
import { bestHold, bestSwap, deal, draw, evaluate, fullDeck, holdValue, payout } from "./engine";

const S: Record<string, Suit> = { p: "pique", c: "coeur", k: "carreau", t: "trefle" };
/** "Ap Rp 10c" → cards (rank then suit letter). */
const hand = (text: string): Card[] =>
  text.split(" ").map((t, i) => ({ rank: t.slice(0, -1) as Rank, suit: S[t.slice(-1)], id: i }));

let seed = 3;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe("evaluate", () => {
  it("ranks every hand", () => {
    expect(evaluate(hand("Ap Rp Dp Vp 10p"))).toBe("royale");
    expect(evaluate(hand("9c 8c 7c 6c 5c"))).toBe("quinte-flush");
    expect(evaluate(hand("Ap 2c 3k 4t 5p"))).toBe("quinte");
    expect(evaluate(hand("7p 7c 7k 7t 2p"))).toBe("carre");
    expect(evaluate(hand("7p 7c 7k 2t 2p"))).toBe("full");
    expect(evaluate(hand("Ap 9p 7p 4p 2p"))).toBe("couleur");
    expect(evaluate(hand("7p 7c 7k Rt 2p"))).toBe("brelan");
    expect(evaluate(hand("7p 7c 2k 2t Ap"))).toBe("deux-paires");
    expect(evaluate(hand("Vp Vc 2k 5t 9p"))).toBe("valets");
    expect(evaluate(hand("10p 10c 2k 5t 9p"))).toBe("rien");
    expect(evaluate(hand("Rp Dc 9k 5t 2p"))).toBe("rien");
  });

  it("pays 800 per credit for a royal at max bet only", () => {
    expect(payout("royale", 5)).toBe(4000);
    expect(payout("royale", 1)).toBe(250);
    expect(payout("full", 5)).toBe(40);
  });
});

describe("deal and draw", () => {
  it("never repeats a card", () => {
    for (let i = 0; i < 200; i++) {
      const d = draw(deal(random), [true, false, true, false, false]);
      expect(new Set(d.hand.map((c) => c.id)).size).toBe(5);
      expect(d.deck.some((c) => d.hand.some((h) => h.id === c.id))).toBe(false);
    }
  });

  it("forces an ace when asked", () => {
    for (let i = 0; i < 100; i++) expect(deal(random, true).hand.some((c) => c.rank === "A")).toBe(true);
  });
});

describe("strategy", () => {
  it("keeps a made royal and a pat full house", () => {
    expect(bestHold(hand("Ap Rp Dp Vp 10p")).held).toEqual([true, true, true, true, true]);
    expect(bestHold(hand("7p 7c 7k 2t 2p")).held).toEqual([true, true, true, true, true]);
  });

  it("breaks a flush for four to a royal", () => {
    const { held } = bestHold(hand("Ap Rp Dp Vp 3p"));
    expect(held).toEqual([true, true, true, true, false]);
  });

  it("keeps a high pair over a three-card flush", () => {
    const { held } = bestHold(hand("Rp Rc 4c 7c 9t"));
    expect(held).toEqual([true, true, false, false, false]);
  });

  it("values a high pair at about 1.53 credits (8/5 table)", () => {
    expect(holdValue(hand("Rp Rc 4k 7c 9t"), [true, true, false, false, false])).toBeCloseTo(1.526, 2);
  });

  it("La Lune Noire swaps a dead card when it helps", () => {
    const h = hand("Rp Rc 4k 7c 9t");
    const seen = new Set(h.map((c) => `${c.rank}${c.suit}`));
    const unseen = fullDeck().filter((c) => !seen.has(`${c.rank}${c.suit}`));
    const s = bestSwap(h, unseen);
    expect(s.index).toBeGreaterThanOrEqual(2);
    expect(s.ev).toBeGreaterThan(s.keep);
  });
});
