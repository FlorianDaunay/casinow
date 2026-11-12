import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cryptoRandom } from "@/core/cards/playing";
import { spin, type SpinResult } from "@/core/slots/engine";
import { currentMachineModifiers } from "./collection";
import { useProfile } from "./profile";

export const BETS = [10, 20, 50, 100, 200, 500, 1000] as const;

/** Free spins added when three sceaux or more land during free spins. */
export const RETRIGGER = 5;

export interface PendingPull {
  result: SpinResult;
  bet: number;
  free: boolean;
  /** Jetons added by atouts. */
  bonus: number;
  /** Free spins this pull granted (sceaux, or the Festin atout). */
  granted: number;
  /** The Festin atout offered a spin on this pull. */
  gift: boolean;
}

interface MachineStore {
  bet: number;
  /** Free spins left, and the bet they are played at. */
  freeLeft: number;
  freeBet: number;
  /** Jetons won during the current free-spin round. */
  freeTotal: number;
  paidSpins: number;
  pending: PendingPull | null;
  setBet: (bet: number) => void;
  /** Takes the bet (unless the spin is free) and plays it; credited later by `resolve`. */
  launch: () => PendingPull | null;
  resolve: () => void;
  endFreeRound: () => void;
}

export const useMachines = create<MachineStore>()(
  persist(
    (set, get) => ({
      bet: 20,
      freeLeft: 0,
      freeBet: 20,
      freeTotal: 0,
      paidSpins: 0,
      pending: null,

      setBet: (bet) => set({ bet }),

      launch: () => {
        const s = get();
        if (s.pending) return null;
        const free = s.freeLeft > 0;
        const bet = free ? s.freeBet : s.bet;
        if (!free && !useProfile.getState().spend("jetons", bet)) return null;

        const mods = currentMachineModifiers();
        const result = spin(bet, cryptoRandom, { wildBoost: mods.wildBoost, free });
        const cascades = result.steps.slice(1).reduce((t, st) => t + st.amount, 0);
        const bonus =
          Math.floor(result.total * mods.winBonus) + Math.floor(cascades * mods.cascadeBonus) + (free ? Math.floor(result.total * mods.freeBonus) : 0);

        let granted = result.freeSpins ? (free ? RETRIGGER : result.freeSpins) : 0;
        const paidSpins = free ? s.paidSpins : s.paidSpins + 1;
        const gift = !free && mods.freeSpinEvery > 0 && paidSpins % mods.freeSpinEvery === 0;
        if (gift) granted += 1;

        const pull: PendingPull = { result, bet, free, bonus, granted, gift };
        set({
          pending: pull,
          paidSpins,
          freeLeft: (free ? s.freeLeft - 1 : s.freeLeft) + granted,
          freeBet: free ? s.freeBet : granted ? bet : s.freeBet,
          freeTotal: free ? s.freeTotal : granted ? 0 : s.freeTotal,
        });
        return pull;
      },

      resolve: () => {
        const { pending, freeTotal } = get();
        if (!pending) return;
        const won = pending.result.total + pending.bonus;
        useProfile.getState().earn("jetons", won);
        set({ pending: null, freeTotal: pending.free ? freeTotal + won : freeTotal });
      },

      endFreeRound: () => set({ freeTotal: 0 }),
    }),
    {
      name: "casinow-machines",
      version: 1,
      partialize: ({ bet, freeLeft, freeBet, freeTotal, paidSpins, pending }) => ({ bet, freeLeft, freeBet, freeTotal, paidSpins, pending }),
    }
  )
);
