import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/art/CurrencyIcon";

export const STARTING_JETONS = 5000;
/** Below this, the house offers a credit so the player is never stuck. */
export const HOUSE_CREDIT_THRESHOLD = 10;
export const HOUSE_CREDIT = 1000;

export interface Stats {
  handsPlayed: number;
  handsWon: number;
  blackjacks: number;
  /** Largest net gain of a single round. */
  biggestWin: number;
}

interface ProfileState {
  wallet: Record<Currency, number>;
  stats: Stats;
  /** Sound effects off. */
  muted: boolean;
  /** Background music on. */
  musicOn: boolean;
  /** Takes `amount` of a currency; returns false (and changes nothing) if the balance is short. */
  spend: (currency: Currency, amount: number) => boolean;
  earn: (currency: Currency, amount: number) => void;
  recordRound: (round: { hands: number; won: number; blackjacks: number; net: number }) => void;
  takeHouseCredit: () => void;
  setMuted: (muted: boolean) => void;
  setMusicOn: (on: boolean) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      wallet: { jetons: STARTING_JETONS, poussiere: 0, sceaux: 0 },
      stats: { handsPlayed: 0, handsWon: 0, blackjacks: 0, biggestWin: 0 },
      muted: false,
      musicOn: true,
      spend: (currency, amount) => {
        const { wallet } = get();
        if (amount < 0 || wallet[currency] < amount) return false;
        set({ wallet: { ...wallet, [currency]: wallet[currency] - amount } });
        return true;
      },
      earn: (currency, amount) => {
        if (amount <= 0) return;
        const { wallet } = get();
        set({ wallet: { ...wallet, [currency]: wallet[currency] + amount } });
      },
      recordRound: ({ hands, won, blackjacks, net }) => {
        const s = get().stats;
        set({
          stats: {
            handsPlayed: s.handsPlayed + hands,
            handsWon: s.handsWon + won,
            blackjacks: s.blackjacks + blackjacks,
            biggestWin: Math.max(s.biggestWin, net),
          },
        });
      },
      takeHouseCredit: () => {
        const { wallet } = get();
        if (wallet.jetons >= HOUSE_CREDIT_THRESHOLD) return;
        set({ wallet: { ...wallet, jetons: wallet.jetons + HOUSE_CREDIT } });
      },
      setMuted: (muted) => set({ muted }),
      setMusicOn: (musicOn) => set({ musicOn }),
    }),
    { name: "casinow-profile", version: 1 }
  )
);
