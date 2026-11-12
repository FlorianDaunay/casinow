import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cryptoRandom, type Card } from "@/core/cards/playing";
import { deal, draw, evaluate, MAX_COINS, payout, swap, type Deal, type HandRank } from "@/core/poker/engine";
import { currentPokerModifiers } from "./collection";
import { useProfile } from "./profile";

export const DENOMINATIONS = [10, 50, 100, 500] as const;

/**
 * betting → dealt (choose the cards to hold) → drawn (La Lune Noire may exchange a card)
 * → settled (paid; a win can go double or nothing).
 */
export type PokerPhase = "betting" | "dealt" | "drawn" | "settled";

export interface PokerResult {
  rank: HandRank;
  /** Table payout in jetons (stake included). */
  pay: number;
  /** Added by atouts. */
  bonus: number;
  /** A losing hand refunded by Le Bluff. */
  refunded: boolean;
}

export interface DoubleRound {
  dealer: Card;
  /** Four face-down cards; the player picks one. */
  choices: Card[];
  picked: number | null;
  stake: number;
  outcome: "win" | "push" | "lose" | null;
}

interface PokerStore {
  coins: number;
  denom: number;
  phase: PokerPhase;
  deal: Deal | null;
  /** Cards kept on the draw; the player taps the ones to replace. */
  held: boolean[];
  /** Exchanges left on this hand (La Lune Noire). */
  swapsLeft: number;
  result: PokerResult | null;
  double: DoubleRound | null;
  /** Per visit, not persisted. */
  refundsLeft: number;
  aceDue: boolean;
  setCoins: (n: number) => void;
  setDenom: (d: number) => void;
  toggleHold: (i: number) => void;
  setHeld: (held: boolean[]) => void;
  start: () => boolean;
  drawCards: () => void;
  exchange: (i: number) => void;
  /** Ends a hand after the draw (no more exchanges). */
  settle: () => void;
  startDouble: () => boolean;
  pickDouble: (i: number) => void;
  /** Back to betting, keeping the bet. */
  next: () => void;
  startVisit: () => void;
}

const bet = (s: Pick<PokerStore, "coins" | "denom">) => s.coins * s.denom;

/** Value for the double-or-nothing duel (ace high). */
const duelValue = (c: Card) => (c.rank === "A" ? 14 : c.rank === "R" ? 13 : c.rank === "D" ? 12 : c.rank === "V" ? 11 : Number(c.rank));

export const usePoker = create<PokerStore>()(
  persist(
    (set, get) => ({
      coins: MAX_COINS,
      denom: 10,
      phase: "betting",
      deal: null,
      held: [false, false, false, false, false],
      swapsLeft: 0,
      result: null,
      double: null,
      refundsLeft: 0,
      aceDue: false,

      setCoins: (coins) => get().phase === "betting" || get().phase === "settled" ? set({ coins }) : undefined,
      setDenom: (denom) => get().phase === "betting" || get().phase === "settled" ? set({ denom }) : undefined,
      toggleHold: (i) => {
        if (get().phase !== "dealt") return;
        set({ held: get().held.map((h, k) => (k === i ? !h : h)) });
      },
      setHeld: (held) => get().phase === "dealt" && set({ held }),

      start: () => {
        const s = get();
        if (s.phase !== "betting" && s.phase !== "settled") return false;
        if (!useProfile.getState().spend("jetons", bet(s))) return false;
        const d = deal(cryptoRandom, s.aceDue);
        set({ phase: "dealt", deal: d, held: [true, true, true, true, true], result: null, double: null, aceDue: false });
        return true;
      },

      drawCards: () => {
        const s = get();
        if (s.phase !== "dealt" || !s.deal) return;
        const d = draw(s.deal, s.held);
        const swapsLeft = currentPokerModifiers().swaps;
        set({ deal: d, phase: "drawn", swapsLeft });
        if (!swapsLeft) get().settle();
      },

      exchange: (i) => {
        const s = get();
        if (s.phase !== "drawn" || !s.deal || s.swapsLeft <= 0) return;
        set({ deal: swap(s.deal, i), swapsLeft: s.swapsLeft - 1 });
        if (s.swapsLeft - 1 <= 0) get().settle();
      },

      settle: () => {
        const s = get();
        if (s.phase !== "drawn" || !s.deal) return;
        const mods = currentPokerModifiers();
        const stake = bet(s);
        const rank = evaluate(s.deal.hand);
        const pay = payout(rank, s.coins) * s.denom;
        let bonus = Math.floor(Math.max(0, pay - stake) * mods.winBonus);
        if (rank === "valets") bonus += Math.floor(pay * mods.pairBonus);
        let refunded = false;
        let refundsLeft = s.refundsLeft;
        if (pay === 0 && refundsLeft > 0) {
          bonus = stake;
          refunded = true;
          refundsLeft--;
        }
        useProfile.getState().earn("jetons", pay + bonus);
        set({ phase: "settled", result: { rank, pay, bonus, refunded }, refundsLeft, swapsLeft: 0 });
      },

      startDouble: () => {
        const s = get();
        const won = s.result ? s.result.pay + s.result.bonus : 0;
        if (s.phase !== "settled" || !s.result || s.result.refunded || won <= 0) return false;
        if (s.double && s.double.outcome !== "win") return false;
        // The winnings go back on the table.
        if (!useProfile.getState().spend("jetons", won)) return false;
        const cards = deal(cryptoRandom).hand;
        set({ double: { dealer: cards[0], choices: cards.slice(1), picked: null, stake: won, outcome: null } });
        return true;
      },

      pickDouble: (i) => {
        const s = get();
        const d = s.double;
        if (!d || d.picked !== null || !s.result) return;
        const mine = duelValue(d.choices[i]);
        const theirs = duelValue(d.dealer);
        const outcome = mine > theirs ? "win" : mine === theirs ? "push" : "lose";
        const back = outcome === "win" ? d.stake * 2 : outcome === "push" ? d.stake : 0;
        useProfile.getState().earn("jetons", back);
        set({
          double: { ...d, picked: i, outcome },
          // The result now shows what the duel left.
          result: { ...s.result, pay: back, bonus: 0 },
        });
      },

      next: () => set({ phase: "betting", deal: null, result: null, double: null, held: [false, false, false, false, false] }),

      startVisit: () => {
        const m = currentPokerModifiers();
        set({ refundsLeft: m.refunds, aceDue: m.firstAce });
      },
    }),
    {
      name: "casinow-poker",
      version: 1,
      partialize: ({ coins, denom, phase, deal, held, swapsLeft, result, double }) => ({ coins, denom, phase, deal, held, swapsLeft, result, double }),
    }
  )
);

export const pokerBet = bet;
