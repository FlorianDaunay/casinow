import { Chip, CHIP_VALUES, type ChipValue } from "@/art/Chip";

/** Splits an amount into chips, largest first (as a croupier would pay it). */
export function chipsFor(amount: number, max = 10): ChipValue[] {
  const out: ChipValue[] = [];
  let rest = amount;
  for (const v of [...CHIP_VALUES].reverse()) {
    while (rest >= v && out.length < max) {
      out.push(v);
      rest -= v;
    }
  }
  // Largest at the bottom of the stack.
  return out;
}

/** A small physical stack of chips, each one slightly off-center. */
export function ChipStack({ amount, size = 48 }: { amount: number; size?: number }) {
  const chips = chipsFor(amount);
  const step = size * 0.09;
  return (
    <div className="relative" style={{ width: size, height: size + step * Math.max(0, chips.length - 1) }}>
      {chips.map((v, i) => (
        <div key={i} className="chip-stack absolute chip-drop" style={{ bottom: i * step, left: [0, 2, -1.5, 1, -2, 1.5][i % 6], animationDelay: `${i * 0.03}s` }}>
          <Chip value={v} size={size} />
        </div>
      ))}
    </div>
  );
}
