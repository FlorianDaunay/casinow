import { useId } from "react";

export type GameId = "blackjack" | "roulette" | "machines" | "poker" | "collection" | "boutique";

/** Gold line-art emblems for the salon's doors, drawn in a ±50 box. */
export function GameGlyph({ game, size = 120 }: { game: GameId; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gold = `url(#${uid}-g)`;
  const s = { fill: "none", stroke: gold, strokeWidth: 1.2 } as const;

  let art;
  switch (game) {
    case "blackjack":
      art = (
        <g>
          {[-14, 8].map((r, i) => (
            <g key={i} transform={`rotate(${r}) translate(${i ? 6 : -6} 0)`}>
              <rect x={-22} y={-32} width={44} height={62} rx={4} fill="#0A0907" stroke={gold} strokeWidth={1.3} />
              <rect x={-18} y={-28} width={36} height={54} rx={2} {...s} strokeWidth={0.5} />
            </g>
          ))}
          <text x={-4} y={-14} fontFamily='"Bodoni Moda", serif' fontSize={11} fill={gold} transform="rotate(8)">
            A
          </text>
          <path
            d="M0 -10C3 -5 10 -2 10 3C10 7 6 9 2 6C2.4 8 3.8 9.6 5.4 10H-5.4C-3.8 9.6 -2.4 8 -2 6C-6 9 -10 7 -10 3C-10 -2 -3 -5 0 -10Z"
            transform="rotate(8) translate(6 2) scale(1.2)"
            fill={gold}
          />
        </g>
      );
      break;
    case "roulette":
      art = (
        <g>
          <circle r={40} {...s} strokeWidth={1.6} />
          <circle r={36} {...s} strokeWidth={0.5} />
          {Array.from({ length: 37 }, (_, i) => (
            <line key={i} x1={0} y1={-24} x2={0} y2={-36} stroke={gold} strokeWidth={i === 0 ? 1.6 : 0.5} transform={`rotate(${(i * 360) / 37})`} />
          ))}
          <circle r={24} {...s} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M0 -22L2.2 -6L0 -2L-2.2 -6Z" fill={gold} transform={`rotate(${i * 45})`} opacity={i % 2 ? 0.6 : 1} />
          ))}
          <circle r={4} fill={gold} />
          <circle cx={0} cy={-30} r={2.6} fill="#FFF3D0" />
        </g>
      );
      break;
    case "machines":
      art = (
        <g>
          <rect x={-38} y={-30} width={76} height={56} rx={6} {...s} strokeWidth={1.5} />
          <path d="M-30 -30V-38H30V-30" {...s} />
          {[-22, 0, 22].map((x) => (
            <g key={x}>
              <rect x={x - 9} y={-20} width={18} height={36} rx={2} fill="#0A0907" stroke={gold} strokeWidth={0.8} />
              <text x={x} y={6} textAnchor="middle" fontFamily='"Bodoni Moda", serif' fontSize={20} fill={gold}>
                7
              </text>
            </g>
          ))}
          <path d="M38 -16H44V6" {...s} />
          <circle cx={44} cy={-20} r={4} fill={gold} />
          <path d="M-26 34H26" {...s} />
        </g>
      );
      break;
    case "poker":
      art = (
        <g>
          {[-24, -8, 8, 24].map((r, i) => (
            <rect key={i} x={-16} y={-44} width={32} height={46} rx={3} fill="#0A0907" stroke={gold} strokeWidth={1} transform={`translate(0 20) rotate(${r})`} />
          ))}
          <path d="M0 -10.5L7.6 0L0 10.5L-7.6 0Z" fill={gold} transform="translate(9 -8) rotate(24) scale(0.9)" />
        </g>
      );
      break;
    case "collection":
      art = (
        <g>
          <rect x={-26} y={-38} width={52} height={74} rx={5} fill="#0A0907" stroke={gold} strokeWidth={1.4} />
          <path d="M0 -26L22 0L0 26L-22 0Z" {...s} />
          <circle r={11} {...s} />
          <text y={5.5} textAnchor="middle" fontFamily='"Bodoni Moda", serif' fontSize={15} fill={gold}>
            C
          </text>
        </g>
      );
      break;
    case "boutique":
      art = (
        <g>
          <path d="M-30 -10H30L26 36H-26Z" {...s} strokeWidth={1.5} />
          <path d="M-14 -10V-20A14 14 0 0 1 14 -20V-10" {...s} />
          <path d="M0 4L7 14L0 24L-7 14Z" fill={gold} />
        </g>
      );
      break;
  }

  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className="block overflow-visible">
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="45%" stopColor="#D6AA55" />
          <stop offset="75%" stopColor="#9A6C22" />
          <stop offset="100%" stopColor="#F0D28A" />
        </linearGradient>
      </defs>
      {art}
    </svg>
  );
}
