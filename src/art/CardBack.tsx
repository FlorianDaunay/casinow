import { useId, useMemo } from "react";
import { guillocheBand } from "./guilloche";
import { CARD_H, CARD_W } from "./CardFace";

/** The back shared by every card: black lacquer, gold Art Deco fans and the house monogram. */
export function CardBack({ glow }: { glow?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const band = useMemo(() => guillocheBand(46, 70, 24, 7, 0.8), []);
  const cx = 125;
  const cy = 175;

  return (
    <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="block h-full w-full">
      <defs>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="30%" stopColor="#D9B15A" />
          <stop offset="55%" stopColor="#8E6522" />
          <stop offset="80%" stopColor="#E9C778" />
          <stop offset="100%" stopColor="#9C7330" />
        </linearGradient>
        <radialGradient id={id("lacquer")} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0%" stopColor="#1D1912" />
          <stop offset="100%" stopColor="#050403" />
        </radialGradient>
        <radialGradient id={id("halo")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={glow ?? "#E8C068"} stopOpacity={glow ? 0.75 : 0.25} />
          <stop offset="100%" stopColor={glow ?? "#E8C068"} stopOpacity={0} />
        </radialGradient>
        {/* Scalloped fans, the signature Art Deco tiling. */}
        <pattern id={id("fans")} width="20" height="12" patternUnits="userSpaceOnUse">
          {[0, 20].map((x) => (
            <g key={x} fill="none" stroke="#C9A55A" strokeWidth="0.45">
              <path d={`M${x - 10} 12A10 10 0 0 1 ${x + 10} 12`} />
              <path d={`M${x - 6.5} 12A6.5 6.5 0 0 1 ${x + 6.5} 12`} />
              <path d={`M${x - 3} 12A3 3 0 0 1 ${x + 3} 12`} />
            </g>
          ))}
          <g fill="none" stroke="#C9A55A" strokeWidth="0.45">
            <path d="M0 6A10 10 0 0 1 20 6" />
            <path d="M3.5 6A6.5 6.5 0 0 1 16.5 6" />
            <path d="M7 6A3 3 0 0 1 13 6" />
          </g>
        </pattern>
      </defs>

      <rect width={CARD_W} height={CARD_H} rx={14} fill={`url(#${id("gold")})`} />
      <rect x={7} y={7} width={236} height={336} rx={9} fill={`url(#${id("lacquer")})`} />
      <rect x={14} y={14} width={222} height={322} rx={4} fill={`url(#${id("fans")})`} opacity={0.22} />
      <rect x={14} y={14} width={222} height={322} rx={4} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.9} />
      <rect x={18} y={18} width={214} height={314} rx={2} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.4} />

      {/* Diamond lozenge behind the medallion */}
      <path d={`M${cx} 40L218 ${cy}L${cx} 310L32 ${cy}Z`} fill="#070605" stroke={`url(#${id("gold")})`} strokeWidth={1.2} />
      <path d={`M${cx} 50L208 ${cy}L${cx} 300L42 ${cy}Z`} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.4} />
      {Array.from({ length: 36 }, (_, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 130}
          stroke="#C9A55A"
          strokeWidth={0.35}
          opacity={0.35}
          transform={`rotate(${i * 10} ${cx} ${cy})`}
          clipPath="none"
        />
      ))}
      <circle cx={cx} cy={cy} r={90} fill={`url(#${id("halo")})`} />

      {/* Medallion */}
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={74} fill="#060504" stroke={`url(#${id("gold")})`} strokeWidth={1.4} />
        <g fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.35} opacity={0.85}>
          {band.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <circle r={42} fill="#060504" stroke={`url(#${id("gold")})`} strokeWidth={1.2} />
        <circle r={38} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.4} strokeDasharray="1 2" />
        <text
          y={17}
          textAnchor="middle"
          fontFamily='"Bodoni Moda", serif'
          fontSize={52}
          fontWeight={400}
          fill={`url(#${id("gold")})`}
        >
          C
        </text>
        {/* Arcane eye, discreet, above the monogram */}
        <g transform="translate(0 -56)" fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.8}>
          <path d="M-9 0C-4 -5 4 -5 9 0C4 5 -4 5 -9 0Z" fill="#060504" />
          <circle r={2.4} fill="#C9A55A" stroke="none" />
        </g>
        <path d="M-4 56L0 52L4 56L0 60Z" fill="#C9A55A" />
      </g>

      {/* Corner steps */}
      {[
        [14, 14, 1, 1],
        [236, 14, -1, 1],
        [236, 336, -1, -1],
        [14, 336, 1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${sx} ${sy})`}
          d="M0 28V0H28M6 22V6H22M12 16V12H16"
          fill="none"
          stroke={`url(#${id("gold")})`}
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}
