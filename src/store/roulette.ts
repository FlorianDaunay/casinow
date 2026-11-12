import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cryptoRandom } from "@/core/cards/playing";
import { familyOf, settle, spin, totalStake, type BetResult } from "@/core/roulette/engine";
import { currentRouletteModifiers } from "./collection";
import { useProfile } from "./profile";

export const ROULETTE_MIN = 10;
export const ROULETTE_MAX = 10000;

/** A spin whose ball is still rolling: already paid for, credited once it lands. */
export interface PendingSpin {
  number: number;
  results: BetResult[];
  staked: number;
  /** Table payouts (stakes included). */
  payout: number;
  /** Jetons added by atouts (win bonuses, zero refund, refunded loss). */
  bonus: number;
  /** A losing spin refunded by an atout. */
  refunded: boolean;
}

interface RouletteStore {
  bets: Record<string, number>;
  lastBets: Record<string, number>;
  /** Latest numbers, newest first. */
  history: number[];
  pending: PendingSpin | null;
  /** The last landed spin, shown until the next bet. */
  last: PendingSpin | null;
  /** Losing spins an atout can still refund this visit (not persisted). */
  freeLossesLeft: number;
  place: (key: string, amount: number) => boolean;
  clear: () => void;
  undo: (key: string) => void;
  rebet: () => boolean;
  /** Takes the stakes and draws the number; the ball lands later. */
  launch: () => PendingSpin | null;
  /** Credits the pending spin (called when the ball lands, or on return to the table). */
  resolve: () => void;
  startVisit: () => void;
}

export const useRoulette = create<RouletteStore>()(
  persist(
    (set, get) => ({
      bets: {},
      lastBets: {},
      history: [],
      pending: null,
      last: null,
      freeLossesLeft: 0,

      place: (key, amount) => {
        const { bets } = get();
        const total = totalStake(bets) + amount;
        if (total > ROULETTE_MAX || total > useProfile.getState().wallet.jetons) return false;
        set({ bets: { ...bets, [key]: (bets[key] ?? 0) + amount }, last: null });
        return true;
      },
      clear: () => set({ bets: {} }),
      undo: (key) => {
        const bets = { ...get().bets };
        delete bets[key];
        set({ bets });
      },
      rebet: () => {
        const { lastBets } = get();
        const total = totalStake(lastBets);
        if (!total || total > useProfile.getState().wallet.jetons) return false;
        set({ bets: { ...lastBets }, last: null });
        return true;
      },

      launch: () => {
        const { bets, pending } = get();
        const staked = totalStake(bets);
        if (pending || staked < ROULETTE_MIN || !useProfile.getState().spend("jetons", staked)) return null;
        const n = spin(cryptoRandom);
        const results = settle(bets, n);
        const payout = results.reduce((s, r) => s + r.payout, 0);
        const mods = currentRouletteModifiers();

        let bonus = 0;
        for (const r of results) {
          if (!r.won) continue;
          const fam = familyOf(r.bet);
          bonus += Math.floor((r.payout - r.stake) * (mods.winBonus + mods.onBet[fam]));
        }
        if (n === 0 && mods.zeroRefund) {
          bonus += Math.floor(results.filter((r) => !r.won).reduce((s, r) => s + r.stake, 0) * mods.zeroRefund);
        }
        let refunded = false;
        let freeLossesLeft = get().freeLossesLeft;
        if (payout + bonus < staked && freeLossesLeft > 0) {
          bonus = staked - payout;
          refunded = true;
          freeLossesLeft--;
        }

        const spinResult: PendingSpin = { number: n, results, staked, payout, bonus, refunded };
        set({ pending: spinResult, lastBets: { ...bets }, bets: {}, freeLossesLeft });
        return spinResult;
      },

      resolve: () => {
        const { pending, history } = get();
        if (!pending) return;
        useProfile.getState().earn("jetons", pending.payout + pending.bonus);
        set({ pending: null, last: pending, history: [pending.number, ...history].slice(0, 30) });
      },

      startVisit: () => set({ freeLossesLeft: currentRouletteModifiers().freeLosses }),
    }),
    {
      name: "casinow-roulette",
      version: 1,
      partialize: ({ bets, lastBets, history, pending }) => ({ bets, lastBets, history, pending }),
    }
  )
);
