import type { LevelId, ObstacleKind, PowerUpKind } from "./types";

export interface LevelDef {
  id: LevelId;
  index: number;
  name: string;
  tagline: string;
  /** starting speed m/s */
  baseSpeed: number;
  /** speed gain per second */
  accel: number;
  maxSpeed: number;
  /** seconds between obstacle rows at start / at max difficulty */
  rowGapStart: number;
  rowGapMin: number;
  obstacleWeights: Partial<Record<ObstacleKind, number>>;
  powerupWeights: Partial<Record<PowerUpKind, number>>;
  /** chance a row has two blocked lanes */
  doubleChance: number;
  boss: { name: string; description: string; firstAt: number; interval: number; shotKind: "bossShot" };
  /** best score needed in this level to unlock the next */
  unlockNextScore: number;
}

export const LEVELS: LevelDef[] = [
  {
    id: "old-city",
    index: 0,
    name: "Old City Chaos",
    tagline: "Narrow lanes, pushcarts, cows with right-of-way.",
    baseSpeed: 13,
    accel: 0.06,
    maxSpeed: 25,
    rowGapStart: 1.25,
    rowGapMin: 0.7,
    obstacleWeights: { crater: 2, brokenSlab: 2, potQueue: 2, pothole: 4, puddle: 3, jam: 2, cart: 3, cow: 2, cables: 3, auto: 3, barricade: 1, cones: 1 },
    powerupWeights: { chai: 4, biryani: 3, fileCollector: 2, metro: 1, rocket: 1, tankerShield: 1 },
    doubleChance: 0.25,
    boss: {
      name: "The Runaway Mega-Auto",
      description: "A three-wheeled legend with no brakes and strong opinions.",
      firstAt: 55,
      interval: 85,
      shotKind: "bossShot",
    },
    unlockNextScore: 4000,
  },
  {
    id: "traffic",
    index: 1,
    name: "Traffic Madness",
    tagline: "Every signal is a suggestion. Every horn is a conversation.",
    baseSpeed: 14,
    accel: 0.07,
    maxSpeed: 27,
    rowGapStart: 1.15,
    rowGapMin: 0.66,
    obstacleWeights: { crater: 2, brokenSlab: 2, potQueue: 2, jam: 4, auto: 4, bus: 3, pothole: 3, puddle: 3, cones: 1, boomGate: 2, banner: 1, speedBreaker: 2 },
    powerupWeights: { metro: 4, chai: 3, biryani: 2, fileCollector: 2, rocket: 1, tankerShield: 1 },
    doubleChance: 0.32,
    boss: {
      name: "The Gridlock Double-Decker",
      description: "Two storeys of pure honking. Dodges signals professionally.",
      firstAt: 55,
      interval: 80,
      shotKind: "bossShot",
    },
    unlockNextScore: 6000,
  },
  {
    id: "pothole",
    index: 2,
    name: "Pothole Paradise",
    tagline: "Is it a road with potholes, or potholes with some road?",
    baseSpeed: 14.5,
    accel: 0.075,
    maxSpeed: 28,
    rowGapStart: 1.1,
    rowGapMin: 0.64,
    obstacleWeights: { crater: 5, brokenSlab: 3, potQueue: 2, pothole: 7, puddle: 3, jam: 2, speedBreaker: 2, barricade: 2, cones: 1, banner: 2, auto: 2, cow: 1 },
    powerupWeights: { tankerShield: 4, biryani: 3, chai: 2, fileCollector: 2, rocket: 1, metro: 1 },
    doubleChance: 0.35,
    boss: {
      name: "The Crater-Digging JCB",
      description: "Digs a fresh pothole for every one you fix. Overachiever.",
      firstAt: 50,
      interval: 80,
      shotKind: "bossShot",
    },
    unlockNextScore: 8000,
  },
  {
    id: "water",
    index: 3,
    name: "Water Crisis Escape",
    tagline: "Dry taps, wet roads, and tankers on a mission.",
    baseSpeed: 15,
    accel: 0.08,
    maxSpeed: 29,
    rowGapStart: 1.05,
    rowGapMin: 0.62,
    obstacleWeights: { crater: 2, brokenSlab: 2, potQueue: 2, puddle: 6, tanker: 4, pothole: 3, jam: 2, pipe: 2, cables: 2, auto: 2, cow: 1 },
    powerupWeights: { tankerShield: 4, chai: 3, biryani: 2, rocket: 2, fileCollector: 2, metro: 1 },
    doubleChance: 0.38,
    boss: {
      name: "The Thirsty Mega-Tanker",
      description: "Sprays water everywhere except where it's needed.",
      firstAt: 50,
      interval: 75,
      shotKind: "bossShot",
    },
    unlockNextScore: 10000,
  },
  {
    id: "secretariat",
    index: 4,
    name: "Secretariat Escape",
    tagline: "Outrun the files before they outrun you.",
    baseSpeed: 15.5,
    accel: 0.085,
    maxSpeed: 30,
    rowGapStart: 1.0,
    rowGapMin: 0.6,
    obstacleWeights: { crater: 2, brokenSlab: 1, potQueue: 2, fileStack: 4, redTape: 3, boomGate: 2, pothole: 3, puddle: 3, jam: 2, barricade: 1, bus: 1, cones: 1 },
    powerupWeights: { fileCollector: 4, rocket: 3, chai: 2, biryani: 2, metro: 1, tankerShield: 1 },
    doubleChance: 0.42,
    boss: {
      name: "The Red-Tape Golem",
      description: "Made of ten thousand pending files. Requires your signature on each.",
      firstAt: 45,
      interval: 75,
      shotKind: "bossShot",
    },
    unlockNextScore: Infinity,
  },
];

export function getLevel(id: LevelId): LevelDef {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`Unknown level ${id}`);
  return l;
}

export function isLevelId(v: unknown): v is LevelId {
  return typeof v === "string" && LEVELS.some((l) => l.id === v);
}
