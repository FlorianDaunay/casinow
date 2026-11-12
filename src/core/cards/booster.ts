import type { Random } from "./playing";
import { CATALOG } from "./catalog";
import { RARITIES, type CardDef, type Finish, type Rarity } from "./types";

export type BoosterTier = "salon" | "prestige" | "arcane";

type Odds = Record<Rarity, number>;

export interface BoosterDef {
  tier: BoosterTier;
  name: string;
  /** What it costs and in which currency. */
  price: { currency: "jetons" | "sceaux"; amount: number };
  cards: number;
  /** Odds of every slot but the last. */
  odds: Odds;
  /** Odds of the last slot (where a guarantee lives). */
  lastOdds: Odds;
  /** One line printed on the pack. */
  guarantee: string;
}

export const BOOSTERS: Record<BoosterTier, BoosterDef> = {
  salon: {
    tier: "salon",
    name: "Le Salon",
    price: { currency: "jetons", amount: 500 },
    cards: 5,
    odds: { commune: 72, rare: 22.5, epique: 4.6, legendaire: 0.8, mythique: 0.1 },
    lastOdds: { commune: 0, rare: 80, epique: 17, legendaire: 2.6, mythique: 0.4 },
    guarantee: "5 cartes · 1 rare garantie",
  },
  prestige: {
    tier: "prestige",
    name: "Prestige",
    price: { currency: "jetons", amount: 2500 },
    cards: 5,
    odds: { commune: 62, rare: 30, epique: 6.6, legendaire: 1.2, mythique: 0.2 },
    lastOdds: { commune: 0, rare: 0, epique: 88, legendaire: 10.5, mythique: 1.5 },
    guarantee: "5 cartes · 1 épique garantie",
  },
  arcane: {
    tier: "arcane",
    name: "Arcanes",
    price: { currency: "sceaux", amount: 5 },
    cards: 5,
    odds: { commune: 52, rare: 36, epique: 10, legendaire: 1.8, mythique: 0.2 },
    lastOdds: { commune: 0, rare: 0, epique: 0, legendaire: 92, mythique: 8 },
    guarantee: "5 cartes · 1 légendaire garantie",
  },
};

/** Chances of each finish, independent of rarity. */
export const FINISH_ODDS: Record<Finish, number> = { standard: 90.5, holo: 7, gravee: 2.5 };

export interface Pull {
  card: CardDef;
  finish: Finish;
}

function pick<K extends string>(weights: Record<K, number>, random: Random): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = random() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

const POOL = Object.fromEntries(RARITIES.map((r) => [r, CATALOG.filter((c) => c.rarity === r)])) as Record<Rarity, CardDef[]>;

/** Opens a pack. Every pack holds at least a rare (its last slot); cards come back best last. */
export function openBooster(tier: BoosterTier, random: Random): Pull[] {
  const def = BOOSTERS[tier];
  const rarities: Rarity[] = [];
  for (let i = 0; i < def.cards; i++) rarities.push(pick(i === def.cards - 1 ? def.lastOdds : def.odds, random));

  return rarities
    .map((rarity) => {
      const pool = POOL[rarity];
      return { card: pool[Math.floor(random() * pool.length)], finish: pick(FINISH_ODDS, random) };
    })
    .sort((a, b) => RARITIES.indexOf(a.card.rarity) - RARITIES.indexOf(b.card.rarity));
}

/** Poussière d'or given when melting one copy. */
export const DUST_VALUE: Record<Rarity, number> = { commune: 5, rare: 20, epique: 80, legendaire: 400, mythique: 1600 };
export const FINISH_DUST_FACTOR: Record<Finish, number> = { standard: 1, holo: 2, gravee: 3 };
/** Poussière d'or needed to forge a standard copy of a card. */
export const FORGE_COST: Record<Rarity, number> = { commune: 40, rare: 160, epique: 640, legendaire: 3200, mythique: 12800 };

export const dustValue = (card: CardDef, finish: Finish) => DUST_VALUE[card.rarity] * FINISH_DUST_FACTOR[finish];
