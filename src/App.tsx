import { useEffect } from "react";
import { useRoute } from "./app/router";
import { BlackjackScreen } from "./screens/blackjack/BlackjackScreen";
import { CollectionScreen } from "./screens/collection/CollectionScreen";
import { Lobby } from "./screens/Lobby";
import { MachinesScreen } from "./screens/machines/MachinesScreen";
import { RouletteScreen } from "./screens/roulette/RouletteScreen";
import { ShopScreen } from "./screens/shop/ShopScreen";
import { Showcase } from "./screens/Showcase";

export function App() {
  const route = useRoute();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  if (route === "blackjack") return <BlackjackScreen />;
  if (route === "roulette") return <RouletteScreen />;
  if (route === "machines") return <MachinesScreen />;
  if (route === "boutique") return <ShopScreen />;
  if (route === "collection") return <CollectionScreen />;
  if (route === "planche") return <Showcase />;
  return <Lobby />;
}
