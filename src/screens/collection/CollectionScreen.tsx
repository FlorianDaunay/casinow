import { useMemo, useState, type CSSProperties } from "react";
import { CurrencyIcon } from "@/art/CurrencyIcon";
import { MATERIALS } from "@/art/materials";
import { navigate } from "@/app/router";
import { sfx } from "@/audio/sfx";
import { CollectibleCard } from "@/components/CollectibleCard";
import { DecoRule } from "@/components/Ornaments";
import { TopBar } from "@/components/TopBar";
import { dustValue, FORGE_COST } from "@/core/cards/booster";
import { CATALOG, cardsOfFamily, describePower, FAMILIES, FAMILY_BONUS, usableAt } from "@/core/cards/catalog";
import { blackjackModifiers, slotCount, type BlackjackModifiers } from "@/core/cards/effects";
import { FINISHES, type CardDef, type Finish } from "@/core/cards/types";
import { bestFinish, completedFamilies, equippedCards, totalCopies, useCollection, type Copies } from "@/store/collection";
import { useProfile } from "@/store/profile";

const FINISH_LABEL: Record<Finish, string> = { standard: "Standard", holo: "Holo", gravee: "Gravée or" };
const TABLE_LABEL = { blackjack: "Blackjack", roulette: "Roulette", machines: "Machines", poker: "Vidéo poker", tout: "Toutes tables" } as const;

/** One-line summary of what the equipped atouts do, in plain words. */
function summarize(m: BlackjackModifiers): string[] {
  const out: string[] = [];
  if (m.winBonus) out.push(`+${Math.round(m.winBonus * 100)} % sur les gains`);
  if (m.bustRefund) out.push(`${Math.round(m.bustRefund * 100)} % remboursés si dépassé`);
  if (m.blackjackPays > 1.5) out.push(`blackjack payé ${m.blackjackPays} pour 1`);
  if (m.doubleAny) out.push("double libre");
  if (m.charlie) out.push("cinq cartes gagnent");
  if (m.peekUses) out.push(`œil du croupier ×${m.peekUses}`);
  return out;
}

/** An unowned card: its place in the album, number and rarity only. */
function Silhouette({ card, width }: { card: CardDef; width: number }) {
  const m = MATERIALS[card.rarity];
  return (
    <div className="silhouette" style={{ width, "--glow": m.glow } as CSSProperties}>
      <span className="font-deco text-[0.6rem] tracking-[0.25em] text-text-muted">N° {String(card.number).padStart(2, "0")}</span>
      <span className="font-display text-4xl text-text-muted/50">?</span>
      <span className="flex gap-1">
        {Array.from({ length: m.pips }, (_, i) => (
          <span key={i} className="block h-1.5 w-1.5 rotate-45" style={{ background: m.glow, opacity: 0.5 }} />
        ))}
      </span>
    </div>
  );
}

function CardTile({ card, copies, equipped, width, onOpen }: { card: CardDef; copies?: Copies; equipped: boolean; width: number; onOpen: () => void }) {
  const n = totalCopies(copies);
  return (
    <button className="relative flex flex-col items-center" onClick={onOpen} aria-label={card.name}>
      {n > 0 ? <CollectibleCard card={card} finish={bestFinish(copies)} width={width} interactive={false} /> : <Silhouette card={card} width={width} />}
      {n > 1 && <span className="tile-badge right-1 top-1">×{n}</span>}
      {equipped && <span className="tile-badge tile-equipped left-1 top-1">Atout</span>}
    </button>
  );
}

