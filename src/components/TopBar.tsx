import { useEffect, useRef, useState } from "react";
import { CURRENCY_LABEL, CurrencyIcon, type Currency } from "@/art/CurrencyIcon";
import { navigate } from "@/app/router";
import { music } from "@/audio/music";
import { sfx } from "@/audio/sfx";
import { useProfile } from "@/store/profile";
import { RulesSheet, type RulesGame } from "./RulesSheet";
import { useCountUp } from "./useCountUp";

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");

function Counter({ currency }: { currency: Currency }) {
  const amount = useProfile((s) => s.wallet[currency]);
  const shown = useCountUp(amount);
  return (
    <div
      className="flex items-center gap-2 rounded-pill border border-border bg-surface/80 py-1 pl-1 pr-3 sm:gap-2.5 sm:py-1.5 sm:pl-1.5 sm:pr-4"
      title={CURRENCY_LABEL[currency]}
    >
      <CurrencyIcon currency={currency} size={22} />
      <span className="whitespace-nowrap font-display text-[0.9rem] tabular-nums tracking-wide text-text-primary sm:text-[0.95rem]">{fmt(Math.round(shown))}</span>
    </div>
  );
}

function Switch({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-6 py-2" onClick={onToggle} role="switch" aria-checked={on}>
      <span className="label-deco text-text-secondary">{label}</span>
      <span className={`relative h-5 w-9 rounded-pill transition ${on ? "bg-accent" : "bg-surface-hover"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-pill bg-canvas transition-all ${on ? "left-[1.1rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Speaker button opening the music and sound-effect switches. */
function SoundMenu() {
  const { muted, musicOn, setMuted, setMusicOn } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const silent = muted && !musicOn;
  return (
    <div ref={ref} className="relative">
      <button
        className="grid h-9 w-9 place-items-center rounded-pill border border-border text-accent transition hover:bg-surface-hover"
        onClick={() => setOpen(!open)}
        aria-label="Son et musique"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" fillOpacity={0.15} />
          {silent ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />}
        </svg>
      </button>
      {open && (
        <div className="panel-deco absolute right-0 top-11 z-40 w-56 px-4 py-2">
          <Switch
            label="Musique"
            on={musicOn}
            onToggle={() => {
              setMusicOn(!musicOn);
              // This tap is the gesture that lets the audio start.
              if (!musicOn) {
                music.setEnabled(true);
                music.start();
              }
            }}
          />
          <Switch
            label="Effets"
            on={!muted}
            onToggle={() => {
              setMuted(!muted);
              if (muted) setTimeout(() => sfx.tick(), 0);
            }}
          />
        </div>
      )}
    </div>
  );
}

/** App header: way back to the salon, the three balances, and the sound switch. */
/** Small "?" button opening the rules of the current game. */
function RulesButton({ game }: { game: RulesGame }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="grid h-9 w-9 place-items-center rounded-pill border border-border font-display text-lg italic text-accent transition hover:bg-surface-hover"
        onClick={() => {
          setOpen(true);
          sfx.tick();
        }}
        aria-label="Règles et gains"
        title="Règles et gains"
      >
        ?
      </button>
      {open && <RulesSheet game={game} onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * `full` shows all three balances on phones too (screens where every currency matters);
 * `rules` adds the rules button of a game.
 */
export function TopBar({ back = false, title, full = false, rules }: { back?: boolean; title?: string; full?: boolean; rules?: RulesGame }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-canvas/85 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-8 sm:py-3">
        <div className="flex min-w-0 items-center gap-3">
          {back ? (
            <button
              onClick={() => navigate("salon")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-border text-accent transition hover:bg-surface-hover"
              aria-label="Retour au salon"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M14.5 5.5L8 12l6.5 6.5" />
              </svg>
            </button>
          ) : null}
          <span className={`font-display tracking-[0.3em] text-gold ${back ? "hidden text-lg md:block" : "hidden text-xl sm:block"}`}>
            {title ?? "CASINOW"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Counter currency="jetons" />
          <span className={full ? "contents" : "hidden sm:contents"}>
            <Counter currency="poussiere" />
            <Counter currency="sceaux" />
          </span>
          {rules && <RulesButton game={rules} />}
          <SoundMenu />
        </div>
      </div>
    </div>
  );
}
