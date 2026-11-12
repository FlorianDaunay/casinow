import { RANKS, shuffle, SUITS, type Card, type Random } from "@/core/cards/playing";

/**
 * Video poker "Valets ou mieux" (Jacks or Better), 8/5 pay table: about 97.3 % returned with
 * perfect play, so the house keeps its edge until atouts tip it. Pure functions; the wallet
 * and the atouts are applied by the caller.
 */

export const HANDS = ["royale", "quinte-flush", "carre", "full", "couleur", "quinte", "brelan", "deux-paires", "valets", "rien"] as const;
export type HandRank = (typeof HANDS)[number];

export const HAND_LABEL: Record<HandRank, string> = {
  royale: "Quinte flush royale",
  "quinte-flush": "Quinte flush",
  carre: "Carré",
  full: "Full",
  couleur: "Couleur",
  quinte: "Quinte",
  brelan: "Brelan",
  "deux-paires": "Deux paires",
  valets: "Valets ou mieux",
  rien: "Rien",
};

/** Credits returned per credit bet (stake included). */
export const PAYTABLE: Record<HandRank, number> = {
  royale: 250,
  "quinte-flush": 50,
  carre: 25,
  full: 8,
  couleur: 5,
  quinte: 4,
  brelan: 3,
  "deux-paires": 2,
  valets: 1,
  rien: 0,
};

/** A royal flush at maximum bet pays 800 per credit instead of 250. */
export const MAX_COINS = 5;
export const ROYAL_MAX = 800;

export function payout(rank: HandRank, coins: number): number {
  return rank === "royale" && coins === MAX_COINS ? ROYAL_MAX * coins : PAYTABLE[rank] * coins;
}

/** Rank value 2..14 (ace high). */
const value = (c: Card) => (c.rank === "A" ? 14 : c.rank === "R" ? 13 : c.rank === "D" ? 12 : c.rank === "V" ? 11 : Number(c.rank));

/** Classifies a five-card hand. */
export function evaluate(hand: Card[]): HandRank {
  const vals = hand.map(value).sort((a, b) => a - b);
  const flush = hand.every((c) => c.suit === hand[0].suit);
  const unique = new Set(vals).size === 5;
  const wheel = vals.join() === "2,3,4,5,14";
  const straight = unique && (vals[4] - vals[0] === 4 || wheel);
  if (straight && flush) return vals[0] === 10 ? "royale" : "quinte-flush";
  const counts = new Map<number, number>();
  for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  if (groups[0] === 4) return "carre";
  if (groups[0] === 3 && groups[1] === 2) return "full";
  if (flush) return "couleur";
  if (straight) return "quinte";
  if (groups[0] === 3) return "brelan";
  if (groups[0] === 2 && groups[1] === 2) return "deux-paires";
  if (groups[0] === 2) {
    const pair = [...counts.entries()].find(([, n]) => n === 2)![0];
    return pair >= 11 ? "valets" : "rien";
  }
  return "rien";
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, id: id++ });
  return deck;
}

export interface Deal {
  hand: Card[];
  /** Cards left to draw from, in order. */
  deck: Card[];
}

/** Shuffles a fresh deck and deals five cards; `withAce` forces an ace among them (atout). */
export function deal(random: Random, withAce = false): Deal {
  const deck = shuffle(fullDeck(), random);
  const hand = deck.slice(0, 5);
  let rest = deck.slice(5);
  if (withAce && !hand.some((c) => c.rank === "A")) {
    const i = rest.findIndex((c) => c.rank === "A");
    const slot = Math.floor(random() * 5);
    const ace = rest[i];
    rest = [...rest.slice(0, i), hand[slot], ...rest.slice(i + 1)];
    hand[slot] = ace;
  }
  return { hand, deck: rest };
}

/** Replaces every card not held with the next cards of the deck. */
export function draw(d: Deal, held: boolean[]): Deal {
  const deck = [...d.deck];
  const hand = d.hand.map((c, i) => (held[i] ? c : deck.shift()!));
  return { hand, deck };
}

/** Exchanges one card for the next one of the deck (La Lune Noire). */
export function swap(d: Deal, index: number): Deal {
  const deck = [...d.deck];
  const hand = d.hand.map((c, i) => (i === index ? deck.shift()! : c));
  return { hand, deck };
}

/* Strategy -------------------------------------------------------------------- */
/*
 * The strategy functions evaluate millions of hands, so they work on cards encoded as
 * integers (rank × 4 + suit, rank 0 = deuce … 12 = ace) and avoid any allocation.
 */

const code = (c: Card) => (value(c) - 2) * 4 + SUITS.indexOf(c.suit);
const counts = new Uint8Array(13);
const WHEEL = 0b1000000001111;

