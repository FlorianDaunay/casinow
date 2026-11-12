import { useId } from "react";

export type Currency = "jetons" | "poussiere" | "sceaux";

export const CURRENCY_LABEL: Record<Currency, string> = {
  jetons: "Jetons",
  poussiere: "Poussière d'or",
  sceaux: "Sceaux",
};

/** Small, crisp currency marks for counters and prices. */
export function CurrencyIcon({ currency, size = 22 }: { currency: Currency; size?: number }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  const gold = (
    <linearGradient id={id("g")} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFF2C6" />
      <stop offset="40%" stopColor="#E3B85A" />
      <stop offset="75%" stopColor="#966A22" />
      <stop offset="100%" stopColor="#EED08A" />
    </linearGradient>
  );

  if (currency === "jetons")
    return (
      <svg viewBox="-12 -12 24 24" width={size} height={size} className="block shrink-0">
        <defs>{gold}</defs>
        <circle r={11} fill={`url(#${id("g")})`} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={-1.3} y={-11} width={2.6} height={3.2} fill="#1A140A" transform={`rotate(${i * 45})`} />
        ))}
        <circle r={6.4} fill="#1A140A" />
        <circle r={5.2} fill="none" stroke={`url(#${id("g")})`} strokeWidth={0.7} />
        <path d="M0 -2.6L2.6 0L0 2.6L-2.6 0Z" fill={`url(#${id("g")})`} />
      </svg>
    );

  if (currency === "poussiere")
    return (
      <svg viewBox="-12 -12 24 24" width={size} height={size} className="block shrink-0">
        <defs>{gold}</defs>
        {/* Three faceted gold flakes */}
        <g transform="translate(-3 1)">
          <path d="M0 -8L5.5 -2L0 8L-5.5 -2Z" fill={`url(#${id("g")})`} />
          <path d="M0 -8L0 8L5.5 -2Z" fill="#000" opacity={0.28} />
          <path d="M-5.5 -2H5.5" stroke="#FFF6D8" strokeWidth={0.5} opacity={0.8} />
        </g>
        <g transform="translate(6 -4) scale(0.6)">
          <path d="M0 -8L5.5 -2L0 8L-5.5 -2Z" fill={`url(#${id("g")})`} />
          <path d="M0 -8L0 8L5.5 -2Z" fill="#000" opacity={0.28} />
        </g>
        <g transform="translate(6.5 6.5) scale(0.42)">
          <path d="M0 -8L5.5 -2L0 8L-5.5 -2Z" fill={`url(#${id("g")})`} />
        </g>
        <circle cx={-9} cy={-8} r={0.8} fill="#F2D58A" />
        <circle cx={2} cy={-10} r={0.6} fill="#F2D58A" />
      </svg>
    );

  // Sceau: oxblood wax seal stamped with the eight-point star of the house.
  const blob = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = i % 2 ? 10.2 : 11.2;
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  });
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} className="block shrink-0">
      <defs>
        {gold}
        <radialGradient id={id("wax")} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0%" stopColor="#D2554B" />
          <stop offset="55%" stopColor="#8E1F22" />
          <stop offset="100%" stopColor="#4A0B10" />
        </radialGradient>
      </defs>
      <path d={`M${blob.join("L")}Z`} fill={`url(#${id("wax")})`} strokeLinejoin="round" stroke="#5A1015" strokeWidth={0.6} />
      <circle r={7.2} fill="none" stroke="#3E080C" strokeWidth={0.9} opacity={0.7} />
      <circle r={7.2} fill="none" stroke="#E07A6E" strokeWidth={0.4} opacity={0.5} transform="translate(-0.4 -0.4)" />
      <path
        d={Array.from({ length: 16 }, (_, i) => {
          const r = i % 2 ? 2.2 : 5.6;
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          return `${i ? "L" : "M"}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
        }).join("") + "Z"}
        fill={`url(#${id("g")})`}
      />
    </svg>
  );
}
