import { useSyncExternalStore } from "react";

/** Screens of the app. Hash routing: works from a file, a static host and the Android WebView. */
export type Route = "salon" | "blackjack" | "roulette" | "machines" | "boutique" | "collection" | "planche";

const ROUTES: Route[] = ["salon", "blackjack", "roulette", "machines", "boutique", "collection", "planche"];

function current(): Route {
  const name = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as string[]).includes(name) ? (name as Route) : "salon";
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export const useRoute = () => useSyncExternalStore(subscribe, current);

export function navigate(route: Route) {
  window.location.hash = `/${route}`;
}