/** Credits per credit bet of five encoded cards (8/5 table, royal at 800 for max bet). */
function payFast(a: number, b: number, c: number, d: number, e: number, coins: number): number {
  counts.fill(0);
  let mask = 0;
  for (const x of [a, b, c, d, e]) {
    const r = x >> 2;
    counts[r]++;
    mask |= 1 << r;
  }
  const s = a & 3;
  const flush = (b & 3) === s && (c & 3) === s && (d & 3) === s && (e & 3) === s;
  let pairs = 0;
  let trips = false;
  let quads = false;
  let highPair = false;
  for (let r = 0; r < 13; r++) {
    const n = counts[r];
    if (n === 2) {
      pairs++;
      if (r >= 9) highPair = true;
    } else if (n === 3) trips = true;
    else if (n === 4) quads = true;
  }
  const distinct = !pairs && !trips && !quads;
  let straight = false;
  if (distinct) {
    const low = 31 - Math.clz32(mask & -mask);
    straight = mask >> low === 0b11111 || mask === WHEEL;
  }
  if (straight && flush) return mask === 0b1111100000000 ? (coins === MAX_COINS ? ROYAL_MAX : PAYTABLE.royale) : PAYTABLE["quinte-flush"];
  if (quads) return PAYTABLE.carre;
  if (trips && pairs) return PAYTABLE.full;
  if (flush) return PAYTABLE.couleur;
  if (straight) return PAYTABLE.quinte;
  if (trips) return PAYTABLE.brelan;
  if (pairs === 2) return PAYTABLE["deux-paires"];
  return highPair ? PAYTABLE.valets : 0;
}

function unseenCodes(hand: Card[]): number[] {
  const seen = new Set(hand.map(code));
  const out: number[] = [];
  for (let x = 0; x < 52; x++) if (!seen.has(x)) out.push(x);
  return out;
}

/** Average pay of `kept` completed by every possible draw from `pool`. */
function averageDraw(kept: number[], pool: number[], coins: number): number {
  const n = pool.length;
  const k = kept;
  let total = 0;
  let count = 0;
  switch (5 - k.length) {
    case 0:
      return payFast(k[0], k[1], k[2], k[3], k[4], coins);
    case 1:
      for (let i = 0; i < n; i++) (total += payFast(k[0], k[1], k[2], k[3], pool[i], coins)), count++;
      break;
    case 2:
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) (total += payFast(k[0], k[1], k[2], pool[i], pool[j], coins)), count++;
      break;
    case 3:
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) for (let l = j + 1; l < n; l++) (total += payFast(k[0], k[1], pool[i], pool[j], pool[l], coins)), count++;
      break;
    case 4:
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          for (let l = j + 1; l < n; l++) for (let m = l + 1; m < n; m++) (total += payFast(k[0], pool[i], pool[j], pool[l], pool[m], coins)), count++;
      break;
    default:
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          for (let l = j + 1; l < n; l++)
            for (let m = l + 1; m < n; m++) for (let o = m + 1; o < n; o++) (total += payFast(pool[i], pool[j], pool[l], pool[m], pool[o], coins)), count++;
  }
  return total / count;
}

/**
 * Expected credits (per credit bet) of keeping `held` from `hand`, drawing from every card
 * not in the hand. Exact: every possible draw is evaluated.
 */
export function holdValue(hand: Card[], held: boolean[], coins = 1): number {
  const codes = hand.map(code);
  return averageDraw(
    codes.filter((_, i) => held[i]),
    unseenCodes(hand),
    coins
  );
}

/** The hold with the best expected return, and that return (the "Conseil" button). */
export function bestHold(hand: Card[], coins = 1): { held: boolean[]; ev: number } {
  let best = { held: [false, false, false, false, false], ev: -1 };
  for (let mask = 0; mask < 32; mask++) {
    const held = [0, 1, 2, 3, 4].map((i) => !!(mask & (1 << i)));
    const ev = holdValue(hand, held, coins);
    if (ev > best.ev + 1e-12) best = { held, ev };
  }
  return best;
}

/**
 * La Lune Noire, after the draw: which card to exchange, if any. Compares the made hand with
 * the average of replacing each card by every card still unseen.
 */
export function bestSwap(hand: Card[], unseenDeck: Card[], coins = 1): { index: number; ev: number; keep: number } {
  const codes = hand.map(code);
  const pool = unseenDeck.map(code);
  const keep = averageDraw(codes, pool, coins);
  let best = { index: -1, ev: keep, keep };
  for (let i = 0; i < 5; i++) {
    const ev = averageDraw(
      codes.filter((_, k) => k !== i),
      pool,
      coins
    );
    if (ev > best.ev + 1e-12) best = { index: i, ev, keep };
  }
  return best;
}
