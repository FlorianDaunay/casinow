import { useId } from "react";
import type { Sym } from "@/core/slots/engine";
import { EmblemArt } from "./emblems";

const SUIT: Record<"pique" | "coeur" | "carreau" | "trefle", string> = {
  pique: "M0 -10C3 -5 10 -2 10 3C10 7 6 9 2 6C2.4 8 3.8 9.6 5.4 10H-5.4C-3.8 9.6 -2.4 8 -2 6C-6 9 -10 7 -10 3C-10 -2 -3 -5 0 -10Z",
  coeur: "M0 9.5C-3 6.5 -10 1.5 -10 -4C-10 -8 -6.8 -10 -4 -10C-2 -10 -0.6 -8.8 0 -7C0.6 -8.8 2 -10 4 -10C6.8 -10 10 -8 10 -4C10 1.5 3 6.5 0 9.5Z",
  carreau: "M0 -10.5L7.6 0L0 10.5L-7.6 0Z",
  trefle:
    "M0 -10.5A4.7 4.7 0 0 1 3.4 -2.6A4.7 4.7 0 1 1 1.6 5.2C1.9 7.4 3.4 9.4 5.2 10H-5.2C-3.4 9.4 -1.9 7.4 -1.6 5.2A4.7 4.7 0 1 1 -3.4 -2.6A4.7 4.7 0 0 1 0 -10.5Z",
};

/** Metal of each emblem symbol, light to dark. */
const METAL: Partial<Record<Sym, string[]>> = {
  coupe: ["#FFFFFF", "#C4CAD2", "#6F7781"],
  cle: ["#F6DDBF", "#C98B55", "#7A4A22"],
  lune: ["#F2E4FF", "#B98DE0", "#5E3B84"],
  couronne: ["#FFF6D2", "#F0C866", "#9A6A1C"],
  soleil: ["#FFE9DF", "#F2A98C", "#A2533E"],
  joker: ["#FFF6D2", "#F0C866", "#9A6A1C"],
};

/** A reel symbol drawn in a ±50 box. Higher symbols get richer metals. */
export function SlotSymbol({ sym, size }: { sym: Sym; size: number }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${uid}-${n}`;
  let art;

  if (sym === "pique" || sym === "trefle" || sym === "coeur" || sym === "carreau") {
    const red = sym === "coeur" || sym === "carreau";
    art = (
      <g>
        <defs>
          <linearGradient id={id("s")} x1="0" y1="0" x2="0.3" y2="1">
            {red ? (
              <>
                <stop offset="0%" stopColor="#E0545A" />
                <stop offset="100%" stopColor="#7A141C" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#F6F0E2" />
                <stop offset="100%" stopColor="#A89E88" />
              </>
            )}
          </linearGradient>
        </defs>
        <path d={SUIT[sym]} transform="scale(3.1)" fill={`url(#${id("s")})`} stroke="#C9A55A" strokeWidth={0.35} />
        <path d={SUIT[sym]} transform="scale(2.2)" fill="none" stroke="#FFF3D0" strokeOpacity={0.35} strokeWidth={0.3} />
      </g>
    );
  } else if (sym === "sceau") {
    const blob = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const r = i % 2 ? 37 : 41;
      return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
    });
    art = (
      <g>
        <defs>
          <radialGradient id={id("wax")} cx="0.38" cy="0.32" r="0.8">
            <stop offset="0%" stopColor="#D85A4F" />
            <stop offset="55%" stopColor="#8E1F22" />
            <stop offset="100%" stopColor="#4A0B10" />
          </radialGradient>
          <linearGradient id={id("g")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF2C6" />
            <stop offset="50%" stopColor="#E3B85A" />
            <stop offset="100%" stopColor="#966A22" />
          </linearGradient>
        </defs>
        <path d={`M${blob.join("L")}Z`} fill={`url(#${id("wax")})`} stroke="#5A1015" strokeWidth={1.2} />
        <circle r={27} fill="none" stroke="#3E080C" strokeWidth={2.4} opacity={0.6} />
        <circle r={27} fill="none" stroke="#E07A6E" strokeWidth={0.8} opacity={0.5} transform="translate(-1 -1)" />
        <EmblemArt emblem="etoile" metal={`url(#${id("g")})`} ink="#4A0B10" line="#E07A6E" />
      </g>
    );
  } else {
    const m = METAL[sym]!;
    const emblem = sym === "joker" ? "oeil" : sym;
    art = (
      <g>
        <defs>
          <linearGradient id={id("m")} x1="0" y1="0" x2="0.4" y2="1">
            {m.map((c, i) => (
              <stop key={i} offset={`${(i / (m.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
        {sym === "joker" && <circle r={46} fill="#0B0906" stroke={`url(#${id("m")})`} strokeWidth={2} />}
        <g transform={`scale(${sym === "joker" ? 0.78 : 0.92})`}>
          <EmblemArt emblem={emblem as Exclude<Sym, "joker" | "sceau" | "pique" | "coeur" | "carreau" | "trefle"> | "oeil"} metal={`url(#${id("m")})`} ink="#0B0906" line={m[1]} />
        </g>
        {sym === "joker" && (
          <text y={40} textAnchor="middle" fontFamily='"Josefin Sans", sans-serif' fontSize={9} letterSpacing={3} fill={`url(#${id("m")})`}>
            JOKER
          </text>
        )}
      </g>
    );
  }

  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className="block overflow-visible">
      {art}
    </svg>
  );
}
