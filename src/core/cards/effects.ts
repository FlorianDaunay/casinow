import { FAMILY_BONUS } from "./catalog";
import type { CardDef, Family, Power } from "./types";

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
  const powers: Power[] = [...new Map(equipped.map((c) => [c.id, c.power])).values(), ...completed.map((f) => FAMILY_BONUS[f].power)];
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
