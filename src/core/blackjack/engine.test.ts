import { describe, expect, it } from "vitest";
import type { Card, Rank } from "@/core/cards/playing";
import {
  canDouble,
  canSplit,
  createGame,
  deal,
  dealerStep,
  double,
  handValue,
  hit,
  split,
  stand,
  type BlackjackState,
} from "./engine";

let seed = 1;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const c = (rank: Rank, id = 0): Card => ({ rank, suit: "pique", id });

/** A game whose shoe starts with the given ranks (dealt in order: P, D, P, D, then draws). */
function rigged(...ranks: Rank[]): BlackjackState {
  const game = createGame(random);
  game.shoe = [...ranks.map((r, i) => c(r, 1000 + i)), ...game.shoe];
  return game;
}

const runDealer = (s: BlackjackState) => {
  while (s.phase === "dealer") s = dealerStep(s);
  return s;
};

describe("handValue", () => {
  it("counts aces as 11 while it does not bust", () => {
    expect(handValue([c("A"), c("6")])).toEqual({ total: 17, soft: true });
    expect(handValue([c("A"), c("6"), c("9")])).toEqual({ total: 16, soft: false });
    expect(handValue([c("A"), c("A"), c("9")])).toEqual({ total: 21, soft: true });
    expect(handValue([c("R"), c("D"), c("2")])).toEqual({ total: 22, soft: false });
  });
});

describe("deal", () => {
  it("pays a natural 3 to 2 immediately", () => {
    const s = deal(rigged("A", "9", "R", "7"), 100, random);
    expect(s.phase).toBe("settled");
    expect(s.hands[0].outcome).toBe("blackjack");
    expect(s.hands[0].payout).toBe(250);
  });

  it("pushes when both have a natural", () => {
    const s = deal(rigged("A", "A", "R", "D"), 100, random);
    expect(s.hands[0].outcome).toBe("push");
    expect(s.hands[0].payout).toBe(100);
  });

  it("ends the round when the dealer peeks a natural", () => {
    const s = deal(rigged("9", "A", "9", "V"), 100, random);
    expect(s.phase).toBe("settled");
    expect(s.hands[0].outcome).toBe("lose");
  });

  it("reshuffles past the penetration", () => {
    const game = createGame(random);
    game.shoe = game.shoe.slice(0, 20);
    const s = deal(game, 10, random);
    expect(s.reshuffled).toBe(true);
    expect(s.shoe.length).toBe(6 * 52 - 4);
  });

  it("rejects bets out of limits", () => {
    expect(() => deal(createGame(random), 5, random)).toThrow();
  });
});

describe("player actions", () => {
  it("busts and settles without the dealer drawing", () => {
    let s = deal(rigged("R", "9", "6", "7", "V"), 100, random);
    s = hit(s);
    expect(s.phase).toBe("settled");
    expect(s.hands[0].outcome).toBe("bust");
    expect(s.dealer.length).toBe(2);
  });

  it("dealer draws to 17 and stands on soft 17", () => {
    let s = deal(rigged("R", "6", "9", "A"), 100, random);
    s = runDealer(stand(s));
    expect(handValue(s.dealer).total).toBe(17);
    expect(s.dealer.length).toBe(2);
    expect(s.hands[0].outcome).toBe("win");
  });

  it("dealer busts", () => {
    let s = deal(rigged("R", "6", "8", "R", "R"), 100, random);
    s = runDealer(stand(s));
    expect(handValue(s.dealer).total).toBe(26);
    expect(s.hands[0].outcome).toBe("win");
    expect(s.hands[0].payout).toBe(200);
  });

  it("doubles for exactly one card", () => {
    let s = deal(rigged("6", "R", "5", "7", "R"), 100, random);
    expect(canDouble(s)).toBe(true);
    s = double(s);
    expect(s.hands[0].bet).toBe(200);
    expect(s.hands[0].cards.length).toBe(3);
    s = runDealer(s);
    expect(s.hands[0].outcome).toBe("win");
    expect(s.hands[0].payout).toBe(400);
  });

  it("splits a pair into two hands played in turn", () => {
    let s = deal(rigged("8", "R", "8", "8", "3", "R"), 100, random);
    expect(canSplit(s)).toBe(true);
    s = split(s);
    expect(s.hands.length).toBe(2);
    expect(s.hands.map((h) => h.cards.map((x) => x.rank))).toEqual([
      ["8", "3"],
      ["8", "R"],
    ]);
    expect(s.active).toBe(0);
    s = stand(s);
    expect(s.active).toBe(1);
    s = runDealer(stand(s));
    expect(s.hands.map((h) => h.outcome)).toEqual(["lose", "push"]);
  });

  it("split aces get one card each and 21 is not a natural", () => {
    let s = deal(rigged("A", "9", "A", "R", "R", "5"), 100, random);
    s = runDealer(split(s));
    expect(s.phase).toBe("settled");
    expect(s.hands[0].outcome).toBe("win");
    expect(s.hands[0].payout).toBe(200);
    expect(s.hands[1].cards.length).toBe(2);
  });

  it("auto-stands on 21", () => {
    let s = deal(rigged("5", "9", "6", "8", "R"), 100, random);
    s = hit(s);
    expect(s.phase).not.toBe("player");
  });
});

describe("atout rules", () => {
  it("doubles on three cards when doubleAny is on", () => {
    let s = rigged("2", "R", "3", "7", "4", "R");
    s = { ...s, rules: { ...s.rules, doubleAny: true } };
    s = deal(s, 100, random);
    s = hit(s);
    expect(canDouble(s)).toBe(true);
    s = double(s);
    expect(s.hands[0].bet).toBe(200);
    expect(s.hands[0].cards.length).toBe(4);
  });

  it("five cards without busting win against a dealer 20", () => {
    let s = rigged("2", "R", "3", "R", "2", "3", "2");
    s = { ...s, rules: { ...s.rules, charlie: true } };
    s = deal(s, 100, random);
    s = hit(hit(hit(s)));
    expect(s.hands[0].cards.length).toBe(5);
    s = runDealer(s);
    expect(s.hands[0].outcome).toBe("win");
    expect(s.hands[0].payout).toBe(200);
  });

  it("pays a natural 2 to 1 with a higher payout rule", () => {
    let s = rigged("A", "9", "R", "7");
    s = { ...s, rules: { ...s.rules, blackjackPays: 2 } };
    s = deal(s, 100, random);
    expect(s.hands[0].payout).toBe(300);
  });
});
