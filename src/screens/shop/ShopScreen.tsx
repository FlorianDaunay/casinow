import { useState } from "react";
import { Booster } from "@/art/Booster";
import { CurrencyIcon } from "@/art/CurrencyIcon";
import { navigate } from "@/app/router";
import { sfx } from "@/audio/sfx";
import { SectionTitle } from "@/components/Ornaments";
import { TopBar } from "@/components/TopBar";
import { BOOSTERS, type BoosterTier } from "@/core/cards/booster";
import { RARITIES } from "@/core/cards/types";
import { MATERIALS } from "@/art/materials";
import { useCollection, type OpenResult } from "@/store/collection";
import { useProfile } from "@/store/profile";
import { PackOpening } from "./PackOpening";

const TIERS: BoosterTier[] = ["salon", "prestige", "arcane"];

function Odds({ tier }: { tier: BoosterTier }) {
  const odds = BOOSTERS[tier].odds;
  return (
    <p className="mt-3 text-center font-serif text-[0.8rem] italic leading-relaxed text-text-muted">
      {RARITIES.map((r) => `${MATERIALS[r].label} ${String(odds[r]).replace(".", ",")} %`).join(" · ")}
    </p>
  );
}

/** The boutique: three sealed packs, bought with jetons or sceaux. */
export function ShopScreen() {
  const wallet = useProfile((s) => s.wallet);
  const { freePacks, open } = useCollection();
  const [opening, setOpening] = useState<{ tier: BoosterTier; result: OpenResult; key: number } | null>(null);
  const [denied, setDenied] = useState<BoosterTier | null>(null);

  const affordable = (tier: BoosterTier) => {
    const p = BOOSTERS[tier].price;
    return (tier === "salon" && useCollection.getState().freePacks > 0) || useProfile.getState().wallet[p.currency] >= p.amount;
  };

  const buy = (tier: BoosterTier) => {
    const result = open(tier);
    if (!result) {
      setDenied(tier);
      window.setTimeout(() => setDenied(null), 1600);
      return;
    }
    sfx.chip(3);
    setOpening({ tier, result, key: Date.now() });
  };

  return (
    <div className="showcase-bg min-h-screen">
      <TopBar back title="BOUTIQUE" full />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-8">
        <SectionTitle numeral="◆" title="LA BOUTIQUE" subtitle="Paquets scellés de la Série I. Chaque carte est un atout pour les tables." />

        {freePacks > 0 && (
          <div className="mx-auto mb-12 max-w-md">
            <div className="panel-deco flex flex-col items-center gap-2 px-6 py-5 text-center">
              <span className="label-deco text-accent">Cadeau de bienvenue</span>
              <p className="font-serif text-lg italic text-text-secondary">Votre premier paquet Salon est offert par la maison.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-14 sm:grid-cols-3 sm:gap-8">
          {TIERS.map((tier) => {
            const def = BOOSTERS[tier];
            const free = tier === "salon" && freePacks > 0;
            const ok = free || wallet[def.price.currency] >= def.price.amount;
            return (
              <div key={tier} className="flex flex-col items-center">
                <button className="booster-float shop-pack" style={{ width: "min(56vw, 210px)" }} onClick={() => buy(tier)} aria-label={`Ouvrir ${def.name}`}>
                  <Booster tier={tier} />
                </button>
                <h3 className="mt-6 font-display text-2xl tracking-[0.1em]">{def.name}</h3>
                <p className="mt-1 font-serif text-base italic text-text-secondary">{def.guarantee}</p>
                <button className={`btn mt-5 ${ok ? "btn-gold" : "btn-ghost opacity-50"} ${denied === tier ? "shake" : ""}`} onClick={() => buy(tier)}>
                  {free ? (
                    "Offert"
                  ) : (
                    <>
                      {def.price.amount.toLocaleString("fr-FR")}
                      <CurrencyIcon currency={def.price.currency} size={18} />
                    </>
                  )}
                </button>
                <Odds tier={tier} />
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-14 max-w-lg text-center font-serif text-base italic text-text-muted">
          Chaque paquet contient au moins une carte rare. Les chances affichées valent pour les quatre premières cartes ; la cinquième porte la garantie.
          Chaque blackjack naturel rapporte un sceau.
        </p>
      </main>

      {opening && (
        <PackOpening
          key={opening.key}
          tier={opening.tier}
          result={opening.result}
          canAgain={affordable(opening.tier)}
          onAgain={() => buy(opening.tier)}
          onCollection={() => {
            setOpening(null);
            navigate("collection");
          }}
          onClose={() => setOpening(null)}
        />
      )}
    </div>
  );
}
