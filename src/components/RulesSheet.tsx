import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { MATERIALS } from "@/art/materials";
import { SlotSymbol } from "@/art/SlotSymbol";
import { CATALOG, usableAt } from "@/core/cards/catalog";
import type { PlayableTable } from "@/core/cards/types";
import { HAND_LABEL, HANDS, PAYTABLE as POKER_PAYS, ROYAL_MAX } from "@/core/poker/engine";
import { FREE_LADDER, FREE_SPINS, LADDER, PAYTABLE as SLOT_PAYS, type PayingSym } from "@/core/slots/engine";
import { totalCopies, useCollection } from "@/store/collection";
import { DecoRule } from "./Ornaments";

export type RulesGame = PlayableTable;

const TITLE: Record<RulesGame, string> = { blackjack: "Blackjack", roulette: "Roulette", machines: "Le Grand Hall", poker: "Vidéo poker" };

const num = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="label-deco mb-3 text-accent">{title}</h3>
      <div className="space-y-2 font-serif text-[1.05rem] leading-snug text-text-secondary">{children}</div>
    </section>
  );
}

/** Two-column pay table: what you get, what it pays. */
function Pays({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <table className="rules-table w-full">
      <tbody>
        {rows.map(([a, b], i) => (
          <tr key={i}>
            <td>{a}</td>
            <td className="whitespace-nowrap text-right font-display text-text-primary">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Blackjack() {
  return (
    <>
      <Section title="Le jeu">
        <p>Approchez-vous de 21 sans le dépasser, et battez le croupier. Les cartes de 2 à 10 valent leur chiffre, les figures 10, l'As 1 ou 11.</p>
        <p>Chacun reçoit deux cartes ; une carte du croupier reste cachée. Vous pouvez ensuite :</p>
        <ul className="list-none space-y-1 pl-0">
          <li><b className="font-display font-normal text-text-primary">Tirer</b> : recevoir une carte de plus.</li>
          <li><b className="font-display font-normal text-text-primary">Rester</b> : garder votre main.</li>
          <li><b className="font-display font-normal text-text-primary">Doubler</b> : doubler la mise contre une seule carte.</li>
          <li><b className="font-display font-normal text-text-primary">Séparer</b> : une paire devient deux mains (jusqu'à quatre). Les As séparés ne reçoivent qu'une carte.</li>
        </ul>
        <p>Le croupier tire jusqu'à 16 et reste à 17. S'il montre un As ou une figure, il vérifie aussitôt s'il a un blackjack.</p>
      </Section>
      <Section title="Les gains">
        <Pays
          rows={[
            ["Blackjack (As + figure ou 10, en deux cartes)", "3 pour 2"],
            ["Main gagnante", "1 pour 1"],
            ["Égalité", "Mise rendue"],
            ["Dépassé ou battu", "Mise perdue"],
          ]}
        />
        <p>Chaque blackjack naturel rapporte aussi un sceau. Six jeux de cartes, remélangés aux trois quarts du sabot.</p>
        <p className="text-text-muted">Retour théorique : environ 99,5 % en jouant la stratégie de base.</p>
      </Section>
    </>
  );
}

function Roulette() {
  return (
    <>
      <Section title="Le jeu">
        <p>Roulette européenne : trente-sept cases, de 0 à 36, un seul zéro. Choisissez un jeton, touchez une case du tapis pour miser, puis lancez la bille.</p>
        <p>Un appui long sur une case reprend sa mise. « Remiser » replace les mises du tour précédent. Jusqu'à 10 000 jetons par tour.</p>
      </Section>
      <Section title="Les gains">
        <Pays
          rows={[
            ["Plein (un numéro)", "35 pour 1"],
            ["Douzaine (1–12, 13–24, 25–36)", "2 pour 1"],
            ["Colonne (2 : 1)", "2 pour 1"],
            ["Rouge ou noir", "1 pour 1"],
            ["Pair ou impair", "1 pour 1"],
            ["1–18 ou 19–36", "1 pour 1"],
          ]}
        />
        <p>Quand le zéro tombe, toutes les mises autres que le plein sur 0 sont perdues.</p>
        <p className="text-text-muted">Retour théorique : 97,3 %.</p>
      </Section>
    </>
  );
}

function Machines() {
  const syms = (Object.keys(SLOT_PAYS) as PayingSym[]).reverse();
  return (
    <>
      <Section title="Le jeu">
        <p>Cinq rouleaux, trois rangées, 243 façons de gagner : un symbole paie s'il apparaît sur des rouleaux qui se suivent depuis la gauche, sur n'importe quelle rangée.</p>
        <p>Chaque combinaison compte : deux soleils sur le premier rouleau et un sur les deux suivants font deux gains.</p>
      </Section>
      <Section title="Les gains, en fois la mise">
        <table className="rules-table w-full">
          <thead>
            <tr>
              <th />
              <th>×3</th>
              <th>×4</th>
              <th>×5</th>
            </tr>
          </thead>
          <tbody>
            {syms.map((s) => (
              <tr key={s}>
                <td>
                  <SlotSymbol sym={s} size={30} />
                </td>
                {SLOT_PAYS[s].map((p, i) => (
                  <td key={i} className="text-right font-display text-text-primary">
                    {num(p / 20)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-3">
          <SlotSymbol sym="joker" size={34} />
          <p>Le Joker remplace tous les symboles sauf le Sceau. Il n'apparaît jamais sur le premier rouleau.</p>
        </div>
        <div className="flex items-center gap-3">
          <SlotSymbol sym="sceau" size={34} />
          <p>
            Trois, quatre ou cinq Sceaux n'importe où offrent {FREE_SPINS[3]}, {FREE_SPINS[4]} ou {FREE_SPINS[5]} tours gratuits, à la mise du tour qui les a déclenchés. Trois Sceaux pendant les tours gratuits en ajoutent cinq.
          </p>
        </div>
      </Section>
      <Section title="Les cascades">
        <p>Les symboles gagnants éclatent, ceux du dessus tombent à leur place et de nouveaux arrivent. Chaque nouvelle chute gagnante monte le multiplicateur :</p>
        <Pays
          rows={[
            ["Tours payants", LADDER.map((m) => `×${m}`).join("  ")],
            ["Tours gratuits", FREE_LADDER.map((m) => `×${m}`).join("  ")],
          ]}
        />
        <p className="text-text-muted">Retour théorique : 94,6 %.</p>
      </Section>
    </>
  );
}

function Poker() {
  const hands = HANDS.filter((h) => h !== "rien");
  return (
    <>
      <Section title="Le jeu">
        <p>Choisissez la valeur du jeton et le nombre d'unités (de 1 à 5), puis distribuez. Toutes vos cartes sont gardées : touchez celles que vous voulez changer, elles s'abaissent, marquées « Changer ». Tirez une seule fois : elles sont remplacées.</p>
        <p>Votre main finale est payée selon la table. Il faut au moins une paire de valets pour gagner.</p>
      </Section>
      <Section title="Les gains, par unité misée">
        <Pays
          rows={hands.map((h) => [
            HAND_LABEL[h],
            h === "royale" ? `${POKER_PAYS[h]} (${ROYAL_MAX} à 5 unités)` : String(POKER_PAYS[h]),
          ])}
        />
        <p>Un gain de 1 rend la mise ; au-delà, c'est du bénéfice.</p>
      </Section>
      <Section title="Quitte ou double">
        <p>Après un gain, vous pouvez le remettre en jeu : le croupier montre une carte, vous en choisissez une parmi quatre cachées. Plus forte, le gain double ; égale, il est rendu ; plus faible, il est perdu. L'As est la plus forte.</p>
        <p className="text-text-muted">Retour théorique : 97,3 % en jouant parfaitement.</p>
      </Section>
    </>
  );
}

/** The atouts that work at this table, with what you own and wear. */
function Atouts({ game }: { game: RulesGame }) {
  const { owned, loadout } = useCollection();
  // This table's own cards first, then the ones that work everywhere.
  const cards = CATALOG.filter((c) => usableAt(c, game)).sort((a, b) => Number(a.table === "tout") - Number(b.table === "tout"));
  return (
    <Section title="Les atouts de cette table">
      <p>Équipez-les depuis la collection. Les cartes « toutes tables » comptent partout.</p>
      <ul className="mt-3 space-y-2.5">
        {cards.map((c) => {
          const has = totalCopies(owned[c.id]) > 0;
          const on = loadout[game]?.includes(c.id);
          return (
            <li key={c.id} className={`flex gap-3 ${has ? "" : "opacity-45"}`}>
              <span className="mt-1.5 h-2 w-2 shrink-0 rotate-45" style={{ background: MATERIALS[c.rarity].glow }} />
              <span>
                <span className="font-display text-text-primary">{c.name}</span>
                {on ? <span className="label-deco ml-2 text-[0.55rem] text-accent">Équipé</span> : has ? <span className="label-deco ml-2 text-[0.55rem] text-text-muted">Possédé</span> : null}
                <br />
                <span className="text-[0.95rem]">{c.effect}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/**
 * Full-screen sheet with the rules and payouts of one game. Rendered on the body: the top
 * bar it opens from has a backdrop filter, which would trap a fixed element inside it.
 */
export function RulesSheet({ game, onClose }: { game: RulesGame; onClose: () => void }) {
  return createPortal(
    <div className="detail-scene fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="mx-auto max-w-xl px-6 pb-16 pt-12" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center">
          <span className="label-deco text-text-muted">Règles de la maison</span>
          <h2 className="mt-2 font-display text-4xl tracking-[0.1em]">{TITLE[game]}</h2>
          <DecoRule width={220} className="mt-3" />
        </div>
        {game === "blackjack" && <Blackjack />}
        {game === "roulette" && <Roulette />}
        {game === "machines" && <Machines />}
        {game === "poker" && <Poker />}
        <Atouts game={game} />
        <div className="mt-10 flex justify-center">
          <button className="btn btn-gold btn-compact" onClick={onClose}>
            Compris
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
