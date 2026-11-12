import type { ReactNode } from "react";
import type { Emblem } from "@/core/cards/types";

/**
 * Emblems drawn from geometric primitives only, centered on 0,0 within roughly ±48.
 * `metal` fills the solid parts, `ink` draws the engraved details on top of them, and
 * `line` the fine strokes around them (rays, stars).
 */
export interface EmblemPaint {
  metal: string;
  ink: string;
  line: string;
}

const ray = (angle: number, inner: number, outer: number, half: number) => {
  const a = (angle * Math.PI) / 180;
  const p = (r: number, da: number) => `${(Math.cos(a + da) * r).toFixed(2)} ${(Math.sin(a + da) * r).toFixed(2)}`;
  const w = half / inner;
  return `M${p(inner, -w)}L${p(outer, 0)}L${p(inner, w)}Z`;
};

const star = (points: number, outer: number, inner: number, rotate = -90) => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rotate + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

function Soleil({ metal, ink, line }: EmblemPaint) {
  const rays: ReactNode[] = [];
  for (let i = 0; i < 24; i++) {
    const long = i % 2 === 0;
    rays.push(<path key={i} d={ray(i * 15 - 90, 21, long ? 47 : 34, long ? 4.2 : 3)} fill={metal} stroke={ink} strokeWidth={0.6} />);
  }
  return (
    <g>
      {Array.from({ length: 48 }, (_, i) => (
        <line key={i} x1={0} y1={-24} x2={0} y2={-44} stroke={line} strokeWidth={0.35} opacity={0.6} transform={`rotate(${i * 7.5 + 3.75})`} />
      ))}
      {rays}
      <circle r={19} fill={metal} stroke={ink} strokeWidth={0.8} />
      <circle r={15.5} fill="none" stroke={ink} strokeWidth={0.5} />
      <circle r={12} fill="none" stroke={ink} strokeWidth={0.4} strokeDasharray="1 1.4" />
      <path d={star(8, 9, 3.6, -90)} fill={ink} opacity={0.85} />
      <circle r={2} fill={metal} />
    </g>
  );
}

