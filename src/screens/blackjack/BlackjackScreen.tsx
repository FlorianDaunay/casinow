import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CardBack } from "@/art/CardBack";
import { Chip, CHIP_VALUES } from "@/art/Chip";
import { sfx } from "@/audio/sfx";
import { ChipStack } from "@/components/ChipStack";
import { TopBar } from "@/components/TopBar";
import type { Card } from "@/core/cards/playing";
import { canDouble, canSplit, handValue, totalBet, totalPayout, type BlackjackState, type Hand, type Outcome } from "@/core/blackjack/engine";
import { useBlackjack } from "@/store/blackjack";
import { HOUSE_CREDIT, HOUSE_CREDIT_THRESHOLD, useProfile } from "@/store/profile";
import { CurrencyIcon } from "@/art/CurrencyIcon";
import { navigate } from "@/app/router";
import { CollectibleCard } from "@/components/CollectibleCard";
import { bestFinish, currentBlackjackModifiers, equippedCards, useCollection } from "@/store/collection";
import type { RoundExtras } from "@/store/blackjack";
import { TableCard } from "./TableCard";

/** Seconds between two cards of the same deal. */
const DEAL_GAP = 0.24;
/** Duration of the fly-in animation (keep in sync with `.table-card-deal`). */
const DEAL_TIME = 0.42;
const DEALER_BEAT_MS = 720;

const DEALER_FROM = { x: "34vw", y: "-4vh" };
const PLAYER_FROM = { x: "34vw", y: "-42vh" };

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

/** Order in which cards hit the felt: player, dealer, player, dealer, then draws. */
function dealOrder(game: BlackjackState): Card[] {
  const order: Card[] = [];
  const longest = Math.max(game.dealer.length, ...game.hands.map((h) => h.cards.length), 0);
  for (let k = 0; k < longest; k++) {
    for (const h of game.hands) if (h.cards[k]) order.push(h.cards[k]);
    if (game.dealer[k]) order.push(game.dealer[k]);
  }
  return order;
}

/**
 * Assigns each new card its fly-in delay, once. Cards present when the screen opens are shown
 * without animation. Returns the delays and when the latest animation ends.
 */
function useDealTiming(game: BlackjackState) {
  const delays = useRef(new Map<number, number>());
  const initialized = useRef(false);
  const [settleAt, setSettleAt] = useState(0);

  const order = dealOrder(game);
  if (!initialized.current) {
    for (const c of order) delays.current.set(c.id, -1);
    initialized.current = true;
  }
  let next = 0;
  const fresh: { id: number; delay: number }[] = [];
  for (const c of order) {
    if (!delays.current.has(c.id)) {
      const delay = next * DEAL_GAP;
      delays.current.set(c.id, delay);
      fresh.push({ id: c.id, delay });
      next++;
    }
  }

  // Sounds for the cards that just appeared, timed with their animation.
  const freshKey = fresh.map((f) => f.id).join(",");
  useEffect(() => {
    if (!freshKey) return;
    const timers = fresh.map((f) => window.setTimeout(() => sfx.deal(), (f.delay + DEAL_TIME * 0.6) * 1000));
    const last = Math.max(...fresh.map((f) => f.delay));
    setSettleAt(performance.now() + (last + DEAL_TIME) * 1000);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey]);

  return { delayOf: (id: number) => delays.current.get(id) ?? 0, settleAt };
}

function ScorePill({ cards, hideHole }: { cards: Card[]; hideHole?: boolean }) {
  if (!cards.length) return <span className="h-7" />;
  const visible = hideHole ? cards.slice(0, 1) : cards;
  const v = handValue(visible);
  const label = v.soft && v.total < 21 && visible.length > 1 ? `${v.total - 10} / ${v.total}` : String(v.total);
  return (
    <span
      className={`rounded-pill border px-3 py-0.5 font-display text-sm tabular-nums tracking-wider ${
        v.total > 21 ? "border-danger/60 bg-danger/20 text-[#F4C9C2]" : "border-accent/40 bg-black/50 text-[#F1E7D2]"
      }`}
    >
      {label}
    </span>
  );
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  blackjack: "Blackjack",
  win: "Gagné",
  push: "Égalité",
  lose: "Perdu",
  bust: "Dépassé",
};

