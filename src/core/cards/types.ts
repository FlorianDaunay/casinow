export const RARITIES = ["commune", "rare", "epique", "legendaire", "mythique"] as const;
export type Rarity = (typeof RARITIES)[number];

export const FINISHES = ["standard", "holo", "gravee"] as const;
/** Finish printed on top of a card's rarity: holographic foil, or gold-engraved line art. */
export type Finish = (typeof FINISHES)[number];

export type Emblem = "soleil" | "lune" | "oeil" | "cle" | "couronne" | "pique" | "de" | "sablier" | "coupe" | "etoile";

/** Which table an "atout" works at. */
export type Table = "blackjack" | "roulette" | "machines" | "poker" | "tout";

/** Tables where atouts can be equipped (the ones that are open). */
export const PLAYABLE_TABLES = ["blackjack", "roulette", "machines", "poker"] as const;
export type PlayableTable = (typeof PLAYABLE_TABLES)[number];

export type Family = "La Maison" | "Les Astres" | "Les Tricheurs" | "Le Banquet" | "Les Horlogers";

/**
 * What an atout does, as data the games read. `future` marks powers for tables that are not
 * open yet: the card is collectible, its text describes what it will do.
 */
export type Power =
  | { kind: "win-bonus"; pct: number; table: "blackjack" | "tout" }
  | { kind: "bust-refund"; pct: number }
  | { kind: "natural-pays"; value: number }
  | { kind: "double-any" }
  | { kind: "charlie" }
  | { kind: "peek"; uses: number }
  | { kind: "slot" }
  /** Extra share of the net win at one game, optionally on one kind of win only. */
  | { kind: "game-bonus"; game: "roulette" | "machines" | "poker"; pct: number; on?: "douzaine" | "chance" | "plein" | "cascade" | "free" | "valets" }
  /** Roulette: share of the losing stakes given back when the zero falls. */
  | { kind: "zero-refund"; pct: number }
  /** Roulette: the first losing spins of a visit are refunded. */
  | { kind: "free-loss"; uses: number }
  /** Machines: jokers land more often. */
  | { kind: "wild-boost" }
  /** Machines: one free spin every N paid spins. */
  | { kind: "free-spin-every"; spins: number }
  /** Video poker: after the draw, exchange one card (per hand). */
  | { kind: "swap"; uses: number }
  /** Video poker: losing hands refunded per visit. */
  | { kind: "poker-refund"; uses: number }
  /** Video poker: the first hand of a visit holds an ace. */
  | { kind: "first-ace" }
  | { kind: "future"; text: string };

export interface CardDef {
  id: string;
  /** Position in its series, printed as N° 07. */
  number: number;
  name: string;
  /** Family / set the card belongs to (set bonuses come from completing it). */
  family: Family;
  rarity: Rarity;
  emblem: Emblem;
  table: Table;
  power: Power;
  /** Rules text of the atout (derived from `power`). */
  effect: string;
}
