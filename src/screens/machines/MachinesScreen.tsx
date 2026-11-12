import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chip } from "@/art/Chip";
import { SlotSymbol } from "@/art/SlotSymbol";
import { sfx } from "@/audio/sfx";
import { TopBar } from "@/components/TopBar";
import { useCountUp } from "@/components/useCountUp";
import { FREE_LADDER, LADDER, REELS, ROWS, SYMBOLS, type Grid, type Sym } from "@/core/slots/engine";
import { BETS, useMachines } from "@/store/machines";
import { useProfile } from "@/store/profile";

const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ");
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

const BIG_TIERS = [
  { x: 100, label: "Gain colossal" },
  { x: 40, label: "Énorme gain" },
  { x: 15, label: "Gros gain" },
];

/** Cell size that fits five reels on the screen. */
function cellSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.floor(Math.min((Math.min(w, 760) - 56) / REELS, (h - 360) / ROWS, 128));
}

/** A blurred strip of symbols scrolling while a reel spins. */
function ReelBlur({ size }: { size: number }) {
  const strip = useMemo(() => Array.from({ length: 9 }, () => SYMBOLS[Math.floor(Math.random() * 9)] as Sym), []);
  return (
    <div className="reel-blur">
      {[...strip, ...strip].map((s, i) => (
        <div key={i} className="slot-cell">
          <SlotSymbol sym={s} size={size} />
        </div>
      ))}
    </div>
  );
}

interface Banner {
  kind: "big" | "free" | "free-end" | "gift";
  title: string;
  amount?: number;
  spins?: number;
}

