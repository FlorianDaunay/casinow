import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Chip } from "@/art/Chip";
import { chipsFor } from "@/components/ChipStack";
import { betKey, colorOf, covers, parseBetKey, type BetKind } from "@/core/roulette/engine";

interface Spot {
  key: string;
  bet: BetKind;
  label: ReactNode;
  /** Grid placement for the vertical (phone) and horizontal (wide) layouts. */
  v: CSSProperties;
  h: CSSProperties;
  kind: "number" | "outside";
}

const NUMBER_BG = { rouge: "#7E1A22", noir: "#110F0C", vert: "#1C523D" } as const;

const Diamond = ({ color }: { color: string }) => (
  <svg viewBox="-10 -10 20 20" className="h-4 w-6">
    <path d="M0 -8L10 0L0 8L-10 0Z" fill={color} stroke="#C9A55A" strokeWidth={0.8} />
  </svg>
);

const SPOTS: Spot[] = (() => {
  const spots: Spot[] = [];
  const zero: BetKind = { type: "plein", number: 0 };
  spots.push({ key: betKey(zero), bet: zero, label: "0", kind: "number", v: { gridRow: 1, gridColumn: "2 / 5" }, h: { gridColumn: 1, gridRow: "1 / 4" } });
  for (let n = 1; n <= 36; n++) {
    const bet: BetKind = { type: "plein", number: n };
    spots.push({
      key: betKey(bet),
      bet,
      label: String(n),
      kind: "number",
      v: { gridRow: Math.ceil(n / 3) + 1, gridColumn: ((n - 1) % 3) + 2 },
      h: { gridColumn: Math.ceil(n / 3) + 1, gridRow: 3 - ((n - 1) % 3) },
    });
  }
  (["1re 12", "2e 12", "3e 12"] as const).forEach((label, i) => {
    const bet: BetKind = { type: "douzaine", index: i as 0 | 1 | 2 };
    spots.push({ key: betKey(bet), bet, label, kind: "outside", v: { gridRow: `${2 + i * 4} / span 4`, gridColumn: 1 }, h: { gridRow: 4, gridColumn: `${2 + i * 4} / span 4` } });
  });
  [0, 1, 2].forEach((i) => {
    const bet: BetKind = { type: "colonne", index: i as 0 | 1 | 2 };
    spots.push({ key: betKey(bet), bet, label: "2 : 1", kind: "outside", v: { gridRow: 14, gridColumn: i + 2 }, h: { gridColumn: 14, gridRow: 3 - i } });
  });
  const chances: [BetKind, ReactNode][] = [
    [{ type: "manque" }, "1 – 18"],
    [{ type: "pair" }, "Pair"],
    [{ type: "rouge" }, <Diamond key="r" color="#8E1E26" />],
    [{ type: "noir" }, <Diamond key="n" color="#0E0C0A" />],
    [{ type: "impair" }, "Impair"],
    [{ type: "passe" }, "19 – 36"],
  ];
  chances.forEach(([bet, label], k) => {
    spots.push({
      key: betKey(bet),
      bet,
      label,
      kind: "outside",
      // Phone: two rows of three under the columns.
      v: { gridRow: 15 + Math.floor(k / 3), gridColumn: `${(k % 3) + 2}` },
      h: { gridRow: 5, gridColumn: `${2 + k * 2} / span 2` },
    });
  });
  return spots;
})();

interface Props {
  bets: Record<string, number>;
  horizontal: boolean;
  /** Winning number to highlight once the ball has landed. */
  winning: number | null;
  disabled: boolean;
  onPlace: (key: string) => void;
  onRemove: (key: string) => void;
}

/** The betting layout printed on the felt. Tap to bet; long press (or right click) to take back. */
export function RouletteBoard({ bets, horizontal, winning, disabled, onPlace, onRemove }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const press = useRef<{ key: string; timer: number; long: boolean } | null>(null);
  const hoverBet = hover ? parseBetKey(hover) : null;

  const start = (key: string) => {
    if (disabled) return;
    const timer = window.setTimeout(() => {
      if (press.current) press.current.long = true;
      onRemove(key);
    }, 520);
    press.current = { key, timer, long: false };
  };
  const end = (key: string) => {
    const p = press.current;
    press.current = null;
    if (!p || p.key !== key) return;
    clearTimeout(p.timer);
    if (!p.long) onPlace(key);
  };

  return (
    <div
      className={`roulette-board felt grid select-none p-2 sm:p-3 ${horizontal ? "is-horizontal" : "is-vertical"}`}
      style={{
        gridTemplateColumns: horizontal ? "0.9fr repeat(12, 1fr) 0.9fr" : "0.62fr repeat(3, 1fr)",
        gridTemplateRows: horizontal ? "repeat(3, 3.4rem) 2.8rem 2.8rem" : "2.3rem repeat(12, 1.85rem) 2rem 2.2rem 2.2rem",
      }}
    >
      {SPOTS.map((s) => {
        const stake = bets[s.key] ?? 0;
        const n = s.bet.type === "plein" ? s.bet.number : null;
        const isWinningNumber = winning !== null && n === winning;
        const isWinningBet = winning !== null && s.kind === "outside" && covers(s.bet, winning);
        const covered = hoverBet && n !== null && hoverBet.type !== "plein" && covers(hoverBet, n);
        const color = n !== null ? colorOf(n) : null;
        return (
          <button
            key={s.key}
            style={horizontal ? s.h : s.v}
            disabled={disabled}
            onPointerDown={() => start(s.key)}
            onPointerUp={() => end(s.key)}
            onPointerLeave={() => {
              if (press.current?.key === s.key) {
                clearTimeout(press.current.timer);
                press.current = null;
              }
              setHover((h) => (h === s.key ? null : h));
            }}
            onPointerEnter={() => setHover(s.key)}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemove(s.key);
            }}
            className={`board-spot relative flex items-center justify-center ${s.kind === "number" ? "is-number" : "is-outside"} ${
              isWinningNumber || isWinningBet ? "is-winning" : ""
            } ${covered ? "is-covered" : ""} ${horizontal && n !== null && n > 0 ? "" : ""}`}
          >
            {n !== null ? (
              <span className="number-pill" style={{ background: NUMBER_BG[color!] }}>
                {s.label}
              </span>
            ) : (
              <span className={`board-label ${s.bet.type === "douzaine" && !horizontal ? "is-vertical-text" : ""}`}>{s.label}</span>
            )}
            {stake > 0 && (
              <span className="board-chip chip-drop">
                <Chip value={chipsFor(stake)[0] ?? 10} size={24} />
                <span className="board-chip-amount">{stake >= 1000 ? `${Math.round(stake / 100) / 10}K` : stake}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
