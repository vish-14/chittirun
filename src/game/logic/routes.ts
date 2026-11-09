import type { LevelId } from "./types";

/**
 * Real Hyderabad routes. Area / road / landmark names are real public places; shops and malls on the
 * roadside use generic names (real business names and logos are trademarks – swap them in only with
 * permission). Gameplay events on these roads are fictional satire.
 */
export interface RouteDef {
  name: string;
  stops: string[];
  landmark: string;
}

export const ROUTES: Record<LevelId, RouteDef> = {
  "old-city": {
    name: "Charminar → Koti",
    stops: ["Charminar", "Laad Bazaar", "Gulzar Houz", "Madina", "Afzal Gunj", "Koti"],
    landmark: "Charminar",
  },
  traffic: {
    name: "Ameerpet → Nampally (Metro corridor)",
    stops: ["Ameerpet", "Punjagutta", "Irrum Manzil", "Khairatabad", "Lakdikapul", "Nampally"],
    landmark: "Metro Line viaduct",
  },
  pothole: {
    name: "Mehdipatnam → Golconda",
    stops: ["Mehdipatnam", "Rethibowli", "Tolichowki", "Shaikpet", "Golconda"],
    landmark: "Golconda Fort",
  },
  water: {
    name: "Hitech City → Gachibowli",
    stops: ["Hitech City", "Madhapur", "Kothaguda", "Kondapur", "Gachibowli"],
    landmark: "Cyber Towers",
  },
  secretariat: {
    name: "Tank Bund → Secretariat",
    stops: ["Liberty", "Tank Bund", "Necklace Road", "Lumbini Park", "Secretariat"],
    landmark: "Hussain Sagar",
  },
};

/** Metres between stops along a route. */
export const STOP_SPACING = 450;

export function stopSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Where along the route the player is, for HUD and roadside signs. Routes loop in endless mode. */
export function routeProgress(level: LevelId, distance: number) {
  const r = ROUTES[level];
  const leg = Math.floor(distance / STOP_SPACING);
  const current = r.stops[leg % r.stops.length];
  const next = r.stops[(leg + 1) % r.stops.length];
  const toNext = STOP_SPACING - (distance % STOP_SPACING);
  return { current, next, toNext, leg };
}
