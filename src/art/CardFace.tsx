import { useId, useMemo } from "react";
import type { CardDef, Finish, Table } from "@/core/cards/types";
import { EmblemArt } from "./emblems";
import { guillocheBand, rosettePath } from "./guilloche";
import { MATERIALS } from "./materials";
import { hashSeed, rng } from "./rng";

export const CARD_W = 250;
export const CARD_H = 350;

const TABLE_LABEL: Record<Table, string> = {
  blackjack: "BLACKJACK",
  roulette: "ROULETTE",
  machines: "MACHINES",
  poker: "POKER",
  tout: "TOUTES TABLES",
};

/** Greedy word wrap for SVG text, which has none. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    if ((current + " " + word).trim().length > max && current) {
      lines.push(current);
      current = word;
    } else current = (current + " " + word).trim();
  }
  if (current) lines.push(current);
  return lines;
}

const stops = (colors: string[]) =>
  colors.map((c, i) => <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={c} />);

/** The printed face of a card, as pure SVG (the foil effects are layered on top by `CollectibleCard`). */
export function CardFace({ card, finish = "standard" }: { card: CardDef; finish?: Finish }) {
  const uid = useId().replace(/:/g, "");
  const m = MATERIALS[card.rarity];
  const id = (name: string) => `${uid}-${name}`;
  const engraved = finish === "gravee";
  const mythic = card.rarity === "mythique";

  // Per-card variation of the guilloché so no two cards share the same engraving.
  const art = useMemo(() => {
    const random = rng(hashSeed(card.id));
    const petals = 14 + Math.floor(random() * 10);
    const band = guillocheBand(58, 86, petals, 9, 0.6 + random());
    const inner = rosettePath({ radius: 54, petals: petals * 2, depth: 0.35, phase: random() });
    const outerPetals = 30 + Math.floor(random() * 12);
    const halo = guillocheBand(96, 104, outerPetals, 3, 0.3);
    return { band, inner, halo };
  }, [card.id]);

  const lineColor = engraved ? `url(#${id("foil")})` : m.line;
  const lineOpacity = engraved ? 0.95 : 0.42;
  const frameFill = `url(#${id("frame")})`;
  const plaqueFill = mythic ? `url(#${id("glyph")})` : frameFill;
  const effectLines = wrap(card.effect, 44);
  const cx = 125;
  const cy = 142;

  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="block h-full w-full" role="img" aria-label={`${card.name}, ${m.label}`}>
      <defs>
        <linearGradient id={id("frame")} x1="0" y1="0" x2="1" y2="1">
          {stops(m.frame)}
        </linearGradient>
        <linearGradient id={id("glyph")} x1="0" y1="0" x2="0.4" y2="1">
          {stops(m.glyph)}
        </linearGradient>
        <linearGradient id={id("foil")} x1="0" y1="0" x2="1" y2="1">
          {stops(["#FFF4C8", "#E3B85A", "#8C6420", "#F7D27A", "#FFF0BC", "#B88A35"])}
        </linearGradient>
        <radialGradient id={id("field")} cx="0.5" cy="0.4" r="0.75">
          <stop offset="0%" stopColor={m.field[0]} />
          <stop offset="100%" stopColor={m.field[1]} />
        </radialGradient>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={m.glow} stopOpacity={0.45} />
          <stop offset="55%" stopColor={m.glow} stopOpacity={0.08} />
          <stop offset="100%" stopColor={m.glow} stopOpacity={0} />
        </radialGradient>
        <pattern id={id("brush")} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <line x1="0" y1="0" x2="3" y2="0" stroke="#fff" strokeWidth="0.35" opacity="0.18" />
          <line x1="0" y1="1.6" x2="3" y2="1.6" stroke="#000" strokeWidth="0.3" opacity="0.12" />
        </pattern>
        <clipPath id={id("window")}>
          <path d={WINDOW} />
        </clipPath>
        <clipPath id={id("fieldclip")}>
          <rect x={11} y={11} width={228} height={328} rx={7} />
        </clipPath>
      </defs>

      {/* Metal frame */}
      <rect width={CARD_W} height={CARD_H} rx={14} fill={frameFill} />
      <rect width={CARD_W} height={CARD_H} rx={14} fill={`url(#${id("brush")})`} />
      <rect x={4.5} y={4.5} width={241} height={341} rx={10} fill="none" stroke={m.ink} strokeOpacity={mythic ? 0.25 : 0.35} strokeWidth={0.6} />

      {/* Field */}
      <rect x={11} y={11} width={228} height={328} rx={7} fill={`url(#${id("field")})`} />
      <g clipPath={`url(#${id("fieldclip")})`}>
        {/* Sunburst behind everything */}
        <g opacity={0.16}>
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1={cx} y1={cy} x2={cx} y2={cy - 260} stroke={m.line} strokeWidth={i % 3 === 0 ? 0.7 : 0.3} transform={`rotate(${i * 5} ${cx} ${cy})`} />
          ))}
        </g>
        <rect x={11} y={240} width={228} height={100} fill={m.field[1]} opacity={0.75} />
      </g>

      {/* Art window: stepped Art Deco arch */}
      <g clipPath={`url(#${id("window")})`}>
        <circle cx={cx} cy={cy} r={120} fill={`url(#${id("glow")})`} />
        <g transform={`translate(${cx} ${cy})`} fill="none" stroke={lineColor} strokeWidth={engraved ? 0.42 : 0.32} opacity={lineOpacity}>
          {art.halo.map((d, i) => (
            <path key={`h${i}`} d={d} />
          ))}
          {art.band.map((d, i) => (
            <path key={`b${i}`} d={d} />
          ))}
          <path d={art.inner} opacity={0.6} />
        </g>
      </g>
      <path d={WINDOW} fill="none" stroke={frameFill} strokeWidth={2.2} />
      <path d={WINDOW_INNER} fill="none" stroke={frameFill} strokeWidth={0.6} opacity={0.8} />

      {/* Emblem */}
      <g transform={`translate(${cx} ${cy}) scale(1.22)`}>
        <EmblemArt emblem={card.emblem} metal={`url(#${id("glyph")})`} ink={m.field[1]} line={engraved ? `url(#${id("foil")})` : m.line} />
      </g>

      {/* Corner fans */}
      {[
        [11, 11, 0],
        [239, 11, 90],
        [239, 339, 180],
        [11, 339, 270],
      ].map(([x, y, r]) => (
        <g key={r} transform={`translate(${x} ${y}) rotate(${r})`} fill="none" stroke={frameFill}>
          <path d="M0 22A22 22 0 0 0 22 0" strokeWidth={1.2} />
          <path d="M0 16A16 16 0 0 0 16 0" strokeWidth={0.6} />
          <path d="M0 10A10 10 0 0 0 10 0" strokeWidth={0.6} />
          {[15, 30, 45, 60, 75].map((a) => (
            <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 22} y2={Math.sin((a * Math.PI) / 180) * 22} strokeWidth={0.4} />
          ))}
        </g>
      ))}

      {/* Number and table medallions */}
      <g fontFamily='"Josefin Sans", sans-serif' textAnchor="middle">
        <text x={36} y={50} fontSize={6} letterSpacing={1.2} fill={m.line} opacity={0.8}>
          N°
        </text>
        <text x={36} y={64} fontFamily='"Bodoni Moda", serif' fontSize={14} fontWeight={600} fill={`url(#${id("glyph")})`}>
          {String(card.number).padStart(2, "0")}
        </text>
        <text x={214} y={50} fontSize={6} letterSpacing={1.2} fill={m.line} opacity={0.8}>
          SÉRIE
        </text>
        <text x={214} y={64} fontFamily='"Bodoni Moda", serif' fontSize={14} fontWeight={600} fill={`url(#${id("glyph")})`}>
          I
        </text>
      </g>

      {/* Name plaque */}
      <path d="M18 259L30 246H220L232 259L220 272H30Z" fill={plaqueFill} />
      <path d="M18 259L30 246H220L232 259L220 272H30Z" fill={`url(#${id("brush")})`} />
      <path d="M24 259L33 250H217L226 259L217 268H33Z" fill="none" stroke={mythic ? m.field[1] : m.ink} strokeOpacity={0.45} strokeWidth={0.5} />
      <text
        x={125}
        y={263.2}
        textAnchor="middle"
        fontFamily='"Bodoni Moda", serif'
        fontSize={card.name.length > 16 ? 11 : 12.5}
        fontWeight={600}
        letterSpacing={1.6}
        fill={mythic ? m.field[1] : m.ink}
      >
        {card.name.toUpperCase()}
      </text>

      {/* Family and table */}
      <text x={125} y={287} textAnchor="middle" fontFamily='"Josefin Sans", sans-serif' fontSize={6.2} letterSpacing={2.2} fill={m.line} opacity={0.9}>
        {card.family.toUpperCase()}  ·  {TABLE_LABEL[card.table]}
      </text>
      <path d="M70 293H180" stroke={m.line} strokeWidth={0.4} opacity={0.4} />

      {/* Effect */}
      <text textAnchor="middle" fontFamily='"Cormorant Garamond", serif' fontStyle="italic" fontSize={10.2} fill="#EFE6D3" opacity={0.92}>
        {effectLines.map((line, i) => (
          <tspan key={i} x={125} y={306 + i * 11.5 - (effectLines.length - 2) * 4}>
            {line}
          </tspan>
        ))}
      </text>

      {/* Rarity pips */}
      <g transform="translate(125 332)">
        {Array.from({ length: m.pips }, (_, i) => {
          const x = (i - (m.pips - 1) / 2) * 9;
          return <path key={i} d="M0 -3.2L3.2 0L0 3.2L-3.2 0Z" transform={`translate(${x} 0)`} fill={`url(#${id("glyph")})`} />;
        })}
        <path d={`M${-((m.pips - 1) / 2) * 9 - 10} 0H-80M${((m.pips - 1) / 2) * 9 + 10} 0H80`} stroke={m.line} strokeWidth={0.4} opacity={0.5} />
      </g>
    </svg>
  );
}

/** Stepped Art Deco arch framing the emblem. */
const WINDOW = "M24 236V84L34 74H44L54 64H64L80 48H100L125 28L150 48H170L186 64H196L206 74H216L226 84V236Z";
const WINDOW_INNER = "M28 232V86L36 78H46L56 68H66L82 52H101L125 33L149 52H168L184 68H194L204 78H214L222 86V232Z";
