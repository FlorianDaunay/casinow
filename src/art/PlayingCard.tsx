import { useId, type ReactNode } from "react";
import type { Rank, Suit } from "@/core/cards/playing";

export type { Rank, Suit };


const RED = "#9A1C25";
const BLACK = "#16130F";

/** Suit shapes in a ±10 box. */
const SUIT_PATH: Record<Suit, string> = {
  pique: "M0 -10C3 -5 10 -2 10 3C10 7 6 9 2 6C2.4 8 3.8 9.6 5.4 10H-5.4C-3.8 9.6 -2.4 8 -2 6C-6 9 -10 7 -10 3C-10 -2 -3 -5 0 -10Z",
  coeur: "M0 9.5C-3 6.5 -10 1.5 -10 -4C-10 -8 -6.8 -10 -4 -10C-2 -10 -0.6 -8.8 0 -7C0.6 -8.8 2 -10 4 -10C6.8 -10 10 -8 10 -4C10 1.5 3 6.5 0 9.5Z",
  carreau: "M0 -10.5L7.6 0L0 10.5L-7.6 0Z",
  trefle:
    "M0 -10.5A4.7 4.7 0 0 1 3.4 -2.6A4.7 4.7 0 1 1 1.6 5.2C1.9 7.4 3.4 9.4 5.2 10H-5.2C-3.4 9.4 -1.9 7.4 -1.6 5.2A4.7 4.7 0 1 1 -3.4 -2.6A4.7 4.7 0 0 1 0 -10.5Z",
};

export const suitColor = (suit: Suit) => (suit === "coeur" || suit === "carreau" ? RED : BLACK);

export function SuitMark({ suit, x = 0, y = 0, size = 1, flip = false, fill }: { suit: Suit; x?: number; y?: number; size?: number; flip?: boolean; fill?: string }) {
  return <path d={SUIT_PATH[suit]} transform={`translate(${x} ${y}) scale(${size}) rotate(${flip ? 180 : 0})`} fill={fill ?? suitColor(suit)} />;
}

/** Pip positions for number cards (card is 250×350). */
const C = [82, 125, 168];
const PIPS: Record<string, [number, number][]> = {
  "2": [[125, 92], [125, 258]],
  "3": [[125, 92], [125, 175], [125, 258]],
  "4": [[C[0], 92], [C[2], 92], [C[0], 258], [C[2], 258]],
  "5": [[C[0], 92], [C[2], 92], [125, 175], [C[0], 258], [C[2], 258]],
  "6": [[C[0], 92], [C[2], 92], [C[0], 175], [C[2], 175], [C[0], 258], [C[2], 258]],
  "7": [[C[0], 92], [C[2], 92], [125, 133], [C[0], 175], [C[2], 175], [C[0], 258], [C[2], 258]],
  "8": [[C[0], 92], [C[2], 92], [125, 133], [C[0], 175], [C[2], 175], [125, 217], [C[0], 258], [C[2], 258]],
  "9": [[C[0], 92], [C[2], 92], [C[0], 147], [C[2], 147], [125, 175], [C[0], 203], [C[2], 203], [C[0], 258], [C[2], 258]],
  "10": [[C[0], 92], [C[2], 92], [125, 120], [C[0], 147], [C[2], 147], [C[0], 203], [C[2], 203], [125, 230], [C[0], 258], [C[2], 258]],
};

const COURT_TITLE: Record<string, string> = { V: "VALET", D: "DAME", R: "ROI" };