function OutcomeTag({ hand }: { hand: Hand }) {
  if (!hand.outcome) return null;
  const good = hand.outcome === "win" || hand.outcome === "blackjack";
  const net = hand.payout - hand.bet;
  return (
    <div className="outcome-tag flex flex-col items-center">
      <span className={`label-deco ${good ? "text-gold" : hand.outcome === "push" ? "text-[#E9DFC8]/80" : "text-[#E07A6E]"}`}>{OUTCOME_LABEL[hand.outcome]}</span>
      <span className={`font-display text-sm tabular-nums ${good ? "text-[#F1E7D2]" : "text-[#E9DFC8]/50"}`}>
        {net > 0 ? `+${fmt(net)}` : net < 0 ? `−${fmt(-net)}` : "±0"}
      </span>
    </div>
  );
}

function CardRow({
  cards,
  faceUp,
  from,
  delayOf,
  peekIndex = -1,
}: {
  cards: Card[];
  faceUp: (i: number) => boolean;
  from: { x: string; y: string };
  delayOf: (id: number) => number;
  /** Card shown to the player only (the hole card under the croupier's eye). */
  peekIndex?: number;
}) {
  return (
    <div className="flex items-center" style={{ minHeight: "calc(var(--cw) * 1.4)" }}>
      {cards.map((c, i) => {
        const delay = delayOf(c.id);
        return (
          <div key={c.id} className={i === peekIndex ? "peeked" : undefined} style={{ marginLeft: i ? "calc(var(--cw) * -0.62)" : 0, zIndex: i }}>
            <TableCard card={c} faceUp={faceUp(i)} delay={Math.max(0, delay)} still={delay < 0} from={from} />
          </div>
        );
      })}
    </div>
  );
}

