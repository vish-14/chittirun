"use client";
import { useSyncExternalStore } from "react";
import { OUTFITS, type Outfit } from "@/game/art/character";
import { applyChapterResult, CHAPTERS, initialCampaign, type CampaignProgress } from "@/game/logic/campaign";
import { LEVELS, isLevelId } from "@/game/logic/levels";
import { MISSION_IDS } from "@/game/logic/missions";
import type { EndReason, GameMode, LevelId, MissionId, MissionStatus } from "@/game/logic/types";
import { mirrorSave, readNativeSave } from "./native";

export interface Settings {
  music: number;
  sfx: number;
  muted: boolean;
  reducedMotion: boolean;
  relaxed: boolean;
  briefings: boolean;
  touchButtons: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface Stats {
  runs: number;
  totalCoins: number;
  totalDistance: number;
  playSeconds: number;
  missionsCompleted: number;
  missionsFailed: number;
  bossesDefeated: number;
  fcWins: number;
  fcLosses: number;
  cmLost: number;
  bestApproval: number;
  byMission: Record<MissionId, { completed: number; failed: number }>;
}

export interface LocalScore {
  name: string;
  score: number;
  level: LevelId;
  mode: GameMode;
  date: string;
}

export interface Profile {
  version: 1;
  /** ms timestamp of the last save – used to pick the newest copy (WebView vs native storage). */
  savedAt: number;
  playerName: string;
  outfit: Outfit;
  unlockedOutfits: Outfit[];
  settings: Settings;
  highScores: Partial<Record<LevelId, number>>;
  unlockedLevels: LevelId[];
  daily: Record<string, number>;
  campaign: CampaignProgress;
  stats: Stats;
  rewards: string[];
  localBoard: LocalScore[];
}

const KEY = "chitti-run:profile:v1";

export const DEFAULT_SETTINGS: Settings = {
  music: 0.6,
  sfx: 0.8,
  muted: false,
  reducedMotion: false,
  relaxed: false,
  briefings: true,
  touchButtons: false,
  highContrast: false,
  largeText: false,
};

function defaultStats(): Stats {
  return {
    runs: 0,
    totalCoins: 0,
    totalDistance: 0,
    playSeconds: 0,
    missionsCompleted: 0,
    missionsFailed: 0,
    bossesDefeated: 0,
    fcWins: 0,
    fcLosses: 0,
    cmLost: 0,
    bestApproval: 0,
    byMission: Object.fromEntries(MISSION_IDS.map((m) => [m, { completed: 0, failed: 0 }])) as Stats["byMission"],
  };
}

export function defaultProfile(): Profile {
  return {
    version: 1,
    savedAt: 0,
    playerName: "",
    outfit: "classic",
    unlockedOutfits: ["classic"],
    settings: { ...DEFAULT_SETTINGS },
    highScores: {},
    unlockedLevels: ["old-city"],
    daily: {},
    campaign: initialCampaign(),
    stats: defaultStats(),
    rewards: [],
    localBoard: [],
  };
}

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Defensive parse: corrupted or tampered storage never crashes the game. */
export function parseProfile(raw: string | null): Profile {
  const base = defaultProfile();
  if (!raw) return base;
  try {
    const p = JSON.parse(raw) as Partial<Profile>;
    if (!p || typeof p !== "object") return base;
    const s = (p.settings ?? {}) as Partial<Settings>;
    const settings: Settings = {
      music: Math.min(1, Math.max(0, num(s.music, base.settings.music))),
      sfx: Math.min(1, Math.max(0, num(s.sfx, base.settings.sfx))),
      muted: bool(s.muted, false),
      reducedMotion: bool(s.reducedMotion, false),
      relaxed: bool(s.relaxed, false),
      briefings: bool(s.briefings, true),
      touchButtons: bool(s.touchButtons, false),
      highContrast: bool(s.highContrast, false),
      largeText: bool(s.largeText, false),
    };
    const outfits = (Array.isArray(p.unlockedOutfits) ? p.unlockedOutfits : []).filter((o): o is Outfit => o in OUTFITS);
    const campaign = initialCampaign();
    if (p.campaign && typeof p.campaign === "object") {
      for (const c of CHAPTERS) {
        const saved = (p.campaign as CampaignProgress)[c.id];
        if (saved && typeof saved === "object") {
          campaign[c.id] = {
            status: ["locked", "available", "completed", "failed"].includes(saved.status) ? saved.status : campaign[c.id].status,
            missions: { ...campaign[c.id].missions, ...(saved.missions ?? {}) },
            bestScore: num(saved.bestScore, 0),
            attempts: num(saved.attempts, 0),
          };
        }
      }
    }
    const stats = { ...defaultStats(), ...(p.stats ?? {}) } as Stats;
    stats.byMission = { ...defaultStats().byMission, ...(p.stats?.byMission ?? {}) };
    return {
      version: 1,
      savedAt: num(p.savedAt, 0),
      playerName: typeof p.playerName === "string" ? p.playerName.slice(0, 16) : "",
      outfit: p.outfit && outfits.includes(p.outfit) ? p.outfit : "classic",
      unlockedOutfits: outfits.length ? Array.from(new Set<Outfit>(["classic", ...outfits])) : ["classic"],
      settings,
      highScores: Object.fromEntries(Object.entries(p.highScores ?? {}).filter(([k, v]) => isLevelId(k) && typeof v === "number")),
      unlockedLevels: Array.from(new Set<LevelId>(["old-city", ...((p.unlockedLevels ?? []).filter(isLevelId) as LevelId[])])),
      daily: Object.fromEntries(Object.entries(p.daily ?? {}).filter(([, v]) => typeof v === "number")),
      campaign,
      stats,
      rewards: Array.isArray(p.rewards) ? p.rewards.filter((r) => typeof r === "string").slice(0, 50) : [],
      localBoard: Array.isArray(p.localBoard) ? p.localBoard.slice(0, 30) : [],
    };
  } catch {
    return base;
  }
}

// ─────────────── tiny external store ───────────────
let current: Profile | null = null;
const listeners = new Set<() => void>();

function read(): Profile {
  if (current) return current;
  if (typeof window === "undefined") return defaultProfile();
  try {
    current = parseProfile(window.localStorage.getItem(KEY));
  } catch {
    current = defaultProfile();
  }
  return current;
}

const SERVER_PROFILE = defaultProfile();

export function getProfile(): Profile {
  return read();
}

export function updateProfile(fn: (p: Profile) => Profile | void) {
  const draft = structuredClone(read());
  const next = fn(draft) ?? draft;
  next.savedAt = Date.now();
  current = next;
  const json = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, json);
  } catch {
    /* storage full / private mode – progress stays in memory for this session */
  }
  void mirrorSave(json);
  listeners.forEach((l) => l());
}

