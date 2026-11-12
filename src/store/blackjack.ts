import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cryptoRandom } from "@/core/cards/playing";
import * as bj from "@/core/blackjack/engine";
import { currentBlackjackModifiers } from "./collection";
import { useProfile } from "./profile";

/** What the atouts and the house added on top of the table payouts in the last round. */
export interface RoundExtras {
  /** Jetons from win bonuses and bust refunds. */
  bonus: number;
  /** One sceau per natural blackjack. */
  sceaux: number;
}

/** Jetons the atouts add to a settled round: a share of each net win, a refund on each bust. */
export function atoutBonus(game: bj.BlackjackState, winBonus: number, bustRefund: number): number {
  let bonus = 0;
  for (const h of game.hands) {
    const net = h.payout - h.bet;
    if (net > 0) bonus += Math.floor(net * winBonus);
    if (h.outcome === "bust") bonus += Math.floor(h.bet * bustRefund);
  }
  return bonus;
}

interface BlackjackStore {
  game: bj.BlackjackState;
  /** Bet being built with chips before the deal. */
  pendingBet: number;
  lastBet: number;
  extras: RoundExtras | null;
  addChip: (value: number) => void;
  clearBet: () => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  dealerStep: () => void;
  /** Back to the betting phase after a settled round. */
  newRound: () => void;
}

/**
 * Glue between the pure engine and the wallet: stakes are taken from the profile before the
 * engine accepts them, and a settled round credits its payouts exactly once.
 */
export const useBlackjack = create<BlackjackStore>()(
  persist(
    (set, get) => {
      const apply = (next: bj.BlackjackState) => {
        const prev = get().game;
        set({ game: next });
        if (prev.phase !== "settled" && next.phase === "settled") {
          const mods = currentBlackjackModifiers();
          const bonus = atoutBonus(next, mods.winBonus, mods.bustRefund);
          const payout = bj.totalPayout(next) + bonus;
          const staked = bj.totalBet(next);
          const sceaux = next.hands.filter((h) => h.outcome === "blackjack").length;
          useProfile.getState().earn("jetons", payout);
          useProfile.getState().earn("sceaux", sceaux);
          set({ extras: { bonus, sceaux } });
          useProfile.getState().recordRound({
            hands: next.hands.length,
            won: next.hands.filter((h) => h.outcome === "win" || h.outcome === "blackjack").length,
            blackjacks: next.hands.filter((h) => h.outcome === "blackjack").length,
            net: payout - staked,
          });
        }
      };
      const stake = (amount: number) => useProfile.getState().spend("jetons", amount);

      return {
        game: bj.createGame(cryptoRandom),
        pendingBet: 0,
        lastBet: 0,
        extras: null,
        addChip: (value) => {
          const { pendingBet, game } = get();
          const jetons = useProfile.getState().wallet.jetons;
          const next = Math.min(pendingBet + value, game.rules.maxBet, jetons);
          set({ pendingBet: next });
        },
        clearBet: () => set({ pendingBet: 0 }),
        deal: () => {
          const { pendingBet, game } = get();
          if (pendingBet < game.rules.minBet || !stake(pendingBet)) return;
          const mods = currentBlackjackModifiers();
          // The table's rules follow the atouts equipped at the moment of the deal.
          const rules: bj.Rules = { ...bj.DEFAULT_RULES, blackjackPays: mods.blackjackPays, doubleAny: mods.doubleAny, charlie: mods.charlie };
          set({ lastBet: pendingBet, extras: null });
          apply(bj.deal({ ...game, rules }, pendingBet, cryptoRandom));
        },
        hit: () => apply(bj.hit(get().game)),
        stand: () => apply(bj.stand(get().game)),
        double: () => {
          const { game } = get();
          const hand = bj.activeHand(game);
          if (!hand || !bj.canDouble(game) || !stake(hand.bet)) return;
          apply(bj.double(game));
        },
        split: () => {
          const { game } = get();
          const hand = bj.activeHand(game);
          if (!hand || !bj.canSplit(game) || !stake(hand.bet)) return;
          apply(bj.split(game));
        },
        dealerStep: () => apply(bj.dealerStep(get().game)),
        newRound: () => {
          const { game, lastBet } = get();
          const jetons = useProfile.getState().wallet.jetons;
          set({
            game: { ...game, phase: "betting", hands: [], dealer: [], holeRevealed: false, active: 0 },
            pendingBet: Math.min(lastBet, jetons, game.rules.maxBet),
          });
        },
      };
    },
    {
      name: "casinow-blackjack",
      version: 2,
      partialize: ({ game, pendingBet, lastBet, extras }) => ({ game, pendingBet, lastBet, extras }),
      // v1 games predate the atout rules.
      migrate: (persisted) => {
        const state = persisted as { game?: bj.BlackjackState };
        if (state.game) state.game.rules = { ...bj.DEFAULT_RULES, ...state.game.rules };
        return state as never;
      },
    }
  )
);
