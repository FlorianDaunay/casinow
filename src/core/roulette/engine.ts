import type { Random } from "@/core/cards/playing";

/**
 * European roulette: 37 pockets, a single zero. Pure functions: bets in, payouts out. The
 * wallet and the atouts are applied by the caller.
 */

/** Pocket order around the wheel, clockwise from the zero. */
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type PocketColor = "rouge" | "noir" | "vert";
export const colorOf = (n: number): PocketColor => (n === 0 ? "vert" : RED.has(n) ? "rouge" : "noir");

export type BetKind =
  | { type: "plein"; number: number }
  | { type: "douzaine"; index: 0 | 1 | 2 }
  | { type: "colonne"; index: 0 | 1 | 2 }
  | { type: "rouge" }
  | { type: "noir" }
  | { type: "pair" }
  | { type: "impair" }
  | { type: "manque" }
  | { type: "passe" };

/** The group a bet belongs to (for atouts that reward one kind of bet). */
export type BetFamily = "plein" | "douzaine" | "colonne" | "chance";

export const familyOf = (bet: BetKind): BetFamily =>
  bet.type === "plein" ? "plein" : bet.type === "douzaine" ? "douzaine" : bet.type === "colonne" ? "colonne" : "chance";

/** Stable key of a bet spot on the layout. */
export function betKey(bet: BetKind): string {
  if (bet.type === "plein") return `plein-${bet.number}`;
  if (bet.type === "douzaine" || bet.type === "colonne") return `${bet.type}-${bet.index}`;
  return bet.type;
}

export function parseBetKey(key: string): BetKind {
  const [type, arg] = key.split("-");
  if (type === "plein") return { type, number: Number(arg) };
  if (type === "douzaine" || type === "colonne") return { type, index: Number(arg) as 0 | 1 | 2 };
  return { type } as BetKind;
}

/** Winnings per unit staked, the stake itself excluded. */
export function payoutRatio(bet: BetKind): number {
  switch (bet.type) {
    case "plein":
      return 35;
    case "douzaine":
    case "colonne":
      return 2;
    default:
      return 1;
  }
}

export function covers(bet: BetKind, n: number): boolean {
  if (n === 0) return bet.type === "plein" && bet.number === 0;
  switch (bet.type) {
    case "plein":
      return bet.number === n;
    case "douzaine":
      return Math.floor((n - 1) / 12) === bet.index;
    case "colonne":
      return (n - 1) % 3 === bet.index;
    case "rouge":
      return RED.has(n);
    case "noir":
      return !RED.has(n);
    case "pair":
      return n % 2 === 0;
    case "impair":
      return n % 2 === 1;
    case "manque":
      return n <= 18;
    case "passe":
      return n >= 19;
  }
}

export const spin = (random: Random): number => Math.floor(random() * 37);

export interface BetResult {
  key: string;
  bet: BetKind;
  stake: number;
  won: boolean;
  /** Returned to the player (stake included); 0 on a loss. */
  payout: number;
}

/** Settles every bet on the layout against the winning number. */
export function settle(bets: Record<string, number>, n: number): BetResult[] {
  return Object.entries(bets)
    .filter(([, stake]) => stake > 0)
    .map(([key, stake]) => {
      const bet = parseBetKey(key);
      const won = covers(bet, n);
      return { key, bet, stake, won, payout: won ? stake * (payoutRatio(bet) + 1) : 0 };
    });
}

export const totalStake = (bets: Record<string, number>) => Object.values(bets).reduce((s, v) => s + v, 0);
