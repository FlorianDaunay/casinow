import { useEffect } from "react";
import { useRoute, type Route } from "./app/router";
import { music, type MusicStyle } from "./audio/music";
import { useProfile } from "./store/profile";
import { BlackjackScreen } from "./screens/blackjack/BlackjackScreen";
import { CollectionScreen } from "./screens/collection/CollectionScreen";
import { Lobby } from "./screens/Lobby";
import { MachinesScreen } from "./screens/machines/MachinesScreen";
import { PokerScreen } from "./screens/poker/PokerScreen";
import { RouletteScreen } from "./screens/roulette/RouletteScreen";
import { ShopScreen } from "./screens/shop/ShopScreen";
import { Showcase } from "./screens/Showcase";

/** The music of each room. */
const ROOM_MUSIC: Record<Route, MusicStyle> = {
  salon: "salon",
  planche: "salon",
  blackjack: "blackjack",
  roulette: "roulette",
  machines: "machines",
  poker: "poker",
  boutique: "arcane",
  collection: "arcane",
};

/** Plays the room's music; browsers only allow it to start after the first touch. */
function useRoomMusic(route: Route) {
  const musicOn = useProfile((s) => s.musicOn);
  useEffect(() => {
    music.play(ROOM_MUSIC[route]);
  }, [route]);
  useEffect(() => {
    if (!musicOn) {
      music.setEnabled(false);
      return;
    }
    music.setEnabled(true);
    const unlock = () => music.start();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [musicOn]);
}

export function App() {
  const route = useRoute();
  useRoomMusic(route);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  if (route === "blackjack") return <BlackjackScreen />;
  if (route === "roulette") return <RouletteScreen />;
  if (route === "machines") return <MachinesScreen />;
  if (route === "poker") return <PokerScreen />;
  if (route === "boutique") return <ShopScreen />;
  if (route === "collection") return <CollectionScreen />;
  if (route === "planche") return <Showcase />;
  return <Lobby />;
}
