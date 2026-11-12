import { newShoe, type Card, type Random } from "@/core/cards/playing";

/**
 * Blackjack rules engine. Pure: every action takes a state and returns a new one; the wallet
 * lives outside (the caller charges bets and credits payouts). The dealer plays one card per
 * `dealerStep` so the UI can pace the draw.
 */

export interface Rules {
  decks: number;
  /** Extra paid on a natural, as a fraction of the bet (1.5 = 3 to 2). */
  blackjackPays: number;
  dealerHitsSoft17: boolean;
  /** Maximum number of hands after splits. */
  maxHands: number;
  doubleAfterSplit: boolean;
  /** Share of the shoe dealt before it is reshuffled. */
  penetration: number;
  minBet: number;
  maxBet: number;
  /** Doubling allowed on any hand, not only on the first two cards. */
  doubleAny: boolean;
  /** Five cards without busting win outright. */
  charlie: boolean;
}

export const DEFAULT_RULES: Rules = {
  decks: 6,
  blackjackPays: 1.5,
  dealerHitsSoft17: false,
  maxHands: 4,
  doubleAfterSplit: true,
  penetration: 0.75,
  minBet: 10,
  maxBet: 5000,
  doubleAny: false,
  charlie: false,
};

export type Outcome = "blackjack" | "win" | "push" | "lose" | "bust";
export type Phase = "betting" | "player" | "dealer" | "settled";

export interface Hand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  /** Created by a split (a 21 on two cards is then not a natural). */
  fromSplit: boolean;
  /** Split aces receive one card only. */
  splitAces: boolean;
  done: boolean;
  outcome: Outcome | null;
  /** Total returned to the player at settlement (stake included). */
  payout: number;
}

export interface BlackjackState {
  rules: Rules;
  shoe: Card[];
  phase: Phase;
  dealer: Card[];
  holeRevealed: boolean;
  hands: Hand[];
  active: number;
  /** True for the round during which the shoe was reshuffled. */
  reshuffled: boolean;
}

export function cardPoints(card: Card): number {
  if (card.rank === "A") return 1;
  if (card.rank === "V" || card.rank === "D" || card.rank === "R") return 10;
  return Number(card.rank);
}

/** Best total of a set of cards; `soft` when an ace still counts as 11. */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = false;
  for (const c of cards) {
    total += cardPoints(c);
    if (c.rank === "A") aces = true;
  }
  if (aces && total + 10 <= 21) return { total: total + 10, soft: true };
  return { total, soft: false };
}

export const isNatural = (hand: Pick<Hand, "cards" | "fromSplit">) =>
  !hand.fromSplit && hand.cards.length === 2 && handValue(hand.cards).total === 21;

const dealerNatural = (cards: Card[]) => cards.length === 2 && handValue(cards).total === 21;

/** A five-card hand that has not busted (wins outright under the charlie rule). */
export const isCharlie = (s: Pick<BlackjackState, "rules">, h: Pick<Hand, "cards">) =>
  s.rules.charlie && h.cards.length >= 5 && handValue(h.cards).total <= 21;

export function createGame(random: Random, rules: Rules = DEFAULT_RULES): BlackjackState {
  return {
    rules,
    shoe: newShoe(rules.decks, random),
    phase: "betting",
    dealer: [],
    holeRevealed: false,
    hands: [],
    active: 0,
    reshuffled: false,
  };
}

const clone = (s: BlackjackState): BlackjackState => structuredClone(s);

function draw(s: BlackjackState): Card {
  const card = s.shoe.shift();
  if (!card) throw new Error("Shoe is empty");
  return card;
}

const newHand = (bet: number, cards: Card[] = [], fromSplit = false): Hand => ({
  cards,
  bet,
  doubled: false,
  fromSplit,
  splitAces: false,
  done: false,
  outcome: null,
  payout: 0,
});

export const activeHand = (s: BlackjackState): Hand | undefined => (s.phase === "player" ? s.hands[s.active] : undefined);

export function canHit(s: BlackjackState): boolean {
  const h = activeHand(s);
  return !!h && !h.done;
}

export function canDouble(s: BlackjackState): boolean {
  const h = activeHand(s);
  return !!h && !h.done && (h.cards.length === 2 || s.rules.doubleAny) && (!h.fromSplit || s.rules.doubleAfterSplit);
}

export function canSplit(s: BlackjackState): boolean {
  const h = activeHand(s);
  return (
    !!h &&
    !h.done &&
    h.cards.length === 2 &&
    cardPoints(h.cards[0]) === cardPoints(h.cards[1]) &&
    s.hands.length < s.rules.maxHands &&
    !h.splitAces
  );
}