function Lune({ metal, ink, line }: EmblemPaint) {
  return (
    <g>
      <defs>
        <mask id="lune-mask">
          <circle r={34} fill="#fff" />
          <circle cx={15} cy={-9} r={30} fill="#000" />
        </mask>
      </defs>
      <circle r={44} fill="none" stroke={line} strokeWidth={0.5} opacity={0.7} />
      <circle r={41} fill="none" stroke={line} strokeWidth={0.3} strokeDasharray="0.8 2.2" opacity={0.7} />
      <g mask="url(#lune-mask)">
        <circle r={34} fill={metal} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M-34 ${-30 + i * 8}Q0 ${-24 + i * 8} 34 ${-30 + i * 8}`} fill="none" stroke={ink} strokeWidth={0.4} opacity={0.55} />
        ))}
        <circle r={33.4} fill="none" stroke={ink} strokeWidth={0.8} />
      </g>
      <circle cx={15} cy={-9} r={30} fill="none" stroke={ink} strokeWidth={0.6} strokeDasharray="0.5 1.6" opacity={0.0} />
      <path d={star(4, 7, 1.6, 0)} transform="translate(20 -14)" fill={metal} stroke={ink} strokeWidth={0.4} />
      <path d={star(4, 4.2, 1, 0)} transform="translate(30 6)" fill={metal} />
      <path d={star(4, 3, 0.8, 0)} transform="translate(8 2)" fill={metal} />
      <path d={star(4, 2.4, 0.6, 0)} transform="translate(26 -30)" fill={metal} />
    </g>
  );
}

function Oeil({ metal, ink, line }: EmblemPaint) {
  const almond = "M-44 0C-26 -26 26 -26 44 0C26 26 -26 26 -44 0Z";
  return (
    <g>
      {Array.from({ length: 17 }, (_, i) => {
        const a = -170 + i * 10;
        return <path key={i} d={ray(a, 30, i % 2 ? 40 : 48, i % 2 ? 1.6 : 2.4)} fill={metal} opacity={0.9} />;
      })}
      <path d={almond} fill={ink} stroke={metal} strokeWidth={2.2} />
      <path d="M-38 0C-22 -20 22 -20 38 0C22 20 -22 20 -38 0Z" fill="none" stroke={metal} strokeWidth={0.5} opacity={0.6} />
      <circle r={15} fill={metal} />
      {Array.from({ length: 36 }, (_, i) => (
        <line key={i} x1={0} y1={7.5} x2={0} y2={14.2} stroke={ink} strokeWidth={0.45} transform={`rotate(${i * 10})`} />
      ))}
      <circle r={7} fill={ink} />
      <circle cx={-2.6} cy={-2.6} r={2} fill={metal} />
      <path d="M-14 26L0 40L14 26" fill="none" stroke={line} strokeWidth={0.6} opacity={0.8} />
    </g>
  );
}

function Cle({ metal, ink }: EmblemPaint) {
  return (
    <g transform="rotate(-45)">
      <circle cy={-30} r={15} fill={metal} stroke={ink} strokeWidth={0.8} />
      <circle cy={-30} r={9} fill={ink} />
      <path d={star(4, 7.5, 2.4, -90)} transform="translate(0 -30)" fill={metal} />
      <path d="M-3.4 -15H3.4V40H-3.4Z" fill={metal} stroke={ink} strokeWidth={0.7} />
      <path d="M-7 -14H7V-10H-7Z M-6 -6H6V-3H-6Z" fill={metal} stroke={ink} strokeWidth={0.6} />
      <path d="M3.4 22H15V27H9V31H15V38H3.4Z" fill={metal} stroke={ink} strokeWidth={0.7} />
      <line x1={0} y1={-12} x2={0} y2={36} stroke={ink} strokeWidth={0.5} />
      <circle cy={-30} r={18.5} fill="none" stroke={metal} strokeWidth={0.5} strokeDasharray="1 2" />
    </g>
  );
}

function Couronne({ metal, ink, line }: EmblemPaint) {
  const crown = "M-34 18L-40 -16L-20 2L-10 -26L0 -4L10 -26L20 2L40 -16L34 18Z";
  return (
    <g transform="translate(0 4)">
      <path d={crown} fill={metal} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" />
      <path d="M-30 10L30 10" stroke={ink} strokeWidth={0.6} />
      <rect x={-36} y={18} width={72} height={10} fill={metal} stroke={ink} strokeWidth={0.9} />
      <path d="M-36 23H36" stroke={ink} strokeWidth={0.4} strokeDasharray="1.2 1.2" />
      {[-40, -10, 10, 40].map((x, i) => (
        <circle key={i} cx={x} cy={x === -40 || x === 40 ? -16 : -26} r={3.6} fill={metal} stroke={ink} strokeWidth={0.7} />
      ))}
      <path d={star(4, 6, 2, -90)} transform="translate(0 -36)" fill={metal} stroke={ink} strokeWidth={0.5} />
      {[-22, 0, 22].map((x) => (
        <path key={x} d="M0 -4L4 0L0 4L-4 0Z" transform={`translate(${x} 23)`} fill={ink} />
      ))}
      <path d="M-46 36H46" stroke={line} strokeWidth={0.5} opacity={0.8} />
    </g>
  );
}

function Pique({ metal, ink, line }: EmblemPaint) {
  const spade =
    "M0 -42C10 -26 34 -14 34 6C34 20 20 26 8 18C10 26 14 32 20 36H-20C-14 32 -10 26 -8 18C-20 26 -34 20 -34 6C-34 -14 -10 -26 0 -42Z";
  return (
    <g>
      <path d={spade} fill={metal} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" />
      <path d="M0 -32C8 -20 26 -10 26 5C26 14 18 18 10 13" fill="none" stroke={ink} strokeWidth={0.5} opacity={0.7} />
      <path d="M0 -32C-8 -20 -26 -10 -26 5C-26 14 -18 18 -10 13" fill="none" stroke={ink} strokeWidth={0.5} opacity={0.7} />
      <path d="M0 -24L5 -6L0 6L-5 -6Z" fill={ink} opacity={0.9} />
      <path d="M-46 0H-40M40 0H46M0 42V46" stroke={line} strokeWidth={0.6} />
    </g>
  );
}

function De({ metal, ink }: EmblemPaint) {
  const top = "M0 -38L33 -19L0 0L-33 -19Z";
  const left = "M-33 -19L0 0V38L-33 19Z";
  const right = "M33 -19L0 0V38L33 19Z";
  // Each face is mapped to a unit square, so pips are laid out in face coordinates (±0.5).
  const face = (matrix: string, pips: [number, number][], key: string) => (
    <g key={key} transform={`matrix(${matrix})`}>
      {pips.map(([s, t], i) => (
        <circle key={i} cx={s} cy={t} r={0.1} fill={ink} />
      ))}
    </g>
  );
  return (
    <g>
      <path d={top} fill={metal} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" />
      <path d={left} fill={metal} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" opacity={0.8} />
      <path d={right} fill={metal} stroke={ink} strokeWidth={0.9} strokeLinejoin="round" opacity={0.62} />
      {face("33 19 33 -19 0 -19", [[0, 0]], "top")}
      {face("33 19 0 38 -16.5 9.5", [[-0.25, -0.28], [-0.25, 0], [-0.25, 0.28], [0.25, -0.28], [0.25, 0], [0.25, 0.28]], "left")}
      {face("33 -19 0 38 16.5 9.5", [[-0.27, -0.27], [0, 0], [0.27, 0.27]], "right")}
    </g>
  );
}

function Sablier({ metal, ink, line }: EmblemPaint) {
  return (
    <g>
      <rect x={-28} y={-42} width={56} height={7} fill={metal} stroke={ink} strokeWidth={0.8} />
      <rect x={-28} y={35} width={56} height={7} fill={metal} stroke={ink} strokeWidth={0.8} />
      <path d="M-22 -35C-22 -10 -4 -6 -4 0C-4 6 -22 10 -22 35H22C22 10 4 6 4 0C4 -6 22 -10 22 -35Z" fill="none" stroke={metal} strokeWidth={2} />
      <path d="M-14 -20C-10 -10 -3 -6 0 -3C3 -6 10 -10 14 -20Z" fill={metal} opacity={0.85} />
      <path d="M-18 35C-14 22 -4 18 0 16C4 18 14 22 18 35Z" fill={metal} />
      <line x1={0} y1={-3} x2={0} y2={16} stroke={metal} strokeWidth={0.8} strokeDasharray="1 1.5" />
      <path d="M-26 -35V35M26 -35V35" stroke={metal} strokeWidth={1.8} />
      <path d="M-34 -46H34M-34 46H34" stroke={line} strokeWidth={0.5} />
    </g>
  );
}

function Coupe({ metal, ink }: EmblemPaint) {
  return (
    <g>
      <path d="M-30 -36H30C30 -8 16 6 0 8C-16 6 -30 -8 -30 -36Z" fill={metal} stroke={ink} strokeWidth={0.9} />
      <path d="M-30 -30H30" stroke={ink} strokeWidth={0.6} />
      {[-18, -6, 6, 18].map((x) => (
        <path key={x} d={`M${x} -26L${x * 0.5} 2`} stroke={ink} strokeWidth={0.5} opacity={0.6} />
      ))}
      <rect x={-3} y={8} width={6} height={22} fill={metal} stroke={ink} strokeWidth={0.7} />
      <ellipse cy={18} rx={7} ry={3} fill={metal} stroke={ink} strokeWidth={0.6} />
      <path d="M-22 40C-20 32 -10 30 0 30C10 30 20 32 22 40Z" fill={metal} stroke={ink} strokeWidth={0.8} />
      <path d={star(4, 6, 1.8, -90)} transform="translate(0 -46)" fill={metal} />
      <path d={star(4, 3.4, 1, -90)} transform="translate(-14 -44)" fill={metal} opacity={0.8} />
      <path d={star(4, 3.4, 1, -90)} transform="translate(14 -44)" fill={metal} opacity={0.8} />
    </g>
  );
}

function Etoile({ metal, ink, line }: EmblemPaint) {
  return (
    <g>
      <circle r={40} fill="none" stroke={line} strokeWidth={0.5} />
      <circle r={36} fill="none" stroke={line} strokeWidth={0.3} strokeDasharray="0.6 2" />
      <path d={star(8, 46, 14, -90)} fill={metal} stroke={ink} strokeWidth={0.7} strokeLinejoin="round" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={0} y1={0} x2={0} y2={-44} stroke={ink} strokeWidth={0.5} transform={`rotate(${i * 45})`} />
      ))}
      <path d={star(4, 22, 7, -45)} fill={metal} stroke={ink} strokeWidth={0.6} />
      <circle r={4} fill={ink} />
    </g>
  );
}

export function EmblemArt({ emblem, ...paint }: EmblemPaint & { emblem: Emblem }) {
  switch (emblem) {
    case "soleil":
      return <Soleil {...paint} />;
    case "lune":
      return <Lune {...paint} />;
    case "oeil":
      return <Oeil {...paint} />;
    case "cle":
      return <Cle {...paint} />;
    case "couronne":
      return <Couronne {...paint} />;
    case "pique":
      return <Pique {...paint} />;
    case "de":
      return <De {...paint} />;
    case "sablier":
      return <Sablier {...paint} />;
    case "coupe":
      return <Coupe {...paint} />;
    case "etoile":
      return <Etoile {...paint} />;
  }
}
