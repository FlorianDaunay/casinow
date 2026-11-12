export const RARITIES = ["commune", "rare", "epique", "legendaire", "mythique"] as const;
export type Rarity = (typeof RARITIES)[number];

export const FINISHES = ["standard", "holo", "gravee"] as const;
/** Finish printed on top of a card's rarity: holographic foil, or gold-engraved line art. */
export type Finish = (typeof FINISHES)[number];

export type Emblem = "soleil" | "lune" | "oeil" | "cle" | "couronne" | "pique" | "de" | "sablier" | "coupe" | "etoile";

/** Which table an "atout" works at. */
export type Table = "blackjack" | "roulette" | "machines" | "poker" | "tout";

/** Tables where atouts can be equipped (the ones that are open). */
export type PlayableTable = "blackjack";

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
