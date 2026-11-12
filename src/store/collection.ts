import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BOOSTERS, dustValue, FORGE_COST, openBooster, type BoosterTier, type Pull } from "@/core/cards/booster";
import { CATALOG, cardsOfFamily, FAMILIES, FAMILY_BONUS, findCard, usableAt } from "@/core/cards/catalog";
import { blackjackModifiers, slotCount, type BlackjackModifiers } from "@/core/cards/effects";
import { cryptoRandom } from "@/core/cards/playing";
import { FINISHES, type CardDef, type Family, type Finish } from "@/core/cards/types";
import { useProfile } from "./profile";

export type Copies = Partial<Record<Finish, number>>;

export interface OpenedPull extends Pull {
  /** First copy of this card ever. */
  isNew: boolean;
}

export interface OpenResult {
  pulls: OpenedPull[];
  /** Families completed by this pack (their sceaux are already credited). */
  completed: Family[];
}

interface CollectionState {
  owned: Record<string, Copies>;
  /** Equipped atouts per open table. */
  loadout: { blackjack: string[] };
  packsOpened: number;
  /** Families whose completion gift was already given. */
  claimed: Family[];
  /** Free welcome packs left. */
  freePacks: number;
  open: (tier: BoosterTier) => OpenResult | null;
  /** Melts every copy beyond the first of each card; returns the poussière gained. */
  meltDuplicates: () => number;
  melt: (id: string, finish: Finish) => number;
  forge: (id: string) => Family[] | null;
  equip: (id: string) => boolean;
  unequip: (id: string) => void;
}

export const totalCopies = (copies: Copies | undefined) => FINISHES.reduce((n, f) => n + (copies?.[f] ?? 0), 0);

/** The rarest finish owned, to display a card at its best. */
export const bestFinish = (copies: Copies | undefined): Finish =>
  copies?.gravee ? "gravee" : copies?.holo ? "holo" : "standard";

export const completedFamilies = (owned: Record<string, Copies>): Family[] =>
  FAMILIES.filter((f) => cardsOfFamily(f).every((c) => totalCopies(owned[c.id]) > 0));

/**
 * The player's cards. Spending goes through the profile wallet first, so a pack is only
 * added once it has been paid for.
 */
export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => {
      /** Grants the gift of newly completed families and returns them. */
      const claimNew = (owned: Record<string, Copies>): Family[] => {
        const fresh = completedFamilies(owned).filter((f) => !get().claimed.includes(f));
        if (!fresh.length) return [];
        for (const f of fresh) useProfile.getState().earn("sceaux", FAMILY_BONUS[f].sceaux);
        set({ claimed: [...get().claimed, ...fresh] });
        return fresh;
      };

      return {
        owned: {},
        loadout: { blackjack: [] },
        packsOpened: 0,
        claimed: [],
        freePacks: 1,

        open: (tier) => {
          const { freePacks } = get();
          const free = tier === "salon" && freePacks > 0;
          const price = BOOSTERS[tier].price;
          if (!free && !useProfile.getState().spend(price.currency, price.amount)) return null;

          const pulls = openBooster(tier, cryptoRandom);
          const owned = { ...get().owned };
          const opened: OpenedPull[] = pulls.map((p) => {
            const copies = { ...owned[p.card.id] };
            const isNew = totalCopies(copies) === 0;
            copies[p.finish] = (copies[p.finish] ?? 0) + 1;
            owned[p.card.id] = copies;
            return { ...p, isNew };
          });
          set({ owned, packsOpened: get().packsOpened + 1, freePacks: free ? freePacks - 1 : freePacks });
          return { pulls: opened, completed: claimNew(owned) };
        },

        meltDuplicates: () => {
          const owned: Record<string, Copies> = {};
          let dust = 0;
          for (const [id, copies] of Object.entries(get().owned)) {
            const card = findCard(id);
            if (!card) continue;
            const keep = bestFinish(copies);
            for (const f of FINISHES) {
              const extra = (copies[f] ?? 0) - (f === keep ? 1 : 0);
              if (extra > 0) dust += extra * dustValue(card, f);
            }
            owned[id] = { [keep]: 1 };
          }
          if (dust) {
            set({ owned });
            useProfile.getState().earn("poussiere", dust);
          }
          return dust;
        },

        melt: (id, finish) => {
          const card = findCard(id);
          const copies = get().owned[id];
          // The last copy of a card is never melted.
          if (!card || !copies?.[finish] || totalCopies(copies) < 2) return 0;
          const dust = dustValue(card, finish);
          set({ owned: { ...get().owned, [id]: { ...copies, [finish]: copies[finish]! - 1 } } });
          useProfile.getState().earn("poussiere", dust);
          return dust;
        },

        forge: (id) => {
          const card = findCard(id);
          if (!card || !useProfile.getState().spend("poussiere", FORGE_COST[card.rarity])) return null;
          const copies = { ...get().owned[id] };
          copies.standard = (copies.standard ?? 0) + 1;
          const owned = { ...get().owned, [id]: copies };
          set({ owned });
          return claimNew(owned);
        },

        equip: (id) => {
          const { loadout, owned } = get();
          const card = findCard(id);
          const slots = slotCount(completedFamilies(owned));
          if (!card || !usableAt(card, "blackjack") || !totalCopies(owned[id])) return false;
          if (loadout.blackjack.includes(id) || loadout.blackjack.length >= slots) return false;
          set({ loadout: { blackjack: [...loadout.blackjack, id] } });
          return true;
        },

        unequip: (id) => {
          const { loadout } = get();
          set({ loadout: { blackjack: loadout.blackjack.filter((x) => x !== id) } });
        },
      };
    },
    {
      name: "casinow-collection",
      version: 1,
      partialize: ({ owned, loadout, packsOpened, claimed, freePacks }) => ({ owned, loadout, packsOpened, claimed, freePacks }),
    }
  )
);

/** Equipped atouts at the blackjack table, as cards. */
export const equippedCards = (state: Pick<CollectionState, "loadout">): CardDef[] =>
  state.loadout.blackjack.map((id) => findCard(id)).filter((c): c is CardDef => !!c);

export function currentBlackjackModifiers(): BlackjackModifiers {
  const s = useCollection.getState();
  return blackjackModifiers(equippedCards(s), completedFamilies(s.owned));
}

export const CATALOG_SIZE = CATALOG.length;
