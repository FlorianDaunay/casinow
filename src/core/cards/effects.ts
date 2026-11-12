import { FAMILY_BONUS } from "./catalog";
import type { CardDef, Family, Power } from "./types";

const powersOf = (equipped: CardDef[], completed: Family[]): Power[] => [
  ...new Map(equipped.map((c) => [c.id, c.power])).values(),
  ...completed.map((f) => FAMILY_BONUS[f].power),
];

/** Base number of atout slots at a table. */
export const BASE_SLOTS = 3;

/** Everything the blackjack table needs to know about the player's atouts. */
export interface BlackjackModifiers {
  /** Extra share of the net win of every winning hand (0.05 = +5 %). */
  winBonus: number;
  /** Share of the stake refunded on a busted hand. */
  bustRefund: number;
  /** Extra paid on a natural, as a fraction of the bet. */
  blackjackPays: number;
  doubleAny: boolean;
  charlie: boolean;
  /** Hole-card reveals available per visit. */
  peekUses: number;
}

export const NO_MODIFIERS: BlackjackModifiers = {
  winBonus: 0,
  bustRefund: 0,
  blackjackPays: 1.5,
  doubleAny: false,
  charlie: false,
  peekUses: 0,
};

/**
 * Combines the equipped atouts and the bonuses of completed families. Percentages add up,
 * the best natural payout wins, and each card's power counts once even if equipped twice.
 */
export function blackjackModifiers(equipped: CardDef[], completed: Family[]): BlackjackModifiers {
  const powers = powersOf(equipped, completed);
  const m = { ...NO_MODIFIERS };
  for (const p of powers) {
    switch (p.kind) {
      case "win-bonus":
        m.winBonus += p.pct / 100;
        break;
      case "bust-refund":
        m.bustRefund += p.pct / 100;
        break;
      case "natural-pays":
        m.blackjackPays = Math.max(m.blackjackPays, p.value);
        break;
      case "double-any":
        m.doubleAny = true;
        break;
      case "charlie":
        m.charlie = true;
        break;
      case "peek":
        m.peekUses += p.uses;
        break;
      default:
        break;
    }
  }
  m.bustRefund = Math.min(m.bustRefund, 0.5);
  return m;
}

export const slotCount = (completed: Family[]) =>
  BASE_SLOTS + completed.filter((f) => FAMILY_BONUS[f].power.kind === "slot").length;

export interface RouletteModifiers {
  /** Extra share of every net win. */
  winBonus: number;
  /** Extra share of the net win by kind of bet. */
  onBet: { douzaine: number; colonne: number; chance: number; plein: number };
  /** Share of losing stakes refunded when the zero falls. */
  zeroRefund: number;
  /** Losing spins refunded per visit. */
  freeLosses: number;
}

export function rouletteModifiers(equipped: CardDef[], completed: Family[]): RouletteModifiers {
  const m: RouletteModifiers = { winBonus: 0, onBet: { douzaine: 0, colonne: 0, chance: 0, plein: 0 }, zeroRefund: 0, freeLosses: 0 };
  for (const p of powersOf(equipped, completed)) {
    if (p.kind === "win-bonus" && p.table === "tout") m.winBonus += p.pct / 100;
    else if (p.kind === "game-bonus" && p.game === "roulette") {
      if (p.on === "douzaine" || p.on === "chance" || p.on === "plein") m.onBet[p.on] += p.pct / 100;
      else m.winBonus += p.pct / 100;
    } else if (p.kind === "zero-refund") m.zeroRefund = Math.min(1, m.zeroRefund + p.pct / 100);
    else if (p.kind === "free-loss") m.freeLosses += p.uses;
  }
  return m;
}

export interface MachineModifiers {
  winBonus: number;
  /** Extra share of what cascades after the first fall win. */
  cascadeBonus: number;
  /** Extra share of free-spin wins. */
  freeBonus: number;
  wildBoost: boolean;
  /** A free spin every N paid spins (0 = never). */
  freeSpinEvery: number;
}

export function machineModifiers(equipped: CardDef[], completed: Family[]): MachineModifiers {
  const m: MachineModifiers = { winBonus: 0, cascadeBonus: 0, freeBonus: 0, wildBoost: false, freeSpinEvery: 0 };
  for (const p of powersOf(equipped, completed)) {
    if (p.kind === "win-bonus" && p.table === "tout") m.winBonus += p.pct / 100;
    else if (p.kind === "game-bonus" && p.game === "machines") {
      if (p.on === "cascade") m.cascadeBonus += p.pct / 100;
      else if (p.on === "free") m.freeBonus += p.pct / 100;
      else m.winBonus += p.pct / 100;
    } else if (p.kind === "wild-boost") m.wildBoost = true;
    else if (p.kind === "free-spin-every") m.freeSpinEvery = m.freeSpinEvery ? Math.min(m.freeSpinEvery, p.spins) : p.spins;
  }
  return m;
}