function BannerOverlay({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  const amount = useCountUp(banner.amount ?? 0, banner.kind === "big" ? 1800 : 900);
  const coins = useMemo(() => Array.from({ length: banner.kind === "big" ? 36 : 0 }, () => ({ x: Math.random() * 100, d: Math.random() * 1.2, s: 0.7 + Math.random() * 0.6 })), [banner.kind]);
  return (
    <div className="slot-banner" onClick={onClose}>
      {coins.map((c, i) => (
        <span key={i} className="coin-fall" style={{ left: `${c.x}%`, animationDelay: `${c.d}s`, "--s": c.s } as CSSProperties}>
          <Chip value={i % 3 ? 100 : 1000} size={30} />
        </span>
      ))}
      <div className="slot-banner-rays" />
      <div className="relative flex flex-col items-center text-center">
        <span className="font-display text-4xl uppercase tracking-[0.2em] text-gold sm:text-6xl">{banner.title}</span>
        {banner.amount !== undefined && <span className="mt-3 font-display text-3xl tabular-nums text-[#F1E7D2] sm:text-5xl">+{fmt(amount)}</span>}
        {banner.spins !== undefined && <span className="mt-3 font-display text-3xl text-[#F1E7D2]">{banner.spins} tours</span>}
        <span className="label-deco mt-6 text-text-muted">Touchez pour continuer</span>
      </div>
    </div>
  );
}

export function MachinesScreen() {
  const store = useMachines();
  const { bet, freeLeft, freeBet, freeTotal, setBet } = store;
  const jetons = useProfile((s) => s.wallet.jetons);
  const [cell, setCell] = useState(cellSize);
  const [grid, setGrid] = useState<Grid>(() => initialGrid());
  const [spinning, setSpinning] = useState<boolean[]>(() => Array(REELS).fill(false));
  const [glow, setGlow] = useState<boolean[][] | null>(null);
  const [burst, setBurst] = useState<boolean[][] | null>(null);
  const [tease, setTease] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [won, setWon] = useState(0);
  const [stepWin, setStepWin] = useState<{ amount: number; key: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);
  const bannerDone = useRef<(() => void) | null>(null);
  const alive = useRef(true);
  const seen = useRef(new Set<number>());
  const shownWon = useCountUp(won, 500);
  const inFree = freeLeft > 0 || !!store.pending?.free;

  useEffect(() => {
    alive.current = true;
    // A pull left half-played is credited on return.
    if (useMachines.getState().pending) useMachines.getState().resolve();
    const onResize = () => setCell(cellSize());
    window.addEventListener("resize", onResize);
    return () => {
      alive.current = false;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const showBanner = (b: Banner) =>
    new Promise<void>((resolve) => {
      setBanner(b);
      const t = window.setTimeout(close, b.kind === "big" ? 4200 : 2600);
      function close() {
        clearTimeout(t);
        setBanner(null);
        bannerDone.current = null;
        resolve();
      }
      bannerDone.current = close;
    });

  const play = async () => {
    if (busy) return;
    const wasFree = useMachines.getState().freeLeft > 0;
    const pull = useMachines.getState().launch();
    if (!pull) {
      setAuto(0);
      return;
    }
    setBusy(true);
    setWon(0);
    setStep(0);
    setGlow(null);
    setBurst(null);
    if (!pull.free) sfx.chip();

    const steps = pull.result.steps;
    const first = steps[0].grid;
    for (const reel of first) for (const c of reel) seen.current.add(c.id);

    // Spin, then stop reel by reel; a third sceau in sight slows the last reels down.
    setSpinning(Array(REELS).fill(true));
    sfx.reelSpin(1.2);
    await sleep(520);
    let sceaux = 0;
    for (let r = 0; r < REELS; r++) {
      if (!alive.current) return;
      const teasing = sceaux >= 2;
      if (teasing) {
        setTease(r);
        sfx.tease();
        await sleep(900);
      } else await sleep(r ? 150 : 0);
      setGrid((g) => g.map((reel, k) => (k === r ? first[r] : reel)));
      setSpinning((s) => s.map((v, k) => (k === r ? false : v)));
      sfx.reelStop(r);
      sceaux += first[r].filter((c) => c.sym === "sceau").length;
    }
    setTease(null);
    await sleep(260);

    let total = 0;
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      if (!st.wins.length) break;
      if (!alive.current) return;
      setStep(i);
      setGlow(st.burst);
      total += st.amount;
      setWon(total);
      setStepWin({ amount: st.amount, key: Date.now() });
      sfx.burst(Math.min(4, i + 1));
      if (st.amount >= st.multiplier * pull.bet) sfx.win();
      await sleep(900);
      setBurst(st.burst);
      await sleep(300);
      setGrid(steps[i + 1].grid);
      setGlow(null);
      setBurst(null);
      await sleep(460);
    }

    useMachines.getState().resolve();
    const final = pull.result.total + pull.bonus;
    setWon(final);
    if (final > 0 && final < pull.bet * 15) sfx.chip(2);

    const tier = BIG_TIERS.find((t) => final >= pull.bet * t.x);
    if (tier) {
      sfx.blackjack();
      navigator.vibrate?.([40, 60, 40, 60, 120]);
      await showBanner({ kind: "big", title: tier.label, amount: final });
    }
    if (pull.granted && !pull.gift) {
      sfx.reveal(3);
      await showBanner({ kind: "free", title: wasFree ? "Tours relancés" : "Tours gratuits", spins: pull.granted });
    } else if (pull.gift) {
      sfx.reveal(1);
      await showBanner({ kind: "gift", title: "Le Festin offre un tour" });
    }
    const st = useMachines.getState();
    if (wasFree && st.freeLeft === 0 && !pull.granted) {
      sfx.reveal(2);
      await showBanner({ kind: "free-end", title: "Fin des tours gratuits", amount: st.freeTotal });
      st.endFreeRound();
    }
    setBusy(false);
  };

  // Free spins play themselves; auto spins too, until the counter runs out.
  useEffect(() => {
    if (busy || banner) return;
    if (freeLeft > 0 || auto > 0) {
      const t = window.setTimeout(() => {
        if (auto > 0 && freeLeft === 0) setAuto((a) => a - 1);
        void play();
      }, 650);
      return () => clearTimeout(t);
    }
  }, [busy, banner, freeLeft, auto]); // eslint-disable-line react-hooks/exhaustive-deps

  const ladder = inFree ? FREE_LADDER : LADDER;
  const betIndex = BETS.indexOf(bet as (typeof BETS)[number]);
  const canSpin = !busy && (freeLeft > 0 || jetons >= bet);

  return (
    <div className="showcase-bg flex min-h-[100dvh] flex-col">
      <TopBar back title="MACHINES" />
      <div className="flex flex-1 flex-col items-center justify-center px-3 py-4 sm:py-8">
        <div className={`cabinet ${inFree ? "is-free" : ""}`} style={{ "--cell": `${cell}px` } as CSSProperties}>
          {/* Marquee */}
          <div className="cabinet-marquee">
            <svg viewBox="0 0 400 70" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              {Array.from({ length: 23 }, (_, i) => {
                const t = i / 22;
                const x = 20 + t * 360;
                const y = 40 - Math.sin(t * Math.PI) * 32;
                return <circle key={i} cx={x} cy={y} r={2.6} className={`bulb ${i % 2 ? "bulb-b" : "bulb-a"}`} />;
              })}
            </svg>
            <span className="relative font-display text-lg tracking-[0.35em] text-gold sm:text-2xl">LE GRAND HALL</span>
            <span className="label-deco relative mt-1 text-[0.55rem] text-text-muted">243 façons de gagner</span>
          </div>

          {/* Reels */}
          <div className="reels">
            {grid.map((reel, r) => (
              <div key={r} className={`reel ${tease === r ? "is-teasing" : ""}`}>
                {spinning[r] ? (
                  <ReelBlur size={cell * 0.74} />
                ) : (
                  reel.map((c, row) => {
                    const isNew = !seen.current.has(c.id);
                    if (isNew) seen.current.add(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`slot-cell is-placed ${isNew ? "is-new" : ""} ${glow?.[r][row] ? "is-glowing" : ""} ${burst?.[r][row] ? "is-bursting" : ""} ${
                          c.sym === "sceau" ? "is-scatter" : ""
                        }`}
                        style={{ top: row * cell }}
                      >
                        <SlotSymbol sym={c.sym} size={cell * 0.74} />
                      </div>
                    );
                  })
                )}
              </div>
            ))}
            {stepWin && stepWin.amount > 0 && (
              <span key={stepWin.key} className="step-win">
                +{fmt(stepWin.amount)}
              </span>
            )}
          </div>

          {/* Info bar */}
          <div className="cabinet-info">
            <div className="flex flex-col items-start">
              <span className="label-deco text-[0.55rem] text-text-muted">{inFree ? `Tours gratuits · mise ${fmt(freeBet)}` : "Mise"}</span>
              <span className="font-display text-lg tabular-nums">{inFree ? freeLeft : fmt(bet)}</span>
            </div>
            <div className="flex gap-1">
              {ladder.map((m, i) => (
                <span key={m} className={`ladder-step ${busy && won > 0 && Math.min(step, ladder.length - 1) === i ? "is-on" : ""}`}>
                  ×{m}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-end">
              <span className="label-deco text-[0.55rem] text-text-muted">{inFree ? "Total tours" : "Gain"}</span>
              <span className={`font-display text-lg tabular-nums ${won > 0 ? "text-gold" : ""}`}>{fmt(inFree ? freeTotal + shownWon : shownWon)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex w-full max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="bet-step" disabled={busy || inFree || betIndex <= 0} onClick={() => (setBet(BETS[betIndex - 1]), sfx.tick())} aria-label="Baisser la mise">
              −
            </button>
            <div className="flex w-16 flex-col items-center">
              <span className="label-deco text-[0.5rem] text-text-muted">Mise</span>
              <span className="font-display text-lg tabular-nums">{fmt(bet)}</span>
            </div>
            <button className="bet-step" disabled={busy || inFree || betIndex >= BETS.length - 1} onClick={() => (setBet(BETS[betIndex + 1]), sfx.tick())} aria-label="Augmenter la mise">
              +
            </button>
          </div>

          <button className={`spin-button ${busy ? "is-busy" : ""}`} disabled={!canSpin} onClick={() => void play()} aria-label="Lancer">
            <svg viewBox="-20 -20 40 40" width={34} height={34}>
              <path d="M0 -12A12 12 0 1 1 -11.4 -3.7" fill="none" stroke="#1a1308" strokeWidth={3.2} strokeLinecap="round" />
              <path d="M-15 -9L-11 -2L-5 -7Z" fill="#1a1308" />
            </svg>
          </button>

          <button
            className={`label-deco w-24 rounded-pill border px-3 py-2 text-[0.6rem] transition ${auto > 0 ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"}`}
            disabled={inFree}
            onClick={() => {
              setAuto(auto > 0 ? 0 : 10);
              sfx.tick();
            }}
          >
            {auto > 0 ? `Auto · ${auto}` : "Auto ×10"}
          </button>
        </div>
      </div>

      {banner && <BannerOverlay banner={banner} onClose={() => bannerDone.current?.()} />}
    </div>
  );
}

function initialGrid(): Grid {
  let id = -1000;
  const pick: Sym[] = ["soleil", "couronne", "lune", "coupe", "cle", "joker", "pique", "coeur", "carreau", "trefle"];
  return Array.from({ length: REELS }, (_, r) => Array.from({ length: ROWS }, (_, row) => ({ sym: r === 0 && pick[(r * 3 + row) % 10] === "joker" ? "soleil" : pick[(r * 3 + row) % 10], id: id-- })));
}
