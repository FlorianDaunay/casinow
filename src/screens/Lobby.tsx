import { GameGlyph, type GameId } from "@/art/GameGlyph";
import { navigate, type Route } from "@/app/router";
import { sfx } from "@/audio/sfx";
import { DecoRule, SunFan } from "@/components/Ornaments";
import { TopBar } from "@/components/TopBar";
import { HOUSE_CREDIT, HOUSE_CREDIT_THRESHOLD, useProfile } from "@/store/profile";

interface Door {
  game: GameId;
  title: string;
  line: string;
  route?: Route;
}

const DOORS: Door[] = [
  { game: "blackjack", title: "Blackjack", line: "Approchez-vous de vingt-et-un sans le dépasser.", route: "blackjack" },
  { game: "roulette", title: "Roulette", line: "Trente-sept cases, une seule bille.", route: "roulette" },
  { game: "machines", title: "Machines", line: "Les rouleaux du grand hall.", route: "machines" },
  { game: "poker", title: "Vidéo poker", line: "Valets ou mieux, cinq cartes." },
  { game: "collection", title: "Collection", line: "Vos cartes, vos atouts, vos séries.", route: "collection" },
  { game: "boutique", title: "Boutique", line: "Paquets scellés et privilèges.", route: "boutique" },
];

/** Stepped Art Deco arch, as a CSS clip-path (percentages of the door). */
const ARCH =
  "polygon(0 100%, 0 16%, 6% 12%, 14% 12%, 20% 7%, 30% 7%, 50% 0, 70% 7%, 80% 7%, 86% 12%, 94% 12%, 100% 16%, 100% 100%)";

function DoorTile({ door }: { door: Door }) {
  const open = !!door.route;
  return (
    <button
      disabled={!open}
      onClick={() => {
        sfx.tick();
        if (door.route) navigate(door.route);
      }}
      className={`door group relative flex flex-col items-center text-center ${open ? "" : "cursor-default"}`}
    >
      <div className="door-frame relative w-full" style={{ clipPath: ARCH }}>
        <div className="door-inner absolute inset-[1.5px] flex flex-col items-center justify-end px-5 pb-6 pt-10" style={{ clipPath: ARCH }}>
          <div className={`transition duration-500 ${open ? "group-hover:-translate-y-1 group-hover:scale-105" : "opacity-35 grayscale-[0.6]"}`}>
            <GameGlyph game={door.game} size={96} />
          </div>
          <h3 className={`mt-4 font-display text-2xl tracking-[0.1em] ${open ? "text-text-primary" : "text-text-muted"}`}>{door.title}</h3>
          <p className="mt-1.5 min-h-[2.6em] font-serif text-[0.98rem] italic leading-snug text-text-secondary">{door.line}</p>
          <span className={`label-deco mt-4 ${open ? "text-accent" : "text-text-muted"}`}>{open ? "Entrer" : "Bientôt"}</span>
        </div>
      </div>
    </button>
  );
}

export function Lobby() {
  const jetons = useProfile((s) => s.wallet.jetons);
  const takeHouseCredit = useProfile((s) => s.takeHouseCredit);
  const broke = jetons < HOUSE_CREDIT_THRESHOLD;

  return (
    <div className="showcase-bg min-h-screen">
      <TopBar />
      <section className="flex flex-col items-center px-4 pb-14 pt-12 text-center sm:pt-16">
        <SunFan width={170} />
        <h1 className="mt-5 pl-[0.18em] font-display text-5xl tracking-[0.18em] text-gold sm:text-7xl sm:tracking-[0.22em]">CASINOW</h1>
        <p className="label-deco mt-4 text-text-secondary">Le Salon · Club privé</p>
        <DecoRule width={260} className="mt-5" />
      </section>

      {broke && (
        <div className="mx-auto mb-10 max-w-md px-4">
          <div className="panel-deco flex flex-col items-center gap-3 px-6 py-6 text-center">
            <p className="font-serif text-lg italic text-text-secondary">Vos poches sont vides. La maison vous fait crédit, pour cette fois.</p>
            <button
              className="btn btn-gold"
              onClick={() => {
                takeHouseCredit();
                sfx.chip(4);
              }}
            >
              Accepter {HOUSE_CREDIT.toLocaleString("fr-FR")} jetons
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 pb-16 sm:gap-6 sm:px-8 lg:grid-cols-3">
        {DOORS.map((d) => (
          <DoorTile key={d.game} door={d} />
        ))}
      </main>

      <footer className="pb-12 text-center">
        <a href="#/planche" className="label-deco text-text-muted transition hover:text-accent">
          Planche des styles
        </a>
      </footer>
    </div>
  );
}
