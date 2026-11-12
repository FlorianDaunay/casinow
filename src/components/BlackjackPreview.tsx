import { CardBack } from "@/art/CardBack";
import { Chip, type ChipValue } from "@/art/Chip";
import { CurrencyIcon } from "@/art/CurrencyIcon";
import { PlayingCard, type Rank, type Suit } from "@/art/PlayingCard";
import { CollectibleCard } from "@/components/CollectibleCard";
import { SAMPLE_CARDS } from "@/core/cards/sample";

function Hand({ cards, hidden = false, width }: { cards: [Rank, Suit][]; hidden?: boolean; width: number }) {
  return (
    <div className="flex" style={{ paddingRight: width * 0.55 }}>
      {cards.map(([rank, suit], i) => (
        <div
          key={i}
          className="playing-card overflow-hidden"
          style={{ width, marginRight: -width * 0.55, transform: `rotate(${(i - (cards.length - 1) / 2) * 5}deg) translateY(${Math.abs(i - (cards.length - 1) / 2) * 4}px)` }}
        >
          <PlayingCard rank={rank} suit={suit} />
        </div>
      ))}
      {hidden && (
        <div className="playing-card overflow-hidden" style={{ width, marginRight: -width * 0.55, transform: "rotate(5deg) translateY(4px)" }}>
          <CardBack />
        </div>
      )}
    </div>
  );
}

function Score({ children }: { children: string }) {
  return (
    <span className="rounded-pill border border-accent/40 bg-black/50 px-3 py-1 font-display text-sm tabular-nums tracking-wider text-text-primary">
      {children}
    </span>
  );
}

function ChipStack({ values }: { values: ChipValue[] }) {
  return (
    <div className="relative h-16 w-16">
      {values.map((v, i) => (
        <div key={i} className="absolute chip-stack" style={{ bottom: i * 7, left: [0, 3, -2, 2][i % 4] }}>
          <Chip value={v} size={64} />
        </div>
      ))}
    </div>
  );
}

/** Static mock of a blackjack table, to validate the in-game look. */
export function BlackjackPreview() {
  const atout = SAMPLE_CARDS.find((c) => c.id === "s1-09")!;
  return (
    <div className="mx-auto max-w-5xl">
      <div className="felt relative overflow-hidden rounded-[36px_36px_220px_220px/36px_36px_160px_160px] px-6 pb-10 pt-10 sm:px-12">
        {/* Printed felt markings */}
        <svg viewBox="0 0 1000 600" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <path id="felt-arc" d="M200 215Q500 345 800 215" />
            <path id="felt-arc2" d="M250 252Q500 368 750 252" />
          </defs>
          <path d="M150 190Q500 330 850 190" fill="none" stroke="#C9A55A" strokeOpacity={0.55} strokeWidth={1.2} />
          <path d="M160 198Q500 338 840 198" fill="none" stroke="#C9A55A" strokeOpacity={0.3} strokeWidth={0.6} />
          <text fontFamily='"Bodoni Moda", serif' fontSize={22} letterSpacing={7} fill="#C9A55A" fillOpacity={0.8} textAnchor="middle">
            <textPath href="#felt-arc" startOffset="50%">
              BLACKJACK PAIE 3 CONTRE 2
            </textPath>
          </text>
          <text fontFamily='"Josefin Sans", sans-serif' fontSize={12} letterSpacing={5} fill="#E9DFC8" fillOpacity={0.45} textAnchor="middle">
            <textPath href="#felt-arc2" startOffset="50%">
              LE CROUPIER TIRE À 16 ET RESTE À 17
            </textPath>
          </text>
        </svg>

        <div className="relative flex flex-col items-center gap-3">
          <span className="label-deco text-[#E9DFC8]/60">Croupier</span>
          <Hand cards={[["R", "trefle"]]} hidden width={104} />
          <Score>10</Score>
        </div>

        <div className="relative mt-32 flex flex-col items-center gap-4 sm:mt-44">
          <div className="flex items-end gap-10">
            <div className="flex flex-col items-center gap-2">
              <ChipStack values={[100, 100, 500]} />
              <span className="font-display text-sm tracking-wide text-[#F1E7D2]">700</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Hand cards={[["A", "pique"], ["D", "coeur"]]} width={112} />
            </div>
            <div className="w-16" />
          </div>
          <div className="flex items-center gap-3">
            <Score>21</Score>
            <span className="font-display text-lg tracking-[0.3em] text-gold">BLACKJACK</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="panel-deco mt-6 flex flex-wrap items-center justify-between gap-6 px-6 py-5">
        <div className="flex items-center gap-4">
          <CollectibleCard card={atout} width={58} interactive={false} />
          <div className="flex flex-col">
            <span className="label-deco text-text-muted">Atout équipé</span>
            <span className="font-display text-lg">L'Œil du Croupier</span>
            <span className="font-serif text-sm italic text-text-secondary">1 utilisation restante</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost">Doubler</button>
          <button className="btn btn-ghost">Rester</button>
          <button className="btn btn-gold">Tirer</button>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyIcon currency="jetons" size={22} />
          <span className="font-display text-lg tabular-nums">12 450</span>
        </div>
      </div>
    </div>
  );
}
