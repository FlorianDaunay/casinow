import { useEffect, useState, type CSSProperties } from "react";
import { CardBack } from "@/art/CardBack";
import { Chip, type ChipValue } from "@/art/Chip";
import { PlayingCard } from "@/art/PlayingCard";
import { navigate } from "@/app/router";
import { sfx } from "@/audio/sfx";
import { CollectibleCard } from "@/components/CollectibleCard";
import { TopBar } from "@/components/TopBar";
import type { Card } from "@/core/cards/playing";
import { evaluate, HAND_LABEL, HANDS, MAX_COINS, payout, type HandRank } from "@/core/poker/engine";
import { bestFinish, equippedCards, useCollection } from "@/store/collection";
import { DENOMINATIONS, pokerBet, usePoker } from "@/store/poker";
import { useProfile } from "@/store/profile";

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
const PAYING = HANDS.filter((h) => h !== "rien");

function useCardWidth() {
  const calc = () => Math.floor(Math.min((Math.min(window.innerWidth, 900) - 24 - 4 * 8) / 5, 150, (window.innerHeight - 470) / 1.4));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return Math.max(54, w);
}

/** The pay table, always in sight; the winning line lights up. */
function PayTable({ coins, denom, lit }: { coins: number; denom: number; lit: HandRank | null }) {
  return (
    <div className="paytable panel-deco w-full max-w-3xl px-3 py-2 sm:px-5 sm:py-3">
      <table className="w-full">
        <tbody>
          {PAYING.map((h) => (
            <tr key={h} className={lit === h ? "is-lit" : ""}>
              <td className="paytable-name">{HAND_LABEL[h]}</td>
              {Array.from({ length: MAX_COINS }, (_, i) => (
                <td key={i} className={`paytable-cell ${i + 1 === coins ? "is-current" : "hidden sm:table-cell"}`}>
                  {fmt(payout(h, i + 1) * denom)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-center font-serif text-[0.75rem] italic text-text-muted">Gains en jetons, selon le nombre d'unités misées</p>
    </div>
  );
}

const RANK_NAME: Record<string, string> = { A: "As", R: "Roi", D: "Dame", V: "Valet" };
const cardName = (c: Card) => `${RANK_NAME[c.rank] ?? c.rank} de ${c.suit === "coeur" ? "cœur" : c.suit === "trefle" ? "trèfle" : c.suit}`;

/** A card of the hand. `marked` cards are the ones that will be replaced on the draw. */
function PokerCard({ card, faceUp, marked, width, onClick, index }: { card: Card | null; faceUp: boolean; marked: boolean; width: number; onClick?: () => void; index: number }) {
  return (
    <button
      className={`poker-slot ${onClick ? "" : "cursor-default"}`}
      style={{ width }}
      onClick={onClick}
      disabled={!onClick}
      aria-label={card && faceUp ? `${cardName(card)}${marked ? ", à changer" : ""}` : "Carte cachée"}
      aria-pressed={onClick ? marked : undefined}
    >
      <span className={`hold-tag label-deco ${marked ? "is-on" : ""}`} aria-hidden>
        Changer
      </span>
      <div className={`poker-card ${marked ? "is-marked" : ""}`} style={{ width, height: width * 1.4 }}>
        {card && faceUp ? (
          <div key={card.id} className="poker-face" style={{ animationDelay: `${index * 0.07}s` } as CSSProperties}>
            <PlayingCard rank={card.rank} suit={card.suit} />
            {marked && (
              <span className="replace-mark">
                <svg viewBox="-12 -12 24 24" width="42%">
                  <path d="M-7 -3A7.5 7.5 0 0 1 6.5 -3.5M7 3A7.5 7.5 0 0 1 -6.5 3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  <path d="M3.5 -7L7 -3L2.5 -1.5M-3.5 7L-7 3L-2.5 1.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        ) : (
          <div className="poker-face is-back">
            <CardBack />
          </div>
        )}
      </div>
    </button>
  );
}

/** The draw button says what will happen. */
const drawLabel = (n: number) => (n === 0 ? "Garder ma main" : n === 1 ? "Changer 1 carte" : `Changer ${n} cartes`);

function AtoutStrip() {
  const collection = useCollection();
  const cards = equippedCards(collection, "poker");
  return (
    <button className="flex items-center gap-2" onClick={() => navigate("collection")} aria-label="Atouts équipés">
      <span className="label-deco text-[0.5rem] text-text-muted">Atouts</span>
      {cards.length ? (
        <div className="flex">
          {cards.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i ? -14 : 0 }}>
              <CollectibleCard card={c} finish={bestFinish(collection.owned[c.id])} width={30} interactive={false} />
            </div>
          ))}
        </div>
      ) : (
        <span className="empty-slot w-[30px]">
          <span className="font-display text-sm text-accent/40">+</span>
        </span>
      )}
    </button>
  );
}

/** Double or nothing: beat the croupier's card with one of four face-down cards. */
function DoubleRound() {
  const { double, pickDouble, startDouble, next } = usePoker();
  if (!double) return null;
  const w = Math.min(96, (window.innerWidth - 48) / 5.6);
  return (
    <div className="detail-scene fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-4">
      <span className="label-deco text-accent">Quitte ou double · {fmt(double.stake)}</span>
      <div className="flex items-end gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-2">
          <div className="playing-card overflow-hidden" style={{ width: w * 1.15 }}>
            <PlayingCard rank={double.dealer.rank} suit={double.dealer.suit} />
          </div>
          <span className="label-deco text-[0.55rem] text-text-muted">Croupier</span>
        </div>
        <span className="mb-10 h-24 w-px bg-border" />
        {double.choices.map((c, i) => {
          const shown = double.picked !== null;
          return (
            <button
              key={c.id}
              disabled={shown}
              className={`flex flex-col items-center gap-2 transition ${shown && double.picked !== i ? "opacity-45" : ""}`}
              onClick={() => {
                pickDouble(i);
                sfx.flip();
                const o = usePoker.getState().double?.outcome;
                window.setTimeout(() => (o === "win" ? sfx.win() : o === "lose" ? sfx.lose() : sfx.push()), 300);
              }}
            >
              <div className={`playing-card overflow-hidden ${double.picked === i ? "ring-2 ring-accent" : ""}`} style={{ width: w }}>
                {shown ? <PlayingCard rank={c.rank} suit={c.suit} /> : <CardBack />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex min-h-[3.5rem] flex-col items-center gap-3">
        {double.outcome && (
          <span className={`font-display text-2xl tracking-[0.2em] ${double.outcome === "win" ? "text-gold" : "text-[#E9DFC8]/70"}`}>
            {double.outcome === "win" ? `GAGNÉ · +${fmt(double.stake * 2)}` : double.outcome === "push" ? "ÉGALITÉ" : "PERDU"}
          </span>
        )}
        {!double.outcome && <span className="font-serif text-lg italic text-text-secondary">Choisissez une carte plus forte que celle du croupier.</span>}
        {double.outcome && (
          <div className="flex gap-3">
            {double.outcome === "win" && (
              <button className="btn btn-ghost btn-compact" onClick={() => startDouble() && sfx.chip()}>
                Encore · {fmt(double.stake * 2)}
              </button>
            )}
            <button className="btn btn-gold btn-compact" onClick={() => (next(), sfx.tick())}>
              Continuer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PokerScreen() {
  const store = usePoker();
  const { coins, denom, phase, deal, held, swapsLeft, result } = store;
  const jetons = useProfile((s) => s.wallet.jetons);
  const width = useCardWidth();

  useEffect(() => {
    usePoker.getState().startVisit();
  }, []);

  const bet = pokerBet(store);
  const hand = deal?.hand ?? null;
  const live = hand ? evaluate(hand) : null;
  const lit = phase === "settled" && result ? result.rank : phase === "drawn" || phase === "dealt" ? live : null;

  const playSounds = (n: number) => {
    for (let i = 0; i < n; i++) window.setTimeout(() => sfx.deal(), i * 70);
  };

  const onMain = () => {
    if (phase === "betting" || phase === "settled") {
      if (store.start()) {
        sfx.chip(2);
        playSounds(5);
      }
    } else if (phase === "dealt") {
      playSounds(held.filter((h) => !h).length);
      store.drawCards();
      window.setTimeout(() => celebrate(), 450);
    }
  };

  const celebrate = () => {
    const r = usePoker.getState().result;
    if (!r) return;
    if (r.rank === "royale" || r.rank === "quinte-flush") {
      sfx.blackjack();
      navigator.vibrate?.([40, 60, 40, 60, 120]);
    } else if (r.rank === "carre" || r.rank === "full") {
      sfx.reveal(3);
      navigator.vibrate?.(40);
    } else if (r.pay + r.bonus > pokerBet(usePoker.getState())) sfx.win();
    else if (r.pay > 0) sfx.chip(2);
  };

  const won = result ? result.pay + result.bonus : 0;
  const canStart = jetons >= bet;

  return (
    <div className="showcase-bg flex min-h-[100dvh] flex-col">
      <TopBar back title="VIDÉO POKER" rules="poker" />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-4 px-3 py-4 sm:gap-6 sm:py-6">
        <PayTable coins={coins} denom={denom} lit={lit && lit !== "rien" ? lit : null} />

        <div className="felt poker-felt flex w-full flex-col items-center gap-3 rounded-[22px] px-2 pb-5 pt-4 sm:px-6">
          <div className="flex w-full items-center justify-between px-1">
            <AtoutStrip />
            <span className="label-deco text-[0.55rem] text-[#E9DFC8]/60">Valets ou mieux</span>
          </div>

          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <PokerCard
                key={i}
                index={i}
                card={hand?.[i] ?? null}
                faceUp={!!hand}
                marked={phase === "dealt" && !held[i]}
                width={width}
                onClick={
                  phase === "dealt"
                    ? () => {
                        store.toggleHold(i);
                        sfx.tick();
                      }
                    : phase === "drawn" && swapsLeft > 0
                    ? () => {
                        store.exchange(i);
                        sfx.deal();
                        window.setTimeout(() => celebrate(), 400);
                      }
                    : undefined
                }
              />
            ))}
          </div>

          <div className="flex min-h-[3.2rem] flex-col items-center justify-center text-center">
            {phase === "dealt" && <span className="font-serif text-base italic text-[#E9DFC8]/75">Touchez les cartes à changer, puis tirez.</span>}
            {phase === "drawn" && (
              <>
                <span className="label-deco text-accent">La Lune Noire</span>
                <span className="font-serif text-base italic text-[#E9DFC8]/80">
                  {live && live !== "rien" ? `${HAND_LABEL[live]}. ` : ""}Touchez une carte à échanger, ou encaissez.
                </span>
              </>
            )}
            {phase === "settled" && result && (
              <div className="result-banner flex flex-col items-center">
                <span className={`font-display text-2xl uppercase tracking-[0.2em] sm:text-3xl ${won > bet ? "text-gold" : "text-[#E9DFC8]/75"}`}>
                  {result.rank === "rien" ? (result.refunded ? "Remboursée" : "Rien") : HAND_LABEL[result.rank]}
                </span>
                <span className="font-display text-lg tabular-nums text-[#F1E7D2]">
                  {won > 0 ? `+${fmt(won)}` : ""}
                  {result.bonus > 0 && !result.refunded && <span className="label-deco ml-2 text-[0.55rem] text-accent">dont {fmt(result.bonus)} d'atouts</span>}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bet */}
        <div className="flex w-full max-w-xl flex-col items-center gap-3">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-between">
            <div className="flex items-center gap-1.5">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  disabled={phase === "dealt" || phase === "drawn"}
                  onClick={() => (store.setDenom(d), sfx.tick())}
                  className={`chip-button chip-select ${denom === d ? "is-selected" : ""} disabled:opacity-40`}
                  aria-label={`Jeton de ${d}`}
                >
                  <Chip value={d as ChipValue} size={38} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_COINS }, (_, i) => (
                <button
                  key={i}
                  disabled={phase === "dealt" || phase === "drawn"}
                  onClick={() => (store.setCoins(i + 1), sfx.tick())}
                  className={`coin-step ${coins === i + 1 ? "is-on" : ""}`}
                  aria-label={`${i + 1} unités`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
            {phase === "drawn" && (
              <button className="btn btn-ghost btn-compact" onClick={() => (store.settle(), window.setTimeout(celebrate, 50))}>
                Encaisser
              </button>
            )}
            {phase === "settled" && won > 0 && !result?.refunded && (
              <button className="btn btn-ghost btn-compact" onClick={() => store.startDouble() && sfx.chip()}>
                Quitte ou double
              </button>
            )}
            {phase !== "drawn" && (
              <button className="btn btn-gold btn-compact min-w-[9rem] disabled:opacity-40" disabled={phase !== "dealt" && !canStart} onClick={onMain}>
                {phase === "dealt" ? drawLabel(held.filter((h) => !h).length) : `Distribuer · ${fmt(bet)}`}
              </button>
            )}
          </div>
        </div>
      </div>
      <DoubleRound />
    </div>
  );
}
