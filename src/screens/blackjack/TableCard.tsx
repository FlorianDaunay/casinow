import type { CSSProperties } from "react";
import { CardBack } from "@/art/CardBack";
import { PlayingCard } from "@/art/PlayingCard";
import type { Card } from "@/core/cards/playing";

interface Props {
  card: Card;
  faceUp: boolean;
  /** Seconds before the card flies in from the shoe. */
  delay: number;
  /** Where the shoe is, relative to the card (CSS lengths). */
  from: { x: string; y: string };
  /** Skip the entry animation (card already on the table when the screen opened). */
  still?: boolean;
}

/** A card on the felt: flies in from the shoe, and flips when turned face up. */
export function TableCard({ card, faceUp, delay, from, still }: Props) {
  // A small, stable tilt per physical card so hands look dealt by hand.
  const tilt = ((card.id * 37) % 7) - 3;
  const style = {
    "--from-x": from.x,
    "--from-y": from.y,
    "--tilt": `${tilt * 0.7}deg`,
    animationDelay: `${delay}s`,
  } as CSSProperties;
  return (
    <div className={`table-card ${still ? "" : "table-card-deal"}`} style={style}>
      <div className={`table-card-flip ${faceUp ? "is-up" : ""}`}>
        <div className="table-card-side table-card-front">
          <PlayingCard rank={card.rank} suit={card.suit} />
        </div>
        <div className="table-card-side table-card-back">
          <CardBack />
        </div>
      </div>
    </div>
  );
}
