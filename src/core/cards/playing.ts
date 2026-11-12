/** The standard 52-card deck used at the tables. */
export const SUITS = ["pique", "coeur", "carreau", "trefle"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R"] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
  /** Unique within a shoe, so the UI can key and animate each physical card. */
  id: number;
}

/** Uniform random in [0, 1): injected so the engines stay testable. */
export type Random = () => number;

export const cryptoRandom: Random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;

/** Fisher-Yates shuffle, in place. */
export function shuffle<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** `decks` full decks, shuffled. */
export function newShoe(decks: number, random: Random): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (let d = 0; d < decks; d++) for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit, id: id++ });
  return shuffle(cards, random);
}
