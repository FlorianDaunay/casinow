import type { CardDef, Emblem, Family, Power, Rarity, Table } from "./types";

/** Rules text of a power, as printed on the card. */
export function describePower(power: Power): string {
  switch (power.kind) {
    case "win-bonus":
      return power.table === "tout"
        ? `Tous les gains augmentent de ${power.pct} %.`
        : `Les gains au blackjack augmentent de ${power.pct} %.`;
    case "bust-refund":
      return `Rembourse ${power.pct} % de la mise d'une main dépassée.`;
    case "natural-pays":
      return `Le blackjack naturel paie ${power.value} pour 1.`;
    case "double-any":
      return "Doubler est permis sur n'importe quelle main.";
    case "charlie":
      return "Cinq cartes sans dépasser 21 gagnent d'office.";
    case "peek":
      return power.uses === 1
        ? "Une fois par visite, révèle la carte cachée du croupier."
        : `${power.uses} fois par visite, révèle la carte cachée du croupier.`;
    case "slot":
      return "Un emplacement d'atout de plus à chaque table.";
    case "future":
      return power.text;
  }
}

type Row = [number, string, Family, Rarity, Emblem, Table, Power];

const win = (pct: number, table: "blackjack" | "tout" = "tout"): Power => ({ kind: "win-bonus", pct, table });
const bust = (pct: number): Power => ({ kind: "bust-refund", pct });
const future = (text: string): Power => ({ kind: "future", text });

