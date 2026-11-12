import { forwardRef, useId, useImperativeHandle, useMemo, useRef } from "react";
import { colorOf, WHEEL_ORDER } from "@/core/roulette/engine";

const POCKETS = WHEEL_ORDER.length;
const STEP = 360 / POCKETS;

/** Radii of the wheel's rings, in a ±100 box. */
export const WHEEL = { rim: 98, track: 89, numbersOut: 80, numbersIn: 64, pocketsIn: 50, pocketBall: 57 } as const;

const POCKET_FILL = { rouge: "#8E1E26", noir: "#14110E", vert: "#1E5A43" } as const;

const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.cos(a) * r, Math.sin(a) * r] as const;
};

function sector(r1: number, r2: number, a1: number, a2: number): string {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

/** Imperative handle: the spin animation moves the wheel and the ball every frame. */
export interface WheelHandle {
  set(wheelDeg: number, ballDeg: number, ballRadius: number, ballVisible: boolean): void;
}

/** A European wheel in lacquer and gold. Pocket i sits at angle i × 360/37 from the top. */
export const RouletteWheel = forwardRef<WheelHandle, { size: number; highlight?: number | null }>(function RouletteWheel({ size, highlight }, ref) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const wheel = useRef<SVGGElement>(null);
  const ball = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    set(wheelDeg, ballDeg, radius, visible) {
      wheel.current?.setAttribute("transform", `rotate(${wheelDeg})`);
      if (ball.current) {
        const [x, y] = polar(radius, ballDeg);
        ball.current.setAttribute("transform", `translate(${x} ${y})`);
        ball.current.style.opacity = visible ? "1" : "0";
      }
    },
  }));

  const pockets = useMemo(
    () =>
      WHEEL_ORDER.map((n, i) => {
        const a = i * STEP;
        return { n, a, color: colorOf(n), band: sector(WHEEL.numbersIn, WHEEL.numbersOut, a - STEP / 2, a + STEP / 2), well: sector(WHEEL.pocketsIn, WHEEL.numbersIn, a - STEP / 2, a + STEP / 2) };
      }),
    []
  );

  return (
    <svg viewBox="-100 -100 200 200" width={size} height={size} className="block">
      <defs>
        <radialGradient id={id("rim")} cx="0.5" cy="0.45" r="0.55">
          <stop offset="80%" stopColor="#2A1D10" />
          <stop offset="93%" stopColor="#120C06" />
          <stop offset="100%" stopColor="#3A2814" />
        </radialGradient>
        <radialGradient id={id("track")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="82%" stopColor="#1A120A" />
          <stop offset="92%" stopColor="#3B2A17" />
          <stop offset="100%" stopColor="#140D07" />
        </radialGradient>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="45%" stopColor="#C99A45" />
          <stop offset="75%" stopColor="#7A5418" />
          <stop offset="100%" stopColor="#F0D28A" />
        </linearGradient>
        <radialGradient id={id("cone")} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0%" stopColor="#4A341C" />
          <stop offset="70%" stopColor="#1E150C" />
          <stop offset="100%" stopColor="#0E0905" />
        </radialGradient>
        <radialGradient id={id("ball")} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E8E1D2" />
          <stop offset="100%" stopColor="#8E8676" />
        </radialGradient>
        <radialGradient id={id("shade")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="70%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.45} />
        </radialGradient>
      </defs>

      {/* Fixed bowl and ball track */}
      <circle r={WHEEL.rim + 2} fill={`url(#${id("gold")})`} />
      <circle r={WHEEL.rim} fill={`url(#${id("rim")})`} />
      <circle r={WHEEL.track + 5} fill={`url(#${id("track")})`} />
      <circle r={WHEEL.numbersOut + 3} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={1.2} />
      {/* Diamond deflectors on the track */}
      {Array.from({ length: 8 }, (_, i) => {
        const [x, y] = polar(WHEEL.track - 1, i * 45 + 22.5);
        return <path key={i} d="M0 -2.6L1.4 0L0 2.6L-1.4 0Z" fill={`url(#${id("gold")})`} transform={`translate(${x} ${y}) rotate(${i * 45 + 22.5})`} />;
      })}

      {/* Rotor */}
      <g ref={wheel}>
        {pockets.map((p) => (
          <g key={p.n}>
            <path d={p.band} fill={POCKET_FILL[p.color]} />
            <path d={p.well} fill={POCKET_FILL[p.color]} opacity={0.55} />
            {highlight === p.n && <path d={p.band} fill="#F6DC93" opacity={0.35} className="pocket-glow" />}
          </g>
        ))}
        <circle r={WHEEL.pocketsIn + 7} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={14} />
        {pockets.map((p) => {
          const [x1, y1] = polar(WHEEL.pocketsIn, p.a - STEP / 2);
          const [x2, y2] = polar(WHEEL.numbersOut, p.a - STEP / 2);
          return <line key={`f${p.n}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id("gold")})`} strokeWidth={0.7} />;
        })}
        {pockets.map((p) => {
          const [x, y] = polar(72.5, p.a);
          return (
            <text
              key={`t${p.n}`}
              x={x}
              y={y}
              transform={`rotate(${p.a} ${x} ${y})`}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily='"Bodoni Moda", serif'
              fontSize={7}
              fill="#F1E7D2"
            >
              {p.n}
            </text>
          );
        })}
        <circle r={WHEEL.numbersIn} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.8} />
        <circle r={WHEEL.numbersOut} fill="none" stroke={`url(#${id("gold")})`} strokeWidth={0.8} />
        <circle r={WHEEL.pocketsIn} fill={`url(#${id("cone")})`} stroke={`url(#${id("gold")})`} strokeWidth={1} />
        {/* Turret: Art Deco cross with fan tips */}
        <g fill={`url(#${id("gold")})`}>
          {[0, 90, 180, 270].map((r) => (
            <g key={r} transform={`rotate(${r})`}>
              <path d="M-1.6 -8L-1 -36L0 -40L1 -36L1.6 -8Z" />
              <circle cy={-40} r={2.8} />
            </g>
          ))}
          {[45, 135, 225, 315].map((r) => (
            <path key={r} d="M-0.8 -6L0 -20L0.8 -6Z" transform={`rotate(${r})`} opacity={0.75} />
          ))}
          <circle r={8} />
        </g>
        <circle r={5} fill="#120C06" />
        <circle r={2.4} fill={`url(#${id("gold")})`} />
      </g>

      <circle r={WHEEL.rim} fill={`url(#${id("shade")})`} pointerEvents="none" />

      {/* Ball */}
      <g ref={ball} style={{ opacity: 0 }}>
        <circle r={3.3} fill="#000" opacity={0.35} transform="translate(0.8 1)" />
        <circle r={3} fill={`url(#${id("ball")})`} />
      </g>
    </svg>
  );
});

export const POCKET_STEP = STEP;
