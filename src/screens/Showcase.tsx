import { Booster } from "@/art/Booster";
import { CardBack } from "@/art/CardBack";
import { Chip, CHIP_VALUES } from "@/art/Chip";
import { CURRENCY_LABEL, CurrencyIcon, type Currency } from "@/art/CurrencyIcon";
import { MATERIALS } from "@/art/materials";
import { PlayingCard } from "@/art/PlayingCard";
import { BlackjackPreview } from "@/components/BlackjackPreview";
import { CollectibleCard } from "@/components/CollectibleCard";
import { SectionTitle, SunFan } from "@/components/Ornaments";
import { SAMPLE_CARDS } from "@/core/cards/sample";
import { RARITIES, type CardDef } from "@/core/cards/types";

const byRarity = RARITIES.map((r) => SAMPLE_CARDS.find((c) => c.rarity === r)!);
const card = (id: string) => SAMPLE_CARDS.find((c) => c.id === id) as CardDef;

function Counter({ currency, amount }: { currency: Currency; amount: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-pill border border-border bg-surface/80 py-1.5 pl-1.5 pr-4" title={CURRENCY_LABEL[currency]}>
      <CurrencyIcon currency={currency} size={24} />
      <span className="whitespace-nowrap font-display text-[0.95rem] tabular-nums tracking-wide text-text-primary">{amount}</span>
    </div>
  );
}

/** Visual validation board: every art piece of the house style on one page. */
export function Showcase() {
  return (
    <div className="showcase-bg min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-center sm:justify-between gap-4 px-4 py-3 sm:px-8">
          <span className="hidden font-display text-xl tracking-[0.3em] text-gold sm:block">CASINOW</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Counter currency="jetons" amount="12 450" />
            <Counter currency="poussiere" amount="380" />
            <Counter currency="sceaux" amount="14" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 pb-24 pt-20 text-center">
        <SunFan width={220} />
        <h1 className="mt-6 pl-[0.18em] font-display text-5xl font-normal tracking-[0.18em] text-gold sm:text-8xl sm:tracking-[0.22em]">CASINOW</h1>
        <p className="label-deco mt-5 text-text-secondary">Club privé · Est. MCMXXIV</p>
        <p className="mt-6 max-w-md font-serif text-xl italic text-text-secondary">
          Les portes ne s'ouvrent qu'une fois la nuit tombée. Les mises sont fictives, les frissons ne le sont pas.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button className="btn btn-gold">Entrer au salon</button>
          <button className="btn btn-ghost">La collection</button>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-32 px-4 pb-32 sm:px-8">
        <section>
          <SectionTitle numeral="I" title="LES RARETÉS" subtitle="Cinq matières, de l'os gravé à l'obsidienne cerclée d'or rose. Survolez une carte." />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-12">
            {byRarity.map((c) => (
              <figure key={c.id} className="flex flex-col items-center gap-4">
                <CollectibleCard card={c} width={200} />
                <figcaption className="label-deco text-text-muted">{MATERIALS[c.rarity].label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle numeral="II" title="LES FINITIONS" subtitle="Une même carte peut sortir standard, holographique ou gravée à l'or fin." />
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-12">
            {(
              [
                ["s1-21", "standard", "Standard"],
                ["s1-21", "holo", "Holographique"],
                ["s1-21", "gravee", "Gravée or"],
                ["s1-08", "holo", "Légendaire holo"],
              ] as const
            ).map(([id, finish, label]) => (
              <figure key={id + finish} className="flex flex-col items-center gap-4">
                <CollectibleCard card={card(id)} finish={finish} width={230} />
                <figcaption className="label-deco text-text-muted">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle numeral="III" title="DOS & PAQUETS" subtitle="Le dos annonce la rareté par sa lueur, juste avant que la carte ne se retourne." />
          <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-12">
            <figure className="flex flex-col items-center gap-4">
              <div className="card-perspective" style={{ width: 200 }}>
                <div className="collectible" style={{ width: 200 }}>
                  <div className="collectible-face">
                    <CardBack />
                  </div>
                </div>
              </div>
              <figcaption className="label-deco text-text-muted">Dos</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-4">
              <div className="collectible" style={{ width: 200, boxShadow: "0 0 70px -6px #F2BE4E" }}>
                <div className="collectible-face">
                  <CardBack glow="#F2BE4E" />
                </div>
              </div>
              <figcaption className="label-deco text-text-muted">Dos, lueur légendaire</figcaption>
            </figure>
            {(["salon", "prestige", "arcane"] as const).map((tier) => (
              <figure key={tier} className="flex flex-col items-center gap-4">
                <div className="booster-float" style={{ width: 190 }}>
                  <Booster tier={tier} />
                </div>
                <figcaption className="label-deco text-text-muted">Paquet {tier}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle numeral="IV" title="JETONS & MONNAIES" subtitle="Les jetons pour miser, la poussière d'or pour forger, les sceaux pour les privilèges." />
          <div className="flex flex-wrap justify-center gap-6">
            {CHIP_VALUES.map((v) => (
              <div key={v} className="chip-stack">
                <Chip value={v} size={92} />
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-6">
            {(["jetons", "poussiere", "sceaux"] as const).map((c) => (
              <div key={c} className="panel-deco flex w-60 flex-col items-center gap-3 px-6 py-7">
                <CurrencyIcon currency={c} size={56} />
                <span className="font-display text-2xl tracking-wide">{CURRENCY_LABEL[c]}</span>
                <span className="label-deco text-center text-text-muted">
                  {c === "jetons" ? "Monnaie de table" : c === "poussiere" ? "Forge & amélioration" : "Privilèges & paquets rares"}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SectionTitle numeral="V" title="LE JEU DE LA MAISON" subtitle="Les cartes à jouer des tables : papier ivoire, index Bodoni, figures Art déco." />
          <div className="flex flex-wrap justify-center gap-5">
            {(
              [
                ["A", "pique"],
                ["R", "coeur"],
                ["D", "trefle"],
                ["V", "carreau"],
                ["10", "coeur"],
                ["7", "trefle"],
                ["3", "carreau"],
              ] as const
            ).map(([rank, suit]) => (
              <div key={rank + suit} className="playing-card overflow-hidden" style={{ width: 140 }}>
                <PlayingCard rank={rank} suit={suit} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle numeral="VI" title="À LA TABLE" subtitle="Aperçu d'une table de blackjack, avec un atout équipé." />
          <BlackjackPreview />
        </section>
      </main>
    </div>
  );
}