const ROWS: Row[] = [
  [1, "Le Portier", "La Maison", "commune", "cle", "blackjack", win(2, "blackjack")],
  [2, "Le Tapis Vert", "La Maison", "commune", "etoile", "blackjack", win(2, "blackjack")],
  [3, "Le Sabot", "La Maison", "commune", "de", "blackjack", bust(5)],
  [4, "La Clé du Salon", "La Maison", "rare", "cle", "tout", win(3)],
  [5, "La Main Ferme", "La Maison", "rare", "pique", "blackjack", bust(15)],
  [6, "Le Double Fond", "La Maison", "epique", "coupe", "blackjack", { kind: "double-any" }],
  [7, "Cinq Cartes", "La Maison", "epique", "etoile", "blackjack", { kind: "charlie" }],
  [8, "La Couronne", "La Maison", "legendaire", "couronne", "blackjack", { kind: "natural-pays", value: 2 }],
  [9, "L'Œil du Croupier", "La Maison", "legendaire", "oeil", "blackjack", { kind: "peek", uses: 1 }],

  [10, "L'Étoile du Nord", "Les Astres", "commune", "etoile", "tout", win(1)],
  [11, "La Lune Pâle", "Les Astres", "commune", "lune", "tout", win(1)],
  [12, "Le Croissant", "Les Astres", "commune", "lune", "roulette", future("+2 % sur les mises sur les douzaines.")],
  [13, "L'Étoile du Berger", "Les Astres", "rare", "etoile", "tout", win(2)],
  [14, "La Lune Noire", "Les Astres", "epique", "lune", "poker", future("Une fois par main, échange une carte de ta main.")],
  [15, "L'Éclipse", "Les Astres", "epique", "soleil", "tout", win(4)],
  [16, "Le Zénith", "Les Astres", "legendaire", "soleil", "tout", win(6)],
  [17, "Le Grand Soleil", "Les Astres", "mythique", "soleil", "tout", win(10)],

  [18, "Le Faux Dé", "Les Tricheurs", "commune", "de", "roulette", future("+2 % sur le rouge et le noir.")],
  [19, "La Carte Biseautée", "Les Tricheurs", "commune", "pique", "poker", future("+5 % sur les paires de valets ou mieux.")],
  [20, "Le Dé Lesté", "Les Tricheurs", "commune", "de", "roulette", future("+3 % sur les numéros pleins.")],
  [21, "Le Dé Pipé", "Les Tricheurs", "rare", "de", "roulette", future("Rembourse la moitié de la mise quand le zéro tombe.")],
  [22, "La Manche Truquée", "Les Tricheurs", "rare", "pique", "blackjack", bust(10)],
  [23, "Le Bluff", "Les Tricheurs", "rare", "oeil", "poker", future("Une fois par visite, rejoue une main perdue.")],
  [24, "L'As de Pique", "Les Tricheurs", "epique", "pique", "poker", future("Ta première main de chaque visite contient un As.")],
  [25, "Le Tapis Pipé", "Les Tricheurs", "legendaire", "oeil", "roulette", future("Une fois par visite, rejoue gratuitement une mise perdue.")],

  [26, "La Coupe", "Le Banquet", "commune", "coupe", "machines", future("+2 % sur chaque gain aux machines.")],
  [27, "Le Festin", "Le Banquet", "commune", "couronne", "machines", future("Un tour gratuit toutes les 50 parties.")],
  [28, "Le Toast", "Le Banquet", "commune", "coupe", "tout", win(1)],
  [29, "Le Calice", "Le Banquet", "rare", "coupe", "machines", future("Les jokers apparaissent plus souvent.")],
  [30, "Le Sommelier", "Le Banquet", "rare", "cle", "machines", future("+5 % sur les gains en cascade.")],
  [31, "La Fontaine", "Le Banquet", "epique", "coupe", "machines", future("Les tours gratuits rapportent 10 % de plus.")],
  [32, "Le Grand Cru", "Le Banquet", "rare", "couronne", "machines", future("+3 % sur tous les gains aux machines.")],

  [33, "Le Sablier", "Les Horlogers", "commune", "sablier", "tout", future("Le bonus quotidien se recharge 10 % plus vite.")],
  [34, "Le Rouage", "Les Horlogers", "commune", "etoile", "tout", win(1)],
  [35, "Le Balancier", "Les Horlogers", "commune", "sablier", "blackjack", win(2, "blackjack")],
  [36, "Le Coucou", "Les Horlogers", "rare", "sablier", "blackjack", bust(10)],
  [37, "L'Heure Dorée", "Les Horlogers", "rare", "soleil", "tout", future("Une Heure dorée de plus chaque jour.")],
  [38, "Minuit", "Les Horlogers", "epique", "lune", "tout", win(3)],
  [39, "Le Grand Horloger", "Les Horlogers", "rare", "sablier", "blackjack", win(5, "blackjack")],
  [40, "La Pendule", "Les Horlogers", "commune", "cle", "tout", win(1)],
];

/** Série I: every collectible card. */
export const CATALOG: CardDef[] = ROWS.map(([number, name, family, rarity, emblem, table, power]) => ({
  id: `s1-${String(number).padStart(2, "0")}`,
  number,
  name,
  family,
  rarity,
  emblem,
  table,
  power,
  effect: describePower(power),
}));

const BY_ID = new Map(CATALOG.map((c) => [c.id, c]));
export const findCard = (id: string) => BY_ID.get(id);

export const FAMILIES: Family[] = ["La Maison", "Les Astres", "Les Tricheurs", "Le Banquet", "Les Horlogers"];

/** Permanent bonus earned by owning every card of a family, plus a one-time gift of sceaux. */
export const FAMILY_BONUS: Record<Family, { power: Power; sceaux: number }> = {
  "La Maison": { power: { kind: "slot" }, sceaux: 5 },
  "Les Astres": { power: win(3), sceaux: 5 },
  "Les Tricheurs": { power: bust(5), sceaux: 5 },
  "Le Banquet": { power: win(3), sceaux: 5 },
  "Les Horlogers": { power: win(3), sceaux: 5 },
};

export const cardsOfFamily = (family: Family) => CATALOG.filter((c) => c.family === family);

/** Whether a card's power can be used at a given open table. */
export const usableAt = (card: CardDef, table: "blackjack") =>
  (card.table === table || card.table === "tout") && card.power.kind !== "future";