function CardDetail({ card, onClose }: { card: CardDef; onClose: () => void }) {
  const { owned, loadout, equip, unequip, melt, forge } = useCollection();
  const dust = useProfile((s) => s.wallet.poussiere);
  const copies = owned[card.id];
  const n = totalCopies(copies);
  const m = MATERIALS[card.rarity];
  const isEquipped = loadout.blackjack.includes(card.id);
  const slots = slotCount(completedFamilies(owned));
  const usable = usableAt(card, "blackjack");
  const cost = FORGE_COST[card.rarity];
  // Melt the commonest finish first.
  const meltable = FINISHES.find((f) => (copies?.[f] ?? 0) > 0 && n > 1);
  const [width] = useState(() => Math.min(300, window.innerWidth * 0.66, (window.innerHeight - 330) / 1.4));

  return (
    <div className="detail-scene fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-5 py-10" onClick={(e) => e.stopPropagation()}>
        {n > 0 ? <CollectibleCard card={card} finish={bestFinish(copies)} width={width} /> : <Silhouette card={card} width={width} />}

        <div className="flex max-w-md flex-col items-center text-center">
          <span className="label-deco" style={{ color: m.glow }}>
            {m.label} · {card.family}
          </span>
          <h2 className="mt-2 font-display text-3xl tracking-[0.06em]">{card.name}</h2>
          <p className="mt-2 font-serif text-lg italic text-text-secondary">{card.effect}</p>
          <span className="label-deco mt-3 text-text-muted">{TABLE_LABEL[card.table]}</span>
          {card.power.kind === "future" && <p className="mt-2 font-serif text-sm italic text-text-muted">S'activera à l'ouverture de cette table.</p>}
          {n > 0 && (
            <p className="mt-3 font-display text-sm tracking-wide text-text-secondary">
              {FINISHES.filter((f) => copies?.[f])
                .map((f) => `${FINISH_LABEL[f]} ×${copies![f]}`)
                .join("  ·  ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {n > 0 && usable && (
            <button
              className="btn btn-gold btn-compact disabled:opacity-40"
              disabled={!isEquipped && loadout.blackjack.length >= slots}
              onClick={() => {
                if (isEquipped) unequip(card.id);
                else equip(card.id);
                sfx.chip();
              }}
            >
              {isEquipped ? "Retirer l'atout" : loadout.blackjack.length >= slots ? "Emplacements pleins" : "Équiper au blackjack"}
            </button>
          )}
          {meltable && (
            <button
              className="btn btn-ghost btn-compact"
              onClick={() => {
                if (melt(card.id, meltable)) sfx.dust();
              }}
            >
              Fondre · +{dustValue(card, meltable)}
              <CurrencyIcon currency="poussiere" size={16} />
            </button>
          )}
          {n === 0 && (
            <button
              className="btn btn-gold btn-compact disabled:opacity-40"
              disabled={dust < cost}
              onClick={() => {
                if (forge(card.id)) {
                  sfx.reveal(Math.min(2, ["commune", "rare", "epique", "legendaire", "mythique"].indexOf(card.rarity)));
                }
              }}
            >
              Forger · {cost.toLocaleString("fr-FR")}
              <CurrencyIcon currency="poussiere" size={16} />
            </button>
          )}
        </div>
        <button className="label-deco mt-2 text-text-muted hover:text-accent" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}

function Loadout({ onOpen }: { onOpen: (c: CardDef) => void }) {
  const collection = useCollection();
  const equipped = equippedCards(collection);
  const completed = completedFamilies(collection.owned);
  const slots = slotCount(completed);
  const lines = summarize(blackjackModifiers(equipped, completed));
  return (
    <section className="panel-deco mx-auto mb-14 max-w-3xl px-5 py-6 sm:px-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="label-deco text-accent">Atouts · Table de blackjack</span>
        <p className="font-serif text-base italic text-text-secondary">{lines.length ? lines.join(" · ") : "Aucun atout équipé. Touchez une carte pour l'équiper."}</p>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {Array.from({ length: slots }, (_, i) => {
          const card = equipped[i];
          return card ? (
            <button key={card.id} onClick={() => onOpen(card)}>
              <CollectibleCard card={card} finish={bestFinish(collection.owned[card.id])} width={78} interactive={false} />
            </button>
          ) : (
            <div key={i} className="empty-slot" style={{ width: 78 }}>
              <span className="font-display text-2xl text-accent/40">+</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The album: every card of Série I by family, owned or not. */
export function CollectionScreen() {
  const { owned, loadout, meltDuplicates } = useCollection();
  const [selected, setSelected] = useState<CardDef | null>(null);
  const [onlyUsable, setOnlyUsable] = useState(false);
  const ownedCount = CATALOG.filter((c) => totalCopies(owned[c.id]) > 0).length;
  const completed = completedFamilies(owned);
  const width = useMemo(() => (window.innerWidth < 640 ? Math.floor((window.innerWidth - 32 - 20) / 3) : 150), []);
  const dupDust = useMemo(() => {
    let d = 0;
    for (const c of CATALOG) {
      const copies = owned[c.id];
      if (!copies) continue;
      const keep = bestFinish(copies);
      for (const f of FINISHES) d += Math.max(0, (copies[f] ?? 0) - (f === keep ? 1 : 0)) * dustValue(c, f);
    }
    return d;
  }, [owned]);

  return (
    <div className="showcase-bg min-h-screen">
      <TopBar back title="COLLECTION" full />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <header className="mb-10 flex flex-col items-center text-center">
          <h1 className="font-display text-4xl tracking-[0.14em] sm:text-5xl">SÉRIE I</h1>
          <DecoRule width={240} className="mt-3" />
          <p className="mt-4 font-display text-xl tabular-nums text-text-secondary">
            {ownedCount} <span className="text-text-muted">/ {CATALOG.length}</span>
          </p>
          <div className="mt-2 h-1 w-56 overflow-hidden rounded-pill bg-surface-hover">
            <div className="h-full bg-gradient-to-r from-[#8f6421] to-[#f6dc93]" style={{ width: `${(ownedCount / CATALOG.length) * 100}%` }} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn btn-gold btn-compact" onClick={() => navigate("boutique")}>
              Boutique
            </button>
            {dupDust > 0 && (
              <button
                className="btn btn-ghost btn-compact"
                onClick={() => {
                  if (meltDuplicates()) sfx.dust();
                }}
              >
                Fondre les doublons · +{dupDust.toLocaleString("fr-FR")}
                <CurrencyIcon currency="poussiere" size={16} />
              </button>
            )}
          </div>
        </header>

        <Loadout onOpen={setSelected} />

        <div className="mb-10 flex justify-center">
          <button className={`label-deco rounded-pill border px-4 py-2 transition ${onlyUsable ? "border-accent text-accent" : "border-border text-text-muted"}`} onClick={() => setOnlyUsable(!onlyUsable)}>
            Utilisables au blackjack
          </button>
        </div>

        <div className="space-y-16">
          {FAMILIES.map((family) => {
            const cards = cardsOfFamily(family).filter((c) => !onlyUsable || usableAt(c, "blackjack"));
            if (!cards.length) return null;
            const all = cardsOfFamily(family);
            const have = all.filter((c) => totalCopies(owned[c.id]) > 0).length;
            const done = completed.includes(family);
            return (
              <section key={family}>
                <div className="mb-6 flex flex-col items-center text-center">
                  <h2 className="font-display text-2xl tracking-[0.12em]">{family.toUpperCase()}</h2>
                  <p className="mt-1 font-display text-sm tabular-nums text-text-muted">
                    {have} / {all.length}
                  </p>
                  <p className={`mt-1 font-serif text-base italic ${done ? "text-gold" : "text-text-muted"}`}>
                    {done ? "Complète : " : "Complète, elle offrira : "}
                    {describePower(FAMILY_BONUS[family].power).toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-4 sm:gap-x-5 sm:gap-y-7">
                  {cards.map((c) => (
                    <CardTile key={c.id} card={c} copies={owned[c.id]} equipped={loadout.blackjack.includes(c.id)} width={width} onOpen={() => setSelected(c)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      {selected && <CardDetail card={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
