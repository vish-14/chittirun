import type { RunSummary } from "@/game/logic/scoring";
import type { GameMode, LevelId } from "@/game/logic/types";

export interface StartedRun {
  runId: string;
  token: string;
  board: string;
}

async function post<T>(url: string, body: unknown, timeoutMs = 6000): Promise<T | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const json = (await r.json().catch(() => null)) as T | null;
    return json;
  } catch {
    return null; // offline – the game keeps working with local scores
  } finally {
    clearTimeout(t);
  }
}

export async function startServerRun(mode: GameMode, level: LevelId, extra: { chapterId?: string; dailyDate?: string }) {
  const r = await post<{ ok: boolean } & StartedRun>("/api/runs", { mode, level, ...extra });
  return r?.ok ? r : null;
}

export async function submitServerScore(token: string, name: string, summary: RunSummary) {
  return post<{ ok: boolean; rank?: number; reason?: string }>("/api/scores", { token, name, summary });
}

export interface BoardEntry {
  rank: number;
  name: string;
  score: number;
  at: string;
}

export async function fetchLeaderboard(board: string): Promise<BoardEntry[] | null> {
  try {
    const r = await fetch(`/api/leaderboard?board=${encodeURIComponent(board)}&limit=20`, { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { entries?: BoardEntry[] };
    return j.entries ?? [];
  } catch {
    return null;
  }
}
