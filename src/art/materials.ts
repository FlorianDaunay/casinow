import type { Rarity } from "@/core/cards/types";

/**
 * Card-art palette. Fixed, theme-independent colors (illustration, not UI): each rarity is
 * a "material", from inked bone paper up to obsidian and rose gold.
 */
export interface Material {
  label: string;
  /** Number of diamond pips printed under the name. */
  pips: number;
  /** Metal of the frame: gradient stops from light to dark and back (brushed look). */
  frame: string[];
  /** Background of the inner field: center and edge of a radial gradient. */
  field: [string, string];
  /** Engraving / line color on the field. */
  line: string;
  /** Glyph metal gradient (top to bottom). */
  glyph: string[];
  /** Ink used for text printed on the frame. */
  ink: string;
  /** Glow color behind the glyph and the card. */
  glow: string;
}

export const MATERIALS: Record<Rarity, Material> = {
  commune: {
    label: "Commune",
    pips: 1,
    frame: ["#EDE4D0", "#CFC3A8", "#A99C80", "#D8CDB4", "#F2EBDB"],
    field: ["#26221B", "#110F0B"],
    line: "#C9BC9E",
    glyph: ["#F4ECDA", "#C8BB9C", "#8E8167"],
    ink: "#2B2418",
    glow: "#E7DCC2",
  },
  rare: {
    label: "Rare",
    pips: 2,
    frame: ["#F2F4F8", "#AEB6C6", "#6B7487", "#C9D0DE", "#F5F7FB"],
    field: ["#1B2747", "#080D1C"],
    line: "#8FA9E0",
    glyph: ["#FFFFFF", "#B9C8EA", "#6E83B6"],
    ink: "#141A2A",
    glow: "#6D93F2",
  },
  epique: {
    label: "Épique",
    pips: 3,
    frame: ["#F6E7C4", "#D3B67A", "#94723A", "#E2C88E", "#FAF0D6"],
    field: ["#2E1740", "#0E0717"],
    line: "#C7A2E6",
    glyph: ["#FFF3D6", "#E0BE7C", "#9A7438"],
    ink: "#24160A",
    glow: "#B47CF0",
  },
  legendaire: {
    label: "Légendaire",
    pips: 4,
    frame: ["#FFF0B8", "#E8C36A", "#A87A2A", "#5E4012", "#D9A94A", "#FFE7A0"],
    field: ["#2A1D0B", "#0A0704"],
    line: "#D9B467",
    glyph: ["#FFF6D2", "#F0C866", "#A9761F"],
    ink: "#1B1205",
    glow: "#F2BE4E",
  },
  mythique: {
    label: "Mythique",
    pips: 5,
    frame: ["#3A3230", "#141110", "#050404", "#26201E", "#4A403C"],
    field: ["#1A0D10", "#030202"],
    line: "#E9B3A0",
    glyph: ["#FFE9DF", "#E8A890", "#9B5E4C"],
    ink: "#F2C9B8",
    glow: "#FF9F86",
  },
};