/** A playing card from the house deck: ivory stock, Bodoni indices, Art Deco court cards. */
export function PlayingCard({ rank, suit }: { rank: Rank; suit: Suit }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const color = suitColor(suit);
  const court = rank === "V" || rank === "D" || rank === "R";

  let center: ReactNode;
  if (rank === "A") {
    center = (
      <g>
        <g transform="translate(125 175)" fill="none" stroke={color} opacity={0.5}>
          {Array.from({ length: 32 }, (_, i) => (
            <line key={i} x1={0} y1={-46} x2={0} y2={i % 2 ? -58 : -66} strokeWidth={0.7} transform={`rotate(${i * 11.25})`} />
          ))}
          <circle r={42} strokeWidth={0.6} />
          <circle r={70} strokeWidth={0.4} strokeDasharray="1 3" />
        </g>
        <SuitMark suit={suit} x={125} y={175} size={3.3} />
      </g>
    );
  } else if (court) {
    center = <CourtPanel rank={rank} suit={suit} color={color} gradient={`url(#${id("court")})`} />;
  } else {
    center = PIPS[rank].map(([x, y], i) => <SuitMark key={i} suit={suit} x={x} y={y} size={2.05} flip={y > 175} />);
  }

  return (
    <svg viewBox="0 0 250 350" className="block h-full w-full">
      <defs>
        <linearGradient id={id("stock")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBF7EE" />
          <stop offset="100%" stopColor="#ECE3CF" />
        </linearGradient>
        <linearGradient id={id("court")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.1} />
          <stop offset="50%" stopColor={color} stopOpacity={0.02} />
          <stop offset="100%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <rect width={250} height={350} rx={16} fill={`url(#${id("stock")})`} />
      <rect x={8} y={8} width={234} height={334} rx={10} fill="none" stroke="#B89550" strokeWidth={0.8} opacity={0.7} />
      {center}
      {[false, true].map((flip) => (
        <g key={String(flip)} transform={flip ? "rotate(180 125 175)" : undefined}>
          <text
            x={30}
            y={rank === "10" ? 50 : 52}
            textAnchor="middle"
            fontFamily='"Bodoni Moda", serif'
            fontWeight={600}
            fontSize={rank === "10" ? 30 : 36}
            letterSpacing={rank === "10" ? -2 : 0}
            fill={color}
          >
            {rank}
          </text>
          <SuitMark suit={suit} x={30} y={70} size={1.25} />
        </g>
      ))}
    </svg>
  );
}

function CourtPanel({ rank, suit, color, gradient }: { rank: "V" | "D" | "R"; suit: Suit; color: string; gradient: string }) {
  const half = (
    <g>
      {/* Sunburst behind the letter */}
      <g transform="translate(125 175)" opacity={0.45}>
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI + (i / 12) * Math.PI;
          return <line key={i} x1={Math.cos(a) * 18} y1={Math.sin(a) * 18} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} stroke={color} strokeWidth={i % 2 ? 0.5 : 1} />;
        })}
      </g>
      <text x={125} y={150} textAnchor="middle" fontFamily='"Bodoni Moda", serif' fontSize={78} fontWeight={400} fill={color}>
        {rank}
      </text>
      <text x={125} y={83} textAnchor="middle" fontFamily='"Josefin Sans", sans-serif' fontSize={8} letterSpacing={3.5} fill={color} opacity={0.8}>
        {COURT_TITLE[rank]}
      </text>
      {rank === "R" && <path d="M108 100L112 90L118 96L125 86L132 96L138 90L142 100Z" fill="#B89550" />}
      {rank === "D" && <circle cx={125} cy={94} r={4.5} fill="none" stroke="#B89550" strokeWidth={1.4} />}
      {rank === "V" && <path d="M119 94H131M125 88V100" stroke="#B89550" strokeWidth={1.4} />}
    </g>
  );
  return (
    <g>
      <rect x={52} y={66} width={146} height={218} fill={gradient} stroke="#B89550" strokeWidth={1} />
      <rect x={56} y={70} width={138} height={210} fill="none" stroke={color} strokeWidth={0.4} opacity={0.5} />
      <clipPath id={`court-${rank}-${suit}`}>
        <rect x={56} y={70} width={138} height={210} />
      </clipPath>
      <g clipPath={`url(#court-${rank}-${suit})`}>
        {half}
        <g transform="rotate(180 125 175)">{half}</g>
      </g>
      {/* Center band */}
      <path d="M52 175H198" stroke="#B89550" strokeWidth={0.8} />
      <path d="M125 163L137 175L125 187L113 175Z" fill="#FBF7EE" stroke="#B89550" strokeWidth={1} />
      <SuitMark suit={suit} x={125} y={175} size={0.75} />
    </g>
  );
}
