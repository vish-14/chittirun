import type { Avoid, ObstacleKind, PowerUpKind, TokenKind } from "./types";

export interface ObstacleSpec {
  avoid: Avoid;
  length: number;
  /** oncoming speed in m/s (vehicles drive towards the player) */
  vz: number;
  label: string;
}

export const OBSTACLES: Record<ObstacleKind, ObstacleSpec> = {
  pothole: { avoid: "jumpOrSlide", length: 1.4, vz: 0, label: "Pothole" },
  speedBreaker: { avoid: "jump", length: 1.0, vz: 0, label: "Surprise speed breaker" },
  barricade: { avoid: "jump", length: 1.0, vz: 0, label: "Construction barricade" },
  cones: { avoid: "jump", length: 1.2, vz: 0, label: "Traffic cones" },
  banner: { avoid: "slide", length: 1.0, vz: 0, label: "'Work In Progress' banner" },
  cables: { avoid: "slide", length: 1.0, vz: 0, label: "Tangled overhead cables" },
  auto: { avoid: "lane", length: 2.4, vz: 3, label: "Auto-rickshaw" },
  bus: { avoid: "lane", length: 6.5, vz: 2, label: "City bus" },
  tanker: { avoid: "lane", length: 5.0, vz: 1.5, label: "Water tanker" },
  cow: { avoid: "lane", length: 2.0, vz: 0, label: "Unbothered cow" },
  cart: { avoid: "lane", length: 2.0, vz: 0, label: "Fruit pushcart" },
  puddle: { avoid: "jump", length: 1.8, vz: 0, label: "Mystery puddle" },
  pipe: { avoid: "jump", length: 1.0, vz: 0, label: "Burst pipeline" },
  jam: { avoid: "lane", length: 3.0, vz: 0, label: "Traffic jam" },
  fileStack: { avoid: "lane", length: 1.6, vz: 0, label: "Pending-file tower" },
  redTape: { avoid: "slide", length: 1.0, vz: 0, label: "Red tape" },
  boomGate: { avoid: "slide", length: 1.0, vz: 0, label: "Security boom gate" },
  bossShot: { avoid: "lane", length: 1.6, vz: 9, label: "Boss attack" },
};

export interface PowerUpSpec {
  name: string;
  duration: number;
  description: string;
}

export const POWERUPS: Record<PowerUpKind, PowerUpSpec> = {
  chai: { name: "Irani Chai", duration: 9, description: "Double score and a caffeine sprint." },
  biryani: { name: "Biryani Shield", duration: 20, description: "Absorbs one collision. Dum-cooked protection." },
  metro: { name: "Metro Pass", duration: 6, description: "Glide above traffic on the metro: invincible." },
  fileCollector: { name: "File Collector", duration: 10, description: "Magnet for coins and mission tokens." },
  rocket: { name: "Promise Rocket", duration: 5, description: "Promises go sky-high. So do you." },
  tankerShield: {
    name: "Water Tanker Shield",
    duration: 12,
    description: "Plough through potholes, puddles & bumps – and patch potholes as you go.",
  },
};

export const TOKENS: Record<TokenKind, { name: string }> = {
  whistle: { name: "Traffic Whistle" },
  tankerToken: { name: "Water Delivery" },
  job: { name: "Employment Token" },
  service: { name: "Public Service File" },
  brick: { name: "Construction Brick" },
  siren: { name: "Emergency Siren" },
  petition: { name: "Public Petition" },
};

export function isGroundHazard(kind: ObstacleKind): boolean {
  return kind === "pothole" || kind === "puddle" || kind === "speedBreaker" || kind === "pipe";
}
