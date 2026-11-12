import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Booster } from "@/art/Booster";
import { CardBack } from "@/art/CardBack";
import { CurrencyIcon } from "@/art/CurrencyIcon";
import { MATERIALS } from "@/art/materials";
import { sfx } from "@/audio/sfx";
import { CollectibleCard } from "@/components/CollectibleCard";
import { BOOSTERS, type BoosterTier } from "@/core/cards/booster";
import { cryptoRandom, shuffle } from "@/core/cards/playing";
import { describePower, FAMILY_BONUS } from "@/core/cards/catalog";
import { RARITIES, type Rarity } from "@/core/cards/types";
import type { OpenResult } from "@/store/collection";

type Stage = "sealed" | "tearing" | "dealt";

/** How long a top card must be held before it turns. */
const HOLD_MS = 1200;

const tierOf = (r: Rarity) => RARITIES.indexOf(r);
const needsHold = (r: Rarity) => tierOf(r) >= 3;

/** A burst of gold flakes from the center of its parent. */
function Burst({ color, count, spread }: { color: string; count: number; spread: number }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = spread * (0.5 + Math.random() * 0.6);
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 4 + Math.random() * 7,
          delay: Math.random() * 0.12,
          spin: Math.random() * 360,
        };
      }),
    [count, spread]
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="burst-flake"
          style={
            {
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              "--spin": `${f.spin}deg`,
              width: f.size,
              height: f.size,
              background: i % 3 ? color : "#FFF3D0",
              animationDelay: `${f.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

interface SlotProps {
  index: number;
  /** Center of the card inside the pentagon, in px. */
  at: { x: number; y: number };
  pull: OpenResult["pulls"][number];
  revealed: boolean;
  width: number;
  onReveal: () => void;
  onHoldChange: (holding: boolean) => void;
}

function CardSlot({ index, at, pull, revealed, width, onReveal, onHoldChange }: SlotProps) {
  const { card, finish, isNew } = pull;
  const m = MATERIALS[card.rarity];
  const tier = tierOf(card.rarity);
  const hold = needsHold(card.rarity);
  const [progress, setProgress] = useState(0);
  const holdRef = useRef<{ start: number; frame: number; stop: () => void } | null>(null);

  const cancelHold = () => {
    const h = holdRef.current;
    if (!h) return;
    cancelAnimationFrame(h.frame);
    h.stop();
    holdRef.current = null;
    setProgress(0);
    onHoldChange(false);
  };

  useEffect(() => cancelHold, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e: PointerEvent) => {
    if (revealed) return;
    if (!hold) {
      onReveal();
      return;
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const start = performance.now();
    const stop = sfx.charge();
    onHoldChange(true);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        cancelAnimationFrame(holdRef.current!.frame);
        holdRef.current!.stop();
        holdRef.current = null;
        onHoldChange(false);
        setProgress(0);
        onReveal();
        return;
      }
      holdRef.current!.frame = requestAnimationFrame(tick);
    };
    holdRef.current = { start, stop, frame: requestAnimationFrame(tick) };
  };

  const r = 46;
  const circ = 2 * Math.PI * r;

  return (
    <div
      className="pack-slot absolute"
      style={{ left: at.x - width / 2, top: at.y - (width * 1.4) / 2, width, animationDelay: `${0.1 + index * 0.12}s`, zIndex: revealed ? 2 : 1 }}
    >
      {revealed && (
        <span className={`slot-tag label-deco absolute -top-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-pill border px-2 py-0.5 text-[0.5rem] ${isNew ? "border-accent/60 bg-[#1a1308] text-gold" : "border-border bg-canvas text-text-muted"}`}>
          {isNew ? "Nouveau" : "Doublon"}
        </span>
      )}
      <div
        className={`slot-card relative ${revealed ? "" : "cursor-pointer"} ${!revealed && tier >= 2 ? `aura-${card.rarity}` : ""} ${progress > 0 ? "is-holding" : ""}`}
        style={{ width, "--glow": m.glow, "--shake": `${progress * 3}px` } as CSSProperties}
        onPointerDown={onDown}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={() => progress < 1 && cancelHold()}
      >
        <div className={`slot-flip ${revealed ? "is-up" : ""}`}>
          <div className="slot-side slot-back">
            <div className="collectible" style={{ width, boxShadow: tier >= 1 ? `0 0 ${18 + tier * 14}px -4px ${m.glow}` : undefined }}>
              <div className="collectible-face">
                <CardBack glow={tier >= 1 ? m.glow : undefined} />
              </div>
            </div>
          </div>
          <div className="slot-side slot-front">{revealed && <CollectibleCard card={card} finish={finish} width={width} />}</div>
        </div>
        {progress > 0 && (
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[70%] -translate-x-1/2 -translate-y-1/2">
            <circle r={r} cx={50} cy={50} fill="rgb(0 0 0 / 0.45)" stroke="rgb(255 255 255 / 0.12)" strokeWidth={3} />
            <circle
              r={r}
              cx={50}
              cy={50}
              fill="none"
              stroke={m.glow}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              transform="rotate(-90 50 50)"
            />
          </svg>
        )}
        {revealed && tier >= 1 && <Burst color={m.glow} count={tier >= 3 ? 48 : tier * 10} spread={tier >= 3 ? 260 : 120} />}
      </div>
      {!revealed && hold && progress === 0 && (
        <span className="label-deco hold-hint pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-pill bg-black/70 px-2 py-0.5 text-[0.5rem] text-[#F1E7D2]">
          Maintenir
        </span>
      )}
    </div>
  );
}

interface Props {
  tier: BoosterTier;
  result: OpenResult;
  canAgain: boolean;
  onAgain: () => void;
  onCollection: () => void;
  onClose: () => void;
}

/** Full-screen pack opening: tear the foil, then turn the cards one by one. */
export function PackOpening({ tier, result, canAgain, onAgain, onCollection, onClose }: Props) {
  const [stage, setStage] = useState<Stage>("sealed");
  const [revealed, setRevealed] = useState<boolean[]>(() => result.pulls.map(() => false));
  const [holding, setHolding] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const drag = useRef<{ x: number } | null>(null);
  const def = BOOSTERS[tier];

  const [width, setWidth] = useState(() => cardWidth());
  const layout = pentagon(width);
  // Each card lands on a random point, so the best one can be anywhere.
  const [places] = useState(() => shuffle([0, 1, 2, 3, 4], cryptoRandom));
  useEffect(() => {
    const onResize = () => setWidth(cardWidth());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tear = () => {
    if (stage !== "sealed") return;
    setStage("tearing");
    sfx.tear();
    navigator.vibrate?.(20);
    window.setTimeout(() => sfx.whoosh(), 450);
    window.setTimeout(() => setStage("dealt"), 900);
  };

  const reveal = (i: number) => {
    if (revealed[i]) return;
    const rarity = result.pulls[i].card.rarity;
    const tier = tierOf(rarity);
    setRevealed((r) => r.map((x, k) => (k === i ? true : x)));
    window.setTimeout(() => sfx.reveal(tier), 180);
    if (tier >= 3) {
      setFlash(MATERIALS[rarity].glow);
      window.setTimeout(() => setFlash(null), 900);
      navigator.vibrate?.([40, 40, 90]);
    } else if (tier === 2) navigator.vibrate?.(25);
  };

  const revealRest = () => {
    result.pulls.forEach((p, i) => {
      if (!revealed[i] && !needsHold(p.card.rarity)) window.setTimeout(() => reveal(i), i * 140);
    });
  };

  const allRevealed = revealed.every(Boolean);
  const pendingSimple = result.pulls.some((p, i) => !revealed[i] && !needsHold(p.card.rarity));

  return (
    <div className={`pack-scene fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden ${holding ? "is-dim" : ""}`}>
      {flash && <div className="pack-flash" style={{ "--flash": flash } as CSSProperties} />}

      <button className="absolute right-4 top-4 z-40 label-deco text-text-muted hover:text-accent" style={{ marginTop: "env(safe-area-inset-top)" }} onClick={onClose}>
        Fermer
      </button>

      {stage !== "dealt" && (
        <div className="flex flex-col items-center">
          <div
            className={`pack-sealed relative ${stage === "tearing" ? "is-tearing" : ""}`}
            style={{ width: "min(62vw, 270px)" }}
            onPointerDown={(e) => (drag.current = { x: e.clientX })}
            onPointerUp={() => {
              drag.current = null;
              tear();
            }}
          >
            <div className="pack-top">
              <Booster tier={tier} />
            </div>
            <div className="pack-body">
              <Booster tier={tier} />
            </div>
          </div>
          <p className={`label-deco mt-10 text-text-secondary transition-opacity ${stage === "sealed" ? "opacity-100" : "opacity-0"}`}>Touchez pour déchirer</p>
        </div>
      )}

      {stage === "dealt" && (
        <>
          <p className="label-deco mb-6 text-text-muted">{def.name}</p>
          <div className="relative" style={{ width: layout.width, height: layout.height }}>
            {result.pulls.map((pull, i) => (
              <CardSlot
                key={i}
                index={i}
                at={layout.points[places[i]]}
                pull={pull}
                revealed={revealed[i]}
                width={width}
                onReveal={() => reveal(i)}
                onHoldChange={setHolding}
              />
            ))}
          </div>

          <div className="mt-8 flex min-h-[3.5rem] flex-wrap items-center justify-center gap-3 px-4">
            {!allRevealed && pendingSimple && (
              <button className="btn btn-ghost btn-compact" onClick={revealRest}>
                Tout retourner
              </button>
            )}
            {allRevealed && (
              <>
                <button className="btn btn-ghost btn-compact" onClick={onCollection}>
                  Collection
                </button>
                {canAgain && (
                  <button className="btn btn-gold btn-compact" onClick={onAgain}>
                    Encore · {def.price.amount.toLocaleString("fr-FR")}
                    <CurrencyIcon currency={def.price.currency} size={16} />
                  </button>
                )}
              </>
            )}
          </div>

          {allRevealed && result.completed.length > 0 && (
            <div className="family-complete mt-6 flex flex-col items-center gap-1 px-6 text-center">
              {result.completed.map((f) => (
                <p key={f} className="font-serif text-lg italic text-text-secondary">
                  <span className="font-display not-italic text-gold">{f}</span> complète : {describePower(FAMILY_BONUS[f].power).toLowerCase()} +{FAMILY_BONUS[f].sceaux} sceaux.
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Distance from the pentagon's center to each card, in card widths. */
const RADIUS = 1.5;
const SIN72 = Math.sin((72 * Math.PI) / 180);
const COS36 = Math.cos((36 * Math.PI) / 180);

/** Largest card that lets the whole pentagon fit the screen, with room for the buttons. */
function cardWidth(): number {
  const w = window.innerWidth - 24;
  const h = window.innerHeight - 220;
  const across = 2 * SIN72 * RADIUS + 1;
  const tall = (1 + COS36) * RADIUS + 1.4;
  return Math.floor(Math.min(200, w / across, h / tall));
}

/** The five card centers, clockwise from the top. */
function pentagon(width: number) {
  const r = RADIUS * width;
  const halfW = SIN72 * r + width / 2;
  const top = r + (width * 1.4) / 2;
  const points = Array.from({ length: 5 }, (_, k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    return { x: halfW + Math.cos(a) * r, y: top + Math.sin(a) * r };
  });
  return { points, width: halfW * 2, height: top + COS36 * r + (width * 1.4) / 2 };
}
