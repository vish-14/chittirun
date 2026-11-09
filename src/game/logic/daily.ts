import { hashString } from "./rng";
import { LEVELS } from "./levels";
import type { LevelId } from "./types";

export interface DailyModifier {
  id: string;
  name: string;
  description: string;
  speedMult: number;
  powerupRateMult: number;
  coinMult: number;
}

export const DAILY_MODIFIERS: DailyModifier[] = [
  { id: "monsoon", name: "Monsoon Mayhem", description: "Wet roads: everything moves 10% faster.", speedMult: 1.1, powerupRateMult: 1, coinMult: 1 },
  { id: "chai-overload", name: "Chai Overload", description: "Power-ups appear twice as often.", speedMult: 1, powerupRateMult: 2, coinMult: 1 },
  { id: "coin-rain", name: "Coin Rain", description: "Extra coin trails everywhere.", speedMult: 1, powerupRateMult: 1, coinMult: 1.6 },
  { id: "festival", name: "Festival Traffic", description: "Faster, but more power-ups to compensate.", speedMult: 1.07, powerupRateMult: 1.4, coinMult: 1.2 },
  { id: "election-week", name: "Election Week", description: "Missions everywhere, coins everywhere.", speedMult: 1.03, powerupRateMult: 1.2, coinMult: 1.3 },
];

export interface DailyChallenge {
  date: string; // YYYY-MM-DD (UTC)
  seed: number;
  level: LevelId;
  modifier: DailyModifier;
  targetScore: number;
}

export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function dailyChallengeFor(date: string): DailyChallenge {
  const seed = hashString(`chitti-daily-${date}`);
  const level = LEVELS[seed % LEVELS.length].id;
  const modifier = DAILY_MODIFIERS[(seed >>> 8) % DAILY_MODIFIERS.length];
  const targetScore = 3000 + ((seed >>> 16) % 6) * 1000;
  return { date, seed, level, modifier, targetScore };
}