/** Big centered result once the round is settled. */
function ResultBanner({ game, extras }: { game: BlackjackState; extras: RoundExtras | null }) {
  const net = totalPayout(game) + (extras?.bonus ?? 0) - totalBet(game);
  const single = game.hands.length === 1 ? game.hands[0].outcome : null;
  const word = single ? OUTCOME_LABEL[single] : net > 0 ? "Gagné" : net < 0 ? "Perdu" : "Égalité";
  const good = net > 0;
  const blackjack = single === "blackjack";
  return (
    <div className={`result-banner pointer-events-none flex flex-col items-center ${blackjack ? "is-blackjack" : ""}`}>
      {good && (
        <svg viewBox="-100 -60 200 60" className="result-rays mb-[-0.6rem] w-40 sm:w-56">
          {Array.from({ length: 15 }, (_, i) => {
            const a = Math.PI + (i / 14) * Math.PI;
            return <line key={i} x1={Math.cos(a) * 22} y1={Math.sin(a) * 22} x2={Math.cos(a) * (i % 2 ? 46 : 58)} y2={Math.sin(a) * (i % 2 ? 46 : 58)} stroke="#E8C46C" strokeWidth={i % 2 ? 0.6 : 1.2} />;
          })}
        </svg>
      )}
      <span className={`font-display uppercase tracking-[0.28em] ${good ? "text-gold" : "text-[#E9DFC8]/85"} ${blackjack ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl"}`}>
        {word}
      </span>
      <span className={`mt-1 font-display text-lg tabular-nums tracking-wider sm:text-xl ${good ? "text-[#F1E7D2]" : "text-[#E9DFC8]/55"}`}>
        {net > 0 ? `+${fmt(net)}` : net < 0 ? `−${fmt(-net)}` : "Mise rendue"}
      </span>
      {!!extras?.bonus && <span className="label-deco mt-1 text-[0.6rem] text-accent">dont +{fmt(extras.bonus)} d'atouts</span>}
      {!!extras?.sceaux && (
        <span className="mt-2 flex items-center gap-1.5 font-display text-base text-[#F1E7D2]">
          +{extras.sceaux} <CurrencyIcon currency="sceaux" size={20} />
        </span>
      )}
    </div>
  );
}

/** Printed felt: one layout for wide tables, one for tall phone tables. */
function FeltMarkings({ dim }: { dim: boolean }) {
  // A shallow arc across the table at height `y`, `depth` deep at its center.
  const arc = (w: number, y: number, depth: number, inset: number) => `M${w * inset} ${y}Q${w / 2} ${y + depth} ${w * (1 - inset)} ${y}`;
  const marks = (w: number, y: number, depth: number, size: number, small: number, id: string) => (
    <>
      <defs>
        <path id={`${id}-a`} d={arc(w, y + 25, depth, 0.08)} />
        <path id={`${id}-b`} d={arc(w, y + 25 + size * 1.7, depth * 0.9, 0.14)} />
      </defs>
      <path d={arc(w, y, depth, 0.05)} fill="none" stroke="#C9A55A" strokeOpacity={0.5} strokeWidth={1.2} />
      <path d={arc(w, y + 8, depth, 0.06)} fill="none" stroke="#C9A55A" strokeOpacity={0.25} strokeWidth={0.6} />
      <text fontFamily='"Bodoni Moda", serif' fontSize={size} letterSpacing={size * 0.3} fill="#C9A55A" fillOpacity={0.7} textAnchor="middle">
        <textPath href={`#${id}-a`} startOffset="50%">
          BLACKJACK PAIE 3 CONTRE 2
        </textPath>
      </text>
      <text fontFamily='"Josefin Sans", sans-serif' fontSize={small} letterSpacing={small * 0.4} fill="#E9DFC8" fillOpacity={0.38} textAnchor="middle">
        <textPath href={`#${id}-b`} startOffset="50%">
          LE CROUPIER TIRE À 16 ET RESTE À 17
        </textPath>
      </text>
    </>
  );
  return (
    <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${dim ? "opacity-15" : "opacity-100"}`}>
      <svg viewBox="0 0 1000 600" className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block" preserveAspectRatio="xMidYMid meet">
        {marks(1000, 230, 140, 22, 12, "felt-w")}
      </svg>
      <svg viewBox="0 0 400 700" className="pointer-events-none absolute inset-0 h-full w-full sm:hidden" preserveAspectRatio="xMidYMid meet">
        {marks(400, 300, 60, 14, 8, "felt-m")}
      </svg>
    </div>
  );
}

/** The shoe in the corner of the table: where every card comes from. */
function Shoe({ remaining, total }: { remaining: number; total: number }) {
  const ratio = remaining / total;
  return (
    <div className="absolute right-3 top-3 hidden flex-col items-center gap-1 sm:flex" title="Sabot">
      <div className="relative h-[86px] w-[64px] rotate-[8deg]">
        {[3, 2, 1, 0].map((i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-hidden rounded-[5px] shadow-[0_4px_10px_rgb(0_0_0/0.6)]"
            style={{ transform: `translate(${-i * 1.5}px, ${i * 1.5}px)` }}
          >
            <CardBack />
          </div>
        ))}
      </div>
      <div className="mt-2 h-1 w-14 overflow-hidden rounded-pill bg-black/50">
        <div className="h-full bg-[#C9A55A]/70" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

/** Equipped atouts, fanned in the corner of the felt; touching them opens the collection. */
function AtoutStrip() {
  const collection = useCollection();
  const cards = equippedCards(collection, "blackjack");
  return (
    <button className="absolute left-5 top-5 z-10 flex flex-col items-start gap-1 sm:left-7 sm:top-6" onClick={() => navigate("collection")} aria-label="Atouts équipés">
      <span className="label-deco text-[0.5rem] text-[#E9DFC8]/50">Atouts</span>
      {cards.length ? (
        <div className="flex">
          {cards.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i ? -18 : 0, transform: `rotate(${(i - (cards.length - 1) / 2) * 6}deg)` }}>
              <CollectibleCard card={c} finish={bestFinish(collection.owned[c.id])} width={34} interactive={false} />
            </div>
          ))}
        </div>
      ) : (
        <span className="empty-slot w-[34px]">
          <span className="font-display text-base text-accent/40">+</span>
        </span>
      )}
    </button>
  );
}

export function BlackjackScreen() {
  const store = useBlackjack();
  const { game, pendingBet, lastBet, extras } = store;
  // The croupier's eye: uses per visit, and whether the current hole card was seen.
  const [peeksLeft, setPeeksLeft] = useState(() => currentBlackjackModifiers().peekUses);
  const [peeked, setPeeked] = useState(false);
  const holeId = game.dealer[1]?.id;
  useEffect(() => {
    setPeeked(false);
  }, [holeId]);
  const jetons = useProfile((s) => s.wallet.jetons);
  const takeHouseCredit = useProfile((s) => s.takeHouseCredit);
  const { delayOf, settleAt } = useDealTiming(game);
  const [showResult, setShowResult] = useState(game.phase === "settled");
  const [notice, setNotice] = useState<string | null>(null);
  const prevPhase = useRef(game.phase);
  const prevHole = useRef(game.holeRevealed);

  // Dealer's turn, one card per beat.
  useEffect(() => {
    if (game.phase !== "dealer") return;
    const t = window.setTimeout(() => store.dealerStep(), DEALER_BEAT_MS);
    return () => clearTimeout(t);
  }, [game, store]);

  // Hole card flip.
  useEffect(() => {
    if (game.holeRevealed && !prevHole.current && game.dealer.length) {
      const wait = Math.max(0, settleAt - performance.now());
      window.setTimeout(() => sfx.flip(), wait);
    }
    prevHole.current = game.holeRevealed;
  }, [game.holeRevealed, game.dealer.length, settleAt]);

  // Result, once the last card has landed.
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = game.phase;
    if (game.phase !== "settled") {
      setShowResult(false);
      return;
    }
    if (was === "settled") return;
    const wait = Math.max(0, settleAt - performance.now()) + 450;
    const t = window.setTimeout(() => {
      setShowResult(true);
      const outcomes = game.hands.map((h) => h.outcome);
      const net = totalPayout(game) - totalBet(game);
      if (outcomes.includes("blackjack")) {
        sfx.blackjack();
        navigator.vibrate?.([30, 50, 30, 50, 60]);
      } else if (net > 0) {
        sfx.win();
        sfx.chip(3);
        navigator.vibrate?.(35);
      } else if (net === 0) sfx.push();
      else sfx.lose();
    }, wait);
    return () => clearTimeout(t);
  }, [game, settleAt]);

  useEffect(() => {
    if (!game.reshuffled || game.phase === "betting") return;
    setNotice("Le sabot est mélangé");
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [game.reshuffled, game.phase]);

  const busy = game.phase === "dealer" || (game.phase === "settled" && !showResult);
  const active = game.phase === "player" ? game.hands[game.active] : undefined;
  const can = {
    hit: !!active && !busy,
    stand: !!active && !busy,
    double: !!active && !busy && canDouble(game) && jetons >= active.bet,
    split: !!active && !busy && canSplit(game) && jetons >= active.bet,
  };

  const act = (fn: () => void, sound?: () => void) => () => {
    sound?.();
    fn();
  };
  const rebet = () => {
    store.newRound();
    useBlackjack.getState().deal();
    sfx.chip(2);
  };

  // Keyboard: H tirer, S rester, D doubler, P séparer, Entrée distribuer / rejouer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (game.phase === "player") {
        if (k === "h" && can.hit) store.hit();
        if (k === "s" && can.stand) store.stand();
        if (k === "d" && can.double) (sfx.chip(), store.double());
        if (k === "p" && can.split) (sfx.chip(), store.split());
      } else if (k === "enter" || k === " ") {
        e.preventDefault();
        if (game.phase === "betting" && pendingBet >= game.rules.minBet) (sfx.chip(2), store.deal());
        if (game.phase === "settled" && showResult && lastBet && jetons >= lastBet) rebet();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const manyHands = game.hands.length > 2;
  const feltStyle = {
    "--cw": manyHands ? "clamp(46px, min(13vw, 9.5dvh), 92px)" : "clamp(56px, min(19vw, 12dvh), 116px)",
  } as CSSProperties;

  const shownBet = game.phase === "betting" ? pendingBet : 0;

  return (
    <div className="showcase-bg flex h-[100dvh] flex-col overflow-hidden">
      <TopBar back title="BLACKJACK" rules="blackjack" />

      <div className="relative min-h-0 flex-1 px-2 pb-2 pt-2 sm:px-6 sm:pt-4">
        <div className="felt bj-felt relative mx-auto flex h-full max-w-5xl flex-col items-center justify-between overflow-hidden px-3 pb-5 pt-4 sm:px-8" style={feltStyle}>
          <FeltMarkings dim={showResult && game.phase === "settled"} />
          <Shoe remaining={game.shoe.length} total={game.rules.decks * 52} />
          <AtoutStrip />

          {/* Dealer */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <span className="label-deco text-[#E9DFC8]/55">Croupier</span>
            <CardRow cards={game.dealer} faceUp={(i) => i === 0 || game.holeRevealed} from={DEALER_FROM} delayOf={delayOf} peekIndex={peeked && !game.holeRevealed ? 1 : -1} />
            <div className="flex items-center gap-2">
              <ScorePill cards={game.dealer} hideHole={!game.holeRevealed} />
              {game.phase === "player" && peeksLeft > 0 && !peeked && (
                <button
                  className="label-deco rounded-pill border border-accent/60 bg-black/40 px-3 py-1 text-[0.55rem] text-accent transition hover:bg-accent/15"
                  onClick={() => {
                    setPeeked(true);
                    setPeeksLeft((n) => n - 1);
                    sfx.flip();
                  }}
                >
                  Œil du croupier
                </button>
              )}
              {peeked && !game.holeRevealed && <span className="label-deco text-[0.55rem] text-accent">Vu : {handValue(game.dealer).total}</span>}
            </div>
          </div>

          {/* Center: result or notice */}
          <div className="relative z-20 flex min-h-[4.5rem] items-center justify-center">
            {showResult && game.phase === "settled" ? (
              <ResultBanner game={game} extras={extras} />
            ) : notice ? (
              <span className="label-deco notice text-[#E9DFC8]/80">{notice}</span>
            ) : game.phase === "dealer" ? (
              <span className="label-deco text-[#E9DFC8]/60">Le croupier joue</span>
            ) : null}
          </div>

          {/* Player */}
          <div className="relative z-10 flex w-full flex-col items-center gap-2">
            {game.phase === "betting" ? (
              <div className="flex flex-col items-center gap-2">
                <div className="bet-ring grid place-items-center" style={{ width: "calc(var(--cw) * 1.25)", height: "calc(var(--cw) * 1.25)" }}>
                  {shownBet > 0 ? <ChipStack amount={shownBet} size={52} /> : <span className="label-deco px-2 text-center text-[0.55rem] text-[#E9DFC8]/45">Mise</span>}
                </div>
                <span className="font-display text-lg tabular-nums tracking-wide text-[#F1E7D2]">{shownBet ? fmt(shownBet) : " "}</span>
              </div>
            ) : (
              <div className="flex w-full items-end justify-center gap-4 sm:gap-10">
                {game.hands.map((hand, i) => {
                  const isActive = game.phase === "player" && i === game.active;
                  return (
                    <div key={i} className={`hand-slot flex flex-col items-center gap-2 ${isActive ? "is-active" : ""} ${game.phase === "player" && !isActive ? "opacity-60" : ""}`}>
                      {showResult ? <OutcomeTag hand={hand} /> : <span className="h-[2.4rem]" />}
                      <div className="flex items-end gap-1">
                        <CardRow cards={hand.cards} faceUp={() => true} from={PLAYER_FROM} delayOf={delayOf} />
                      </div>
                      <div className="flex items-center gap-2">
                        <ChipStack amount={hand.bet} size={28} />
                        <ScorePill cards={hand.cards} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-20 border-t border-border bg-canvas/95 px-3 pt-3 backdrop-blur" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          {game.phase === "betting" && (
            <>
              <div className="flex w-full max-w-xl items-center justify-between gap-1 sm:justify-center sm:gap-4">
                {CHIP_VALUES.map((v) => {
                  const disabled = v > jetons - pendingBet || pendingBet + v > game.rules.maxBet;
                  return (
                    <button
                      key={v}
                      disabled={disabled}
                      onClick={() => {
                        store.addChip(v);
                        sfx.chip();
                      }}
                      className="chip-button disabled:opacity-25"
                      aria-label={`Miser ${v}`}
                    >
                      <Chip value={v} size={52} />
                    </button>
                  );
                })}
              </div>
              <div className="flex w-full max-w-xl items-center justify-center gap-3">
                <button className="btn btn-ghost btn-compact" disabled={!pendingBet} onClick={act(store.clearBet, sfx.tick)}>
                  Effacer
                </button>
                <button
                  className="btn btn-gold btn-compact min-w-[10rem] disabled:opacity-40"
                  disabled={pendingBet < game.rules.minBet}
                  onClick={act(store.deal, () => sfx.chip(2))}
                >
                  Distribuer
                </button>
              </div>
              {jetons < HOUSE_CREDIT_THRESHOLD && pendingBet === 0 && (
                <button className="label-deco text-accent underline-offset-4 hover:underline" onClick={act(takeHouseCredit, () => sfx.chip(4))}>
                  Crédit de la maison : {fmt(HOUSE_CREDIT)} jetons
                </button>
              )}
            </>
          )}

          {(game.phase === "player" || game.phase === "dealer" || (game.phase === "settled" && !showResult)) && (
            <div className="grid w-full max-w-xl grid-cols-4 gap-2 py-2 sm:gap-3">
              <button className="btn btn-ghost btn-compact disabled:opacity-30" disabled={!can.split} onClick={act(store.split, () => sfx.chip())}>
                Séparer
              </button>
              <button className="btn btn-ghost btn-compact disabled:opacity-30" disabled={!can.double} onClick={act(store.double, () => sfx.chip())}>
                Doubler
              </button>
              <button className="btn btn-ghost btn-compact disabled:opacity-30" disabled={!can.stand} onClick={act(store.stand, sfx.tick)}>
                Rester
              </button>
              <button className="btn btn-gold btn-compact disabled:opacity-40" disabled={!can.hit} onClick={act(store.hit)}>
                Tirer
              </button>
            </div>
          )}

          {game.phase === "settled" && showResult && (
            <div className="flex w-full max-w-xl items-center justify-center gap-3 py-2">
              <button className="btn btn-ghost btn-compact" onClick={act(store.newRound, sfx.tick)}>
                Changer la mise
              </button>
              {lastBet > 0 && jetons >= lastBet ? (
                <button className="btn btn-gold btn-compact min-w-[10rem]" onClick={rebet}>
                  Rejouer · {fmt(lastBet)}
                </button>
              ) : jetons < HOUSE_CREDIT_THRESHOLD ? (
                <button className="btn btn-gold btn-compact" onClick={act(takeHouseCredit, () => sfx.chip(4))}>
                  Crédit · {fmt(HOUSE_CREDIT)}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