/** On app start, restore the newest save from native storage (iOS may evict WebView storage). */
export async function hydrateFromNative() {
  const raw = await readNativeSave();
  if (!raw) return;
  const nativeProfile = parseProfile(raw);
  if (nativeProfile.savedAt > read().savedAt) {
    current = nativeProfile;
    try {
      window.localStorage.setItem(KEY, raw);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }
}

export function resetProfile() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  current = defaultProfile();
  listeners.forEach((l) => l());
}

export function useProfile(): Profile {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => SERVER_PROFILE,
  );
}

// ─────────────── run results ───────────────
export interface RunResult {
  mode: GameMode;
  level: LevelId;
  chapterId?: string;
  dailyDate?: string;
  score: number;
  coins: number;
  distance: number;
  durationSec: number;
  endReason: EndReason;
  missionLog: { id: MissionId; status: MissionStatus }[];
  campaignStatus: Partial<Record<MissionId, MissionStatus>> | null;
  campaignSuccess: boolean;
  bossesDefeated: number;
  fcWins: number;
  fcAttempts: number;
  approval: number;
  power: number;
  rewards: string[];
}

export interface RecordOutcome {
  newHighScore: boolean;
  unlockedLevels: LevelId[];
  unlockedOutfits: Outfit[];
}

export function recordRun(r: RunResult): RecordOutcome {
  const out: RecordOutcome = { newHighScore: false, unlockedLevels: [], unlockedOutfits: [] };
  updateProfile((p) => {
    const s = p.stats;
    s.runs++;
    s.totalCoins += r.coins;
    s.totalDistance += Math.round(r.distance);
    s.playSeconds += Math.round(r.durationSec);
    s.bossesDefeated += r.bossesDefeated;
    s.fcWins += r.fcWins;
    s.fcLosses += r.endReason === "noConfidence" ? 1 : 0;
    s.cmLost += r.endReason === "noConfidence" || r.endReason === "powerZero" ? 1 : 0;
    s.bestApproval = Math.max(s.bestApproval, Math.round(r.approval));
    for (const m of r.missionLog) {
      if (m.status === "completed") {
        s.missionsCompleted++;
        s.byMission[m.id].completed++;
      } else if (m.status === "failed") {
        s.missionsFailed++;
        s.byMission[m.id].failed++;
      }
    }
    if (r.mode === "endless") {
      const prev = p.highScores[r.level] ?? 0;
      if (r.score > prev) {
        p.highScores[r.level] = r.score;
        out.newHighScore = true;
      }
      const lvl = LEVELS.find((l) => l.id === r.level)!;
      const next = LEVELS[lvl.index + 1];
      if (next && r.score >= lvl.unlockNextScore && !p.unlockedLevels.includes(next.id)) {
        p.unlockedLevels.push(next.id);
        out.unlockedLevels.push(next.id);
      }
    }
    if (r.mode === "daily" && r.dailyDate) {
      if (r.score > (p.daily[r.dailyDate] ?? 0)) {
        p.daily[r.dailyDate] = r.score;
        out.newHighScore = true;
      }
      // keep the last 30 days only
      const keys = Object.keys(p.daily).sort().reverse();
      for (const k of keys.slice(30)) delete p.daily[k];
    }
    if (r.mode === "campaign" && r.chapterId) {
      const success = r.endReason === "campaignComplete" && r.campaignSuccess;
      p.campaign = applyChapterResult(p.campaign, r.chapterId, {
        success,
        missions: r.campaignStatus ?? {},
        score: r.score,
      });
      // campaign chapters also unlock their endless level
      const ch = CHAPTERS.find((c) => c.id === r.chapterId);
      const nextCh = ch ? CHAPTERS[ch.index + 1] : undefined;
      if (success && nextCh && !p.unlockedLevels.includes(nextCh.level)) {
        p.unlockedLevels.push(nextCh.level);
        out.unlockedLevels.push(nextCh.level);
      }
    }
    // outfit unlocks
    const unlock = (o: Outfit) => {
      if (!p.unlockedOutfits.includes(o)) {
        p.unlockedOutfits.push(o);
        out.unlockedOutfits.push(o);
      }
    };
    if (s.fcWins > 0) unlock("golden");
    if (s.bossesDefeated >= 3) unlock("festive");
    if (p.campaign["water-emergency"]?.status === "completed") unlock("monsoon");
    for (const rw of r.rewards) if (!p.rewards.includes(rw)) p.rewards.push(rw);

    if (r.score > 0) {
      p.localBoard.push({ name: p.playerName || "Chitti Fan", score: r.score, level: r.level, mode: r.mode, date: new Date().toISOString() });
      p.localBoard.sort((a, b) => b.score - a.score);
      p.localBoard = p.localBoard.slice(0, 20);
    }
  });
  return out;
}
