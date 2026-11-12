import { useRef, type CSSProperties, type PointerEvent } from "react";
import { CardFace } from "@/art/CardFace";
import { MATERIALS } from "@/art/materials";
import type { CardDef, Finish } from "@/core/cards/types";

interface Props {
  card: CardDef;
  finish?: Finish;
  /** Rendered width in px; the height follows the 5:7 ratio. */
  width?: number;
  /** Follow the pointer with a 3D tilt and moving light. */
  interactive?: boolean;
}

/**
 * A collectible card with its physical feel: 3D tilt towards the pointer, a glare that follows
 * the light, and the foil layers of its finish. The pointer position is passed to CSS as
 * variables so every effect runs on the compositor.
 */
export function CollectibleCard({ card, finish = "standard", width = 250, interactive = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !interactive) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 20}deg`);
    el.style.setProperty("--hyp", `${Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2)}`);
    el.dataset.active = "true";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.dataset.active = "false";
    for (const [k, v] of Object.entries(REST)) el.style.setProperty(k, v);
  };

  const style = {
    width,
    "--glow": MATERIALS[card.rarity].glow,
    ...REST,
  } as CSSProperties;

  return (
    <div className="card-perspective" style={{ width }}>
      <div
        ref={ref}
        className="collectible"
        data-rarity={card.rarity}
        data-finish={finish}
        data-active="false"
        style={style}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div className="collectible-face">
          <CardFace card={card} finish={finish} />
        </div>
        {finish === "holo" && <div className="collectible-holo" />}
        {card.rarity === "mythique" && <div className="collectible-iris" />}
        <div className="collectible-glare" />
      </div>
    </div>
  );
}

const REST = { "--mx": "50%", "--my": "35%", "--rx": "0deg", "--ry": "0deg", "--hyp": "0" };
