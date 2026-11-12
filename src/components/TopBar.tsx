import { CURRENCY_LABEL, CurrencyIcon, type Currency } from "@/art/CurrencyIcon";
import { navigate } from "@/app/router";
import { sfx } from "@/audio/sfx";
import { useProfile } from "@/store/profile";
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

function SoundToggle() {
  const muted = useProfile((s) => s.muted);
  const setMuted = useProfile((s) => s.setMuted);
  return (
    <button
      className="grid h-9 w-9 place-items-center rounded-pill border border-border text-accent transition hover:bg-surface-hover"
      onClick={() => {
        setMuted(!muted);
        if (muted) setTimeout(() => sfx.tick(), 0);
      }}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      title={muted ? "Activer le son" : "Couper le son"}
    >
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" fillOpacity={0.15} />
        {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />}
      </svg>
    </button>
  );
}

/** App header: way back to the salon, the three balances, and the sound switch. */
/** `full` shows all three balances on phones too (screens where every currency matters). */
export function TopBar({ back = false, title, full = false }: { back?: boolean; title?: string; full?: boolean }) {
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
          <SoundToggle />
        </div>
      </div>
    </div>
  );
}
