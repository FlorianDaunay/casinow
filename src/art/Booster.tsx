import { useId, useMemo } from "react";
import { guillocheBand } from "./guilloche";

export type BoosterTier = "salon" | "prestige" | "arcane";

interface TierLook {
  name: string;
  cards: string;
  /** Foil body gradient. */
  foil: string[];
  /** Metal of the ornaments and lettering. */
  metal: string[];
  ink: string;
}

const TIERS: Record<BoosterTier, TierLook> = {
  salon: {
    name: "LE SALON",
    cards: "5 CARTES · 1 RARE GARANTIE",
    foil: ["#1A1712", "#2C271E", "#0E0C09", "#262118", "#0B0907"],
    metal: ["#F6EEDC", "#CFC2A3", "#8F8269", "#E4DAC3"],
    ink: "#1A160F",
  },
  prestige: {
    name: "PRESTIGE",
    cards: "5 CARTES · 1 ÉPIQUE GARANTIE",
    foil: ["#0C0906", "#2A1E0C", "#080604", "#21180A", "#060403"],
    metal: ["#FFF2C2", "#E6BD62", "#9A6C22", "#F4D488"],
    ink: "#1B1205",
  },
  arcane: {
    name: "ARCANES",
    cards: "5 CARTES · 1 LÉGENDAIRE GARANTIE",
    foil: ["#0D0A1A", "#1F1636", "#07050F", "#2A1A3A", "#06040C"],
    metal: ["#FFE6DA", "#E3A994", "#9A5E4C", "#F4C5B2"],
    ink: "#150E1F",
  },
};

/** Crimped edge of a foil pack (the zig-zag seal), as a path segment from x0 to x1 at y. */
function crimp(x0: number, x1: number, y: number, depth: number, teeth: number, dir: 1 | -1): string {
  const step = (x1 - x0) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = x0 + i * step;
    d += `L${a + step / 2} ${y - dir * depth}L${a + step} ${y}`;
  }
  return d;
}

/** A sealed booster pack in brushed foil, ready to be torn open. */
export function Booster({ tier = "prestige" }: { tier?: BoosterTier }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const t = TIERS[tier];
  const rings = useMemo(() => guillocheBand(40, 62, 20, 6, 0.9), []);
  const W = 240;
  const H = 380;
  const body = `M0 8${crimp(0, W, 8, 6, 24, 1)}V${H - 8}${crimp(W, 0, H - 8, 6, 24, -1)}Z`;

  return (
    <svg viewBox={`0 -2 ${W} ${H + 4}`} className="block h-full w-full overflow-visible">
      <defs>
        <linearGradient id={id("foil")} x1="0" y1="0" x2="1" y2="0.35">
          {t.foil.map((c, i) => (
            <stop key={i} offset={`${(i / (t.foil.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={id("metal")} x1="0" y1="0" x2="1" y2="1">
          {t.metal.map((c, i) => (
            <stop key={i} offset={`${(i / (t.metal.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={id("crinkle")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.14} />
          <stop offset="8%" stopColor="#fff" stopOpacity={0} />
          <stop offset="92%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0.12} />
        </linearGradient>
        <pattern id={id("seal")} width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeOpacity="0.45" strokeWidth="1.4" />
        </pattern>
        <clipPath id={id("clip")}>
          <path d={body} />
        </clipPath>
      </defs>

      <path d={body} fill={`url(#${id("foil")})`} />
      <g clipPath={`url(#${id("clip")})`}>
        {/* Crimped seals */}
        <rect x={0} y={0} width={W} height={26} fill={`url(#${id("metal")})`} opacity={0.9} />
        <rect x={0} y={0} width={W} height={26} fill={`url(#${id("seal")})`} />
        <rect x={0} y={H - 26} width={W} height={26} fill={`url(#${id("metal")})`} opacity={0.9} />
        <rect x={0} y={H - 26} width={W} height={26} fill={`url(#${id("seal")})`} />
        <rect width={W} height={H} fill={`url(#${id("crinkle")})`} />
        {/* Moving light on the foil */}
        <rect className="booster-sheen" x={-120} y={-40} width={70} height={H + 80} fill="#fff" opacity={0.07} transform="skewX(-18)" />
        {/* Vertical foil folds */}
        {[18, 222].map((x) => (
          <rect key={x} x={x - 6} y={26} width={12} height={H - 52} fill="#fff" opacity={0.04} />
        ))}
        {/* Sunburst */}
        <g opacity={0.22}>
          {Array.from({ length: 60 }, (_, i) => (
            <line key={i} x1={120} y1={176} x2={120} y2={-120} stroke={`url(#${id("metal")})`} strokeWidth={i % 2 ? 0.4 : 1.2} transform={`rotate(${i * 6} 120 176)`} />
          ))}
        </g>
      </g>

      {/* Tear notch */}
      <path d="M0 34L7 38L0 42" fill="#000" opacity={0.5} />
      <line x1={10} y1={38} x2={W - 10} y2={38} stroke={`url(#${id("metal")})`} strokeWidth={0.5} strokeDasharray="3 3" opacity={0.6} />

      {/* Title block */}
      <g textAnchor="middle" fill={`url(#${id("metal")})`}>
        <text x={120} y={66} fontFamily='"Josefin Sans", sans-serif' fontSize={8} letterSpacing={4}>
          CASINOW · SÉRIE I
        </text>
        <path d="M60 74H180" stroke={`url(#${id("metal")})`} strokeWidth={0.5} />
        <path d="M120 70L124 74L120 78L116 74Z" />
      </g>

      {/* Medallion */}
      <g transform="translate(120 176)">
        <circle r={70} fill="#050403" fillOpacity={0.6} stroke={`url(#${id("metal")})`} strokeWidth={1.4} />
        <g fill="none" stroke={`url(#${id("metal")})`} strokeWidth={0.35}>
          {rings.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <circle r={36} fill="#050403" stroke={`url(#${id("metal")})`} strokeWidth={1.2} />
        {Array.from({ length: 4 }, (_, i) => (
          <path
            key={i}
            d="M0 -30L5 -8L0 -2L-5 -8Z"
            transform={`rotate(${i * 90})`}
            fill={`url(#${id("metal")})`}
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <path key={i} d="M0 -20L3 -8L0 -4L-3 -8Z" transform={`rotate(${45 + i * 90})`} fill={`url(#${id("metal")})`} opacity={0.75} />
        ))}
        <circle r={3} fill={`url(#${id("metal")})`} />
      </g>

      {/* Name plaque */}
      <g>
        <path d="M30 284L42 270H198L210 284L198 298H42Z" fill={`url(#${id("metal")})`} />
        <path d="M36 284L45 275H195L204 284L195 293H45Z" fill="none" stroke={t.ink} strokeOpacity={0.45} strokeWidth={0.5} />
        <text x={120} y={288.5} textAnchor="middle" fontFamily='"Bodoni Moda", serif' fontWeight={600} fontSize={13} letterSpacing={3} fill={t.ink}>
          {t.name}
        </text>
        <text x={120} y={318} textAnchor="middle" fontFamily='"Josefin Sans", sans-serif' fontSize={7} letterSpacing={2.4} fill={`url(#${id("metal")})`}>
          {t.cards}
        </text>
      </g>
    </svg>
  );
}
