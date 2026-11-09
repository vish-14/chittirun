import {
  ABSOLUTE_MAX_SPEED,
  CHAI_MULT,
  COIN_VALUE,
  DISTANCE_POINTS_PER_METRE,
  HIGH_APPROVAL_MULT,
  MAX_COINS_PER_SECOND,
  MAX_RUN_SECONDS,
  MAX_TOTAL_MULT,
  MULT_MISSION_CAP,
  MULT_PER_MISSION,
} from "./constants";

export const BONUS = {
  bossDefeated: 3000,
  finalChallengeWon: 5000,
  maxMissionBonus: 3000,
  demolitionStopped: 1500,
} as const;

/** Minimum real seconds needed between the events below (used for server plausibility bounds). */
export const MIN_SECONDS = { mission: 8, boss: 40, finalChallenge: 30, demolition: 20 } as const;

export function scoreMultiplier(missionsCompleted: number, chaiActive: boolean, approval: number): number {
  const base = Math.min(MULT_MISSION_CAP, 1 + MULT_PER_MISSION * missionsCompleted);
  return base * (chaiActive ? CHAI_MULT : 1) * (approval >= 80 ? HIGH_APPROVAL_MULT : 1);
}

export interface RunSummary {
  score: number;
  distance: number;
  coins: number;
  durationSec: number;
  missionsCompleted: number;
  bossesDefeated: number;
  finalChallengesWon: number;
  /** HYDRA demolitions stopped in time (optional for older clients) */
  demolitionsStopped?: number;
  /** checkpoints every ~10 s: [t, distance, score] */
  checkpoints: [number, number, number][];
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Pure plausibility checks for a submitted run. Used server-side; mirrored in tests.
 * The server additionally checks wall-clock time between run start and submission.
 */
export function validateRunSummary(s: RunSummary): ValidationResult {
  const nums = [s.score, s.distance, s.coins, s.durationSec, s.missionsCompleted, s.bossesDefeated, s.finalChallengesWon];
  if (!nums.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0)) return { ok: false, reason: "invalid-numbers" };
  if (![s.coins, s.missionsCompleted, s.bossesDefeated, s.finalChallengesWon].every(Number.isInteger))
    return { ok: false, reason: "non-integer-counts" };
  if (s.durationSec < 1 || s.durationSec > MAX_RUN_SECONDS) return { ok: false, reason: "duration-out-of-range" };

  const d = s.durationSec;
  if (s.distance > ABSOLUTE_MAX_SPEED * d + 5) return { ok: false, reason: "distance-too-high" };
  if (s.coins > MAX_COINS_PER_SECOND * d + 10) return { ok: false, reason: "coins-too-high" };
  if (s.missionsCompleted > Math.floor(d / MIN_SECONDS.mission) + 1) return { ok: false, reason: "missions-too-high" };
  if (s.bossesDefeated > Math.floor(d / MIN_SECONDS.boss) + 1) return { ok: false, reason: "bosses-too-high" };
  if (s.finalChallengesWon > Math.floor(d / MIN_SECONDS.finalChallenge) + 1)
    return { ok: false, reason: "final-challenges-too-high" };
  const demolitions = s.demolitionsStopped ?? 0;
  if (typeof demolitions !== "number" || !Number.isInteger(demolitions) || demolitions < 0) return { ok: false, reason: "bad-demolitions" };
  if (demolitions > Math.floor(d / MIN_SECONDS.demolition) + 1) return { ok: false, reason: "demolitions-too-high" };

  const maxScore =
    s.distance * DISTANCE_POINTS_PER_METRE * MAX_TOTAL_MULT +
    s.coins * COIN_VALUE * MAX_TOTAL_MULT +
    s.missionsCompleted * BONUS.maxMissionBonus +
    s.bossesDefeated * BONUS.bossDefeated +
    s.finalChallengesWon * BONUS.finalChallengeWon +
    demolitions * BONUS.demolitionStopped +
    50; // rounding slack
  if (s.score > maxScore) return { ok: false, reason: "score-too-high" };

  // Checkpoint consistency: monotonic and per-interval rate-bounded.
  if (!Array.isArray(s.checkpoints) || s.checkpoints.length > d / 5 + 5) return { ok: false, reason: "bad-checkpoints" };
  let prev: [number, number, number] = [0, 0, 0];
  const perSecondScoreCap =
    ABSOLUTE_MAX_SPEED * MAX_TOTAL_MULT + MAX_COINS_PER_SECOND * COIN_VALUE * MAX_TOTAL_MULT;
  for (const cp of s.checkpoints) {
    if (!Array.isArray(cp) || cp.length !== 3 || !cp.every((n) => typeof n === "number" && Number.isFinite(n)))
      return { ok: false, reason: "bad-checkpoint" };
    const [t, dist, sc] = cp;
    if (t < prev[0] || dist < prev[1] || sc < prev[2]) return { ok: false, reason: "non-monotonic-checkpoints" };
    const dt = t - prev[0];
    if (dist - prev[1] > ABSOLUTE_MAX_SPEED * dt + 5) return { ok: false, reason: "checkpoint-distance-spike" };
    // allow bonus lumps (missions/bosses/challenges) on top of the per-second cap
    const lumpAllowance = BONUS.maxMissionBonus + BONUS.bossDefeated + BONUS.finalChallengeWon + BONUS.demolitionStopped;
    if (sc - prev[2] > perSecondScoreCap * dt + lumpAllowance) return { ok: false, reason: "checkpoint-score-spike" };
    prev = cp as [number, number, number];
  }
  if (prev[0] > d + 1 || prev[1] > s.distance + 1 || prev[2] > s.score + 1) return { ok: false, reason: "checkpoints-exceed-final" };
  return { ok: true };
}
