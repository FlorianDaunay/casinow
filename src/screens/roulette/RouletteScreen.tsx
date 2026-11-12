import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Chip, CHIP_VALUES, type ChipValue } from "@/art/Chip";
import { POCKET_STEP, RouletteWheel, WHEEL, type WheelHandle } from "@/art/RouletteWheel";
import { sfx } from "@/audio/sfx";
import { TopBar } from "@/components/TopBar";
import { colorOf, totalStake, WHEEL_ORDER } from "@/core/roulette/engine";
import { ROULETTE_MIN, useRoulette, type PendingSpin } from "@/store/roulette";
import { useProfile } from "@/store/profile";
import { RouletteBoard } from "./RouletteBoard";

const SPIN_MS = 6200;
/** Share of the spin after which the ball has settled in its pocket. */
const SETTLE_AT = 0.86;
const DROP_AT = 0.58;

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const mod = (a: number, m: number) => ((a % m) + m) % m;

function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia("(min-width: 1024px)");
      q.addEventListener("change", cb);
      return () => q.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches
  );
}

/**
 * Drives the wheel every frame: a slow idle turn, then a spin where the ball rolls against
 * the rotor, drops, skips over a few frets and settles in the drawn pocket.
 */
function useWheel(handle: React.RefObject<WheelHandle>) {
  const s = useRef({
    wheel: 0,
    /** Ball angle relative to the rotor, once it rests in a pocket. */
    rest: null as number | null,
    spin: null as null | { start: number; w0: number; turn: number; final: number; R: number; lastFret: number; done: () => void },
  });

  useEffect(() => {
    let frame = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const st = s.current;
      const dt = (now - prev) / 1000;
      prev = now;
      let ballDeg = 0;
      let ballR: number = WHEEL.pocketBall;
      let visible = st.rest !== null;
      if (st.spin) {
        const sp = st.spin;
        const t = Math.min(1, (now - sp.start) / SPIN_MS);
        st.wheel = sp.w0 + sp.turn * easeOut(t);
        const u = Math.min(1, t / SETTLE_AT);
        const rel = sp.final + sp.R * (1 - easeOut(u));
        ballDeg = st.wheel + rel;
        visible = true;
        if (t < DROP_AT) ballR = WHEEL.track - 1;
        else if (t < SETTLE_AT) {
          const k = (t - DROP_AT) / (SETTLE_AT - DROP_AT);
          const bounce = Math.abs(Math.sin(k * Math.PI * 3.5)) * (1 - k) * 9;
          ballR = WHEEL.pocketBall + (WHEEL.track - 1 - WHEEL.pocketBall) * Math.pow(1 - k, 2) + bounce;
          // A click each time the ball crosses a fret.
          const fret = Math.floor(rel / POCKET_STEP);
          if (fret !== sp.lastFret) {
            sp.lastFret = fret;
            sfx.fret();
          }
        }
        if (t >= 1) {
          st.rest = sp.final;
          st.spin = null;
          sp.done();
        }
      } else {
        st.wheel += 9 * dt;
        if (st.rest !== null) ballDeg = st.wheel + st.rest;
      }
      handle.current?.set(st.wheel, ballDeg, ballR, visible);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [handle]);

  return useCallback((number: number, done: () => void) => {
    const st = s.current;
    const final = WHEEL_ORDER.indexOf(number as (typeof WHEEL_ORDER)[number]) * POCKET_STEP;
    const startRel = Math.random() * 360;
    const R = mod(startRel - final, 360) + 360 * 7;
    st.rest = null;
    st.spin = { start: performance.now(), w0: st.wheel, turn: 360 * 1.6 + Math.random() * 120, final, R, lastFret: NaN, done };
    sfx.roll(SPIN_MS / 1000);
  }, []);
}

function History({ numbers }: { numbers: number[] }) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      {numbers.slice(0, 14).map((n, i) => (
        <span
          key={`${i}-${n}`}
          className={`history-dot ${i === 0 ? "is-latest" : ""}`}
          style={{ background: colorOf(n) === "rouge" ? "#7E1A22" : colorOf(n) === "noir" ? "#110F0C" : "#1C523D", opacity: 1 - i * 0.05 }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function ResultMedallion({ spin }: { spin: PendingSpin }) {
  const net = spin.payout + spin.bonus - spin.staked;
  const color = colorOf(spin.number);
  return (
    <div className="result-banner flex flex-col items-center">
      <span className="result-number" style={{ background: color === "rouge" ? "#7E1A22" : color === "noir" ? "#110F0C" : "#1C523D" }}>
        {spin.number}
      </span>
      <span className={`mt-3 font-display text-2xl tabular-nums tracking-wider ${net > 0 ? "text-gold" : "text-[#E9DFC8]/60"}`}>
        {net > 0 ? `+${fmt(net)}` : net < 0 ? `−${fmt(-net)}` : "Mise rendue"}
      </span>
      {spin.refunded && <span className="label-deco mt-1 text-[0.6rem] text-accent">Tapis pipé : tour remboursé</span>}
      {!spin.refunded && spin.bonus > 0 && <span className="label-deco mt-1 text-[0.6rem] text-accent">dont +{fmt(spin.bonus)} d'atouts</span>}
    </div>
  );
}

export function RouletteScreen() {
  const wide = useWide();
  const wheelRef = useRef<WheelHandle>(null);
  const spinTo = useWheel(wheelRef);
  const { bets, lastBets, history, last, place, clear, undo, rebet, launch, resolve, startVisit } = useRoulette();
  const jetons = useProfile((s) => s.wallet.jetons);
  const [chip, setChip] = useState<ChipValue>(10);
  const [rolling, setRolling] = useState(false);
  const [overlay, setOverlay] = useState(false);

  // A spin left rolling when the player walked away is settled on return.
  useEffect(() => {
    startVisit();
    if (useRoulette.getState().pending) useRoulette.getState().resolve();
  }, [startVisit]);

  const staked = totalStake(bets);
  const canLaunch = !rolling && staked >= ROULETTE_MIN;

  const go = () => {
    const spin = launch();
    if (!spin) return;
    sfx.chip(2);
    setRolling(true);
    setOverlay(!wide);
    spinTo(spin.number, () => {
      sfx.clack();
      resolve();
      setRolling(false);
      const net = spin.payout + spin.bonus - spin.staked;
      window.setTimeout(() => {
        if (net > 0) {
          sfx.win();
          sfx.chip(3);
          navigator.vibrate?.(35);
        } else if (net < 0) sfx.lose();
        else sfx.push();
      }, 250);
    });
  };

  const winning = !rolling && last ? last.number : null;
  const shown = !rolling ? last : null;

  const controls = (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full max-w-xl items-center justify-between gap-1 sm:justify-center sm:gap-3">
        {CHIP_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => {
              setChip(v);
              sfx.tick();
            }}
            className={`chip-button chip-select ${chip === v ? "is-selected" : ""}`}
            aria-label={`Jeton ${v}`}
            aria-pressed={chip === v}
          >
            <Chip value={v} size={46} />
          </button>
        ))}
      </div>
      <div className="flex w-full max-w-xl items-center justify-center gap-2 sm:gap-3">
        <button className="btn btn-ghost btn-compact disabled:opacity-30" disabled={rolling || !staked} onClick={() => (clear(), sfx.tick())}>
          Effacer
        </button>
        <button
          className="btn btn-ghost btn-compact disabled:opacity-30"
          disabled={rolling || !totalStake(lastBets) || totalStake(lastBets) > jetons || staked > 0}
          onClick={() => rebet() && sfx.chip(2)}
        >
          Remiser
        </button>
        <button className="btn btn-gold btn-compact min-w-[8.5rem] disabled:opacity-40" disabled={!canLaunch} onClick={go}>
          {rolling ? "Rien ne va plus" : `Lancer${staked ? ` · ${fmt(staked)}` : ""}`}
        </button>
      </div>
    </div>
  );

  const board = (
    <RouletteBoard
      bets={bets}
      horizontal={wide}
      winning={winning}
      disabled={rolling}
      onPlace={(key) => {
        if (place(key, chip)) sfx.chip();
      }}
      onRemove={(key) => {
        undo(key);
        sfx.tick();
      }}
    />
  );

  if (wide) {
    return (
      <div className="showcase-bg flex min-h-[100dvh] flex-col">
        <TopBar back title="ROULETTE" />
        <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-[420px_1fr] items-center gap-10 px-8 py-8">
          <div className="flex flex-col items-center gap-6">
            <div className="wheel-shadow">
              <RouletteWheel ref={wheelRef} size={400} highlight={winning} />
            </div>
            <div className="flex min-h-[8rem] items-start justify-center">{shown && <ResultMedallion spin={shown} />}</div>
          </div>
          <div className="flex flex-col gap-6">
            <History numbers={history} />
            {board}
            {controls}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="showcase-bg flex h-[100dvh] flex-col overflow-hidden">
      <TopBar back title="ROULETTE" />
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <History numbers={history} />
        {shown && (
          <span className="shrink-0 font-display text-sm tabular-nums text-text-secondary">
            {shown.payout + shown.bonus - shown.staked > 0 ? <span className="text-gold">+{fmt(shown.payout + shown.bonus - shown.staked)}</span> : null}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">{board}</div>
      <div className="border-t border-border bg-canvas/95 px-3 pt-3" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
        {controls}
      </div>

      {/* The wheel takes the stage while the ball rolls (it stays mounted so the rotor keeps turning). */}
      <div className={`wheel-overlay ${overlay ? "is-open" : ""}`} onClick={() => !rolling && setOverlay(false)}>
        <div className="wheel-shadow">
          <RouletteWheel ref={wheelRef} size={Math.min(window.innerWidth - 32, 380)} highlight={winning} />
        </div>
        <div className="mt-8 flex min-h-[7rem] flex-col items-center">
          {shown && <ResultMedallion spin={shown} />}
          {shown && <span className="label-deco mt-6 text-text-muted">Touchez pour revenir au tapis</span>}
          {rolling && <span className="label-deco text-text-secondary">Rien ne va plus</span>}
        </div>
      </div>
    </div>
  );
}
