/** Thin gold rule with a central lozenge, used under titles. */
export function DecoRule({ width = 320, className = "" }: { width?: number; className?: string }) {
  const h = width / 2;
  return (
    <svg viewBox={`0 0 ${width} 14`} width={width} height={14} className={`block max-w-full ${className}`}>
      <defs>
        <linearGradient id="rule-fade" x1="0" x2="1">
          <stop offset="0%" stopColor="#C9A55A" stopOpacity={0} />
          <stop offset="35%" stopColor="#C9A55A" stopOpacity={0.9} />
          <stop offset="65%" stopColor="#C9A55A" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#C9A55A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M0 7H${h - 16}M${h + 16} 7H${width}`} stroke="url(#rule-fade)" strokeWidth={0.8} />
      <path d={`M0 10H${h - 22}M${h + 22} 10H${width}`} stroke="url(#rule-fade)" strokeWidth={0.4} />
      <path d={`M${h} 1L${h + 6} 7L${h} 13L${h - 6} 7Z`} fill="none" stroke="#C9A55A" strokeWidth={0.8} />
      <path d={`M${h} 4L${h + 3} 7L${h} 10L${h - 3} 7Z`} fill="#C9A55A" />
      <circle cx={h - 12} cy={7} r={1.2} fill="#C9A55A" />
      <circle cx={h + 12} cy={7} r={1.2} fill="#C9A55A" />
    </svg>
  );
}

/** Rising-sun fan crowning the logotype. */
export function SunFan({ width = 180 }: { width?: number }) {
  const rays = 19;
  return (
    <svg viewBox="-100 -100 200 104" width={width} className="block">
      <defs>
        <linearGradient id="fan-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="60%" stopColor="#C99A45" />
          <stop offset="100%" stopColor="#7A5418" />
        </linearGradient>
      </defs>
      {Array.from({ length: rays }, (_, i) => {
        const a = Math.PI + (i / (rays - 1)) * Math.PI;
        const long = i % 2 === 0;
        const r = long ? 96 : 74;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 34}
            y1={Math.sin(a) * 34}
            x2={Math.cos(a) * r}
            y2={Math.sin(a) * r}
            stroke="url(#fan-gold)"
            strokeWidth={long ? 1.4 : 0.7}
          />
        );
      })}
      <path d="M-28 0A28 28 0 0 1 28 0Z" fill="url(#fan-gold)" />
      <path d="M-20 0A20 20 0 0 1 20 0" fill="none" stroke="#0A0907" strokeWidth={1} />
      <path d="M-12 0A12 12 0 0 1 12 0" fill="none" stroke="#0A0907" strokeWidth={1} />
      <path d="M-100 2H100" stroke="url(#fan-gold)" strokeWidth={0.8} />
    </svg>
  );
}

/** Section title: roman numeral, name, rule. */
export function SectionTitle({ numeral, title, subtitle }: { numeral: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-10 flex flex-col items-center text-center">
      <span className="font-display text-xl italic text-accent">{numeral}</span>
      <h2 className="mt-1 font-display text-3xl tracking-[0.12em] text-text-primary sm:text-4xl">{title}</h2>
      <DecoRule className="mt-4" width={280} />
      {subtitle && <p className="mt-4 max-w-xl font-serif text-lg italic text-text-secondary">{subtitle}</p>}
    </header>
  );
}
