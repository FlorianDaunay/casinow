import { useId } from "react";

export const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];

/** Clay colors of each denomination: base, edge inserts, center inlay. */
const CHIP_COLORS: Record<ChipValue, { base: string; insert: string; inlay: string; ink: string }> = {
  10: { base: "#E9E0CC", insert: "#7A1F24", inlay: "#F6F0E2", ink: "#3A2A1A" },
  50: { base: "#8E1E26", insert: "#EFE6D2", inlay: "#F4ECDB", ink: "#5E1218" },
  100: { base: "#14120F", insert: "#D4B26A", inlay: "#F1E8D4", ink: "#14120F" },
  500: { base: "#3D2257", insert: "#EFE6D2", inlay: "#F2EADA", ink: "#2C163F" },
  1000: { base: "#1E4A3B", insert: "#E7C878", inlay: "#F4ECDA", ink: "#133126" },
  5000: { base: "#B98A35", insert: "#14120F", inlay: "#15120D", ink: "#E8C46C" },
};

const format = (v: number) => (v >= 1000 ? `${v / 1000}K` : String(v));

/** A clay casino chip seen from above. */
export function Chip({ value, size = 64 }: { value: ChipValue; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const c = CHIP_COLORS[value];
  return (
    <svg viewBox="-52 -52 104 104" width={size} height={size} className="block">
      <defs>
        <radialGradient id={id("shade")} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.28} />
          <stop offset="60%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="45%" stopColor="#C99A45" />
          <stop offset="100%" stopColor="#F0D28A" />
        </linearGradient>
      </defs>
      <circle r={50} fill={c.base} />
      {/* Edge inserts: three bars each, six times around */}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 60})`}>
          <path d="M-9 -50A50 50 0 0 1 9 -50L7.6 -38A38 38 0 0 0 -7.6 -38Z" fill={c.insert} />
          <path d="M-2.4 -50.2V-38M2.4 -50.2V-38" stroke={c.base} strokeWidth={1.4} />
        </g>
      ))}
      <circle r={38} fill="none" stroke={c.insert} strokeWidth={0.8} strokeDasharray="2 2.6" opacity={0.85} />
      <circle r={33} fill={c.inlay} stroke={`url(#${id("gold")})`} strokeWidth={2} />
      <circle r={29} fill="none" stroke={c.ink} strokeWidth={0.4} opacity={0.5} />
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} d="M0 -31L0.9 -29.4L0 -27.8L-0.9 -29.4Z" transform={`rotate(${i * 15})`} fill={c.ink} opacity={0.55} />
      ))}
      <text
        y={value >= 1000 ? 7.5 : 8}
        textAnchor="middle"
        fontFamily='"Bodoni Moda", serif'
        fontWeight={600}
        fontSize={value >= 1000 ? 21 : value >= 100 ? 21 : 24}
        fill={c.ink}
      >
        {format(value)}
      </text>
      <circle r={50} fill={`url(#${id("shade")})`} />
      <circle r={49.4} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={1.2} />
    </svg>
  );
}
