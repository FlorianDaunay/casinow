import { describe, expect, it } from "vitest";
import { BOOSTERS, openBooster } from "./booster";
import { CATALOG, FAMILIES, findCard } from "./catalog";
import { blackjackModifiers, slotCount } from "./effects";
import { RARITIES } from "./types";

let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe("catalog", () => {
  it("has 40 unique cards with the planned rarity spread", () => {
    expect(CATALOG.length).toBe(40);
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(40);
    const count = (r: string) => CATALOG.filter((c) => c.rarity === r).length;
    expect(RARITIES.map(count)).toEqual([16, 12, 7, 4, 1]);
    for (const f of FAMILIES) expect(CATALOG.some((c) => c.family === f)).toBe(true);
  });

  it("odds of every booster sum to 100", () => {
    for (const b of Object.values(BOOSTERS)) {
      expect(Object.values(b.odds).reduce((a, x) => a + x, 0)).toBeCloseTo(100);
      expect(Object.values(b.lastOdds).reduce((a, x) => a + x, 0)).toBeCloseTo(100);
    }
  });
});

describe("openBooster", () => {
  it("returns 5 cards, best last", () => {
    const pulls = openBooster("salon", random);
    expect(pulls.length).toBe(5);
    const idx = pulls.map((p) => RARITIES.indexOf(p.card.rarity));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it("honours the guarantees: rare, épique, légendaire", () => {
    for (let i = 0; i < 300; i++) {
      expect(RARITIES.indexOf(openBooster("salon", random)[4].card.rarity)).toBeGreaterThanOrEqual(1);
      expect(RARITIES.indexOf(openBooster("prestige", random)[4].card.rarity)).toBeGreaterThanOrEqual(2);
      expect(RARITIES.indexOf(openBooster("arcane", random)[4].card.rarity)).toBeGreaterThanOrEqual(3);
    }
  });

  it("rarity rates of the open slots roughly match the odds", () => {
    let communes = 0;
    const packs = 4000;
    for (let i = 0; i < packs; i++) communes += openBooster("salon", random).filter((p) => p.card.rarity === "commune").length;
    expect(communes / (packs * 4)).toBeGreaterThan(0.68);
    expect(communes / (packs * 4)).toBeLessThan(0.76);
  });
});

describe("blackjackModifiers", () => {
  const card = (name: string) => CATALOG.find((c) => c.name === name)!;

  it("adds percentages and keeps the best natural payout", () => {
    const m = blackjackModifiers([card("Le Portier"), card("Le Zénith"), card("La Couronne"), card("La Main Ferme")], []);
    expect(m.winBonus).toBeCloseTo(0.08);
    expect(m.bustRefund).toBeCloseTo(0.15);
    expect(m.blackjackPays).toBe(2);
  });

  it("counts a duplicated card once and adds family bonuses", () => {
    const eye = findCard("s1-09")!;
    const m = blackjackModifiers([eye, eye], ["Les Astres"]);
    expect(m.peekUses).toBe(1);
    expect(m.winBonus).toBeCloseTo(0.03);
    expect(slotCount(["La Maison"])).toBe(4);
  });
});