/** Starts a round: deals two cards each, the dealer's second face down, then resolves naturals. */
export function deal(state: BlackjackState, bet: number, random: Random): BlackjackState {
  if (state.phase !== "betting" && state.phase !== "settled") throw new Error("A round is in progress");
  if (bet < state.rules.minBet || bet > state.rules.maxBet) throw new Error("Bet out of limits");
  const s = clone(state);
  s.reshuffled = false;
  if (s.shoe.length < s.rules.decks * 52 * (1 - s.rules.penetration)) {
    s.shoe = newShoe(s.rules.decks, random);
    s.reshuffled = true;
  }
  const hand = newHand(bet);
  s.hands = [hand];
  s.dealer = [];
  s.active = 0;
  s.holeRevealed = false;
  hand.cards.push(draw(s));
  s.dealer.push(draw(s));
  hand.cards.push(draw(s));
  s.dealer.push(draw(s));
  s.phase = "player";

  // The dealer peeks for a natural; either natural ends the round at once.
  if (dealerNatural(s.dealer) || isNatural(hand)) return settle(s);
  return s;
}

/** Marks a finished hand and moves on to the next one, or to the dealer. */
function advance(s: BlackjackState): BlackjackState {
  const h = s.hands[s.active];
  if (h && !h.done && (handValue(h.cards).total >= 21 || isCharlie(s, h))) h.done = true;
  while (s.active < s.hands.length && s.hands[s.active].done) {
    s.active++;
    const next = s.hands[s.active];
    if (next && handValue(next.cards).total >= 21) next.done = true;
  }
  if (s.active < s.hands.length) return s;

  s.holeRevealed = true;
  const allBust = s.hands.every((x) => handValue(x.cards).total > 21);
  if (allBust) return settle(s);
  s.phase = "dealer";
  return s;
}

export function hit(state: BlackjackState): BlackjackState {
  if (!canHit(state)) return state;
  const s = clone(state);
  s.hands[s.active].cards.push(draw(s));
  return advance(s);
}

export function stand(state: BlackjackState): BlackjackState {
  if (!canHit(state)) return state;
  const s = clone(state);
  s.hands[s.active].done = true;
  return advance(s);
}

/** Doubles the active hand's bet (the caller charges the extra stake) for exactly one more card. */
export function double(state: BlackjackState): BlackjackState {
  if (!canDouble(state)) return state;
  const s = clone(state);
  const h = s.hands[s.active];
  h.bet *= 2;
  h.doubled = true;
  h.cards.push(draw(s));
  h.done = true;
  return advance(s);
}

/** Splits a pair into two hands with the same bet each (the caller charges the second stake). */
export function split(state: BlackjackState): BlackjackState {
  if (!canSplit(state)) return state;
  const s = clone(state);
  const h = s.hands[s.active];
  const aces = h.cards[0].rank === "A";
  const first = newHand(h.bet, [h.cards[0]], true);
  const second = newHand(h.bet, [h.cards[1]], true);
  first.cards.push(draw(s));
  second.cards.push(draw(s));
  if (aces) {
    first.splitAces = second.splitAces = true;
    first.done = second.done = true;
  }
  s.hands.splice(s.active, 1, first, second);
  return advance(s);
}

export function dealerShouldDraw(s: Pick<BlackjackState, "dealer" | "rules">): boolean {
  const v = handValue(s.dealer);
  return v.total < 17 || (v.total === 17 && v.soft && s.rules.dealerHitsSoft17);
}

/** One beat of the dealer's turn: draws a card if the rules require it, settles once done. */
export function dealerStep(state: BlackjackState): BlackjackState {
  if (state.phase !== "dealer") return state;
  const s = clone(state);
  if (dealerShouldDraw(s)) s.dealer.push(draw(s));
  return dealerShouldDraw(s) ? s : settle(s);
}

function settle(s: BlackjackState): BlackjackState {
  s.holeRevealed = true;
  s.phase = "settled";
  const dealer = handValue(s.dealer).total;
  const dealerBJ = dealerNatural(s.dealer);
  for (const h of s.hands) {
    const value = handValue(h.cards).total;
    h.done = true;
    if (value > 21) {
      h.outcome = "bust";
      h.payout = 0;
    } else if (isCharlie(s, h) && !dealerBJ) {
      h.outcome = "win";
      h.payout = h.bet * 2;
    } else if (isNatural(h)) {
      h.outcome = dealerBJ ? "push" : "blackjack";
      h.payout = dealerBJ ? h.bet : h.bet + Math.floor(h.bet * s.rules.blackjackPays);
    } else if (dealerBJ || (dealer <= 21 && dealer > value)) {
      h.outcome = "lose";
      h.payout = 0;
    } else if (dealer > 21 || value > dealer) {
      h.outcome = "win";
      h.payout = h.bet * 2;
    } else {
      h.outcome = "push";
      h.payout = h.bet;
    }
  }
  return s;
}

/** Total stake on the table this round. */
export const totalBet = (s: BlackjackState) => s.hands.reduce((sum, h) => sum + h.bet, 0);
export const totalPayout = (s: BlackjackState) => s.hands.reduce((sum, h) => sum + h.payout, 0);
