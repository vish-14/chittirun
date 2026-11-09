import crypto from "node:crypto";
import { CHAPTERS } from "@/game/logic/campaign";
import { MAX_RUN_SECONDS } from "@/game/logic/constants";
import { dailyChallengeFor, utcDateKey } from "@/game/logic/daily";
import { isLevelId } from "@/game/logic/levels";
import { validateRunSummary, type RunSummary } from "@/game/logic/scoring";
import type { GameMode, LevelId } from "@/game/logic/types";
import { runTokenSecret } from "./config";
import { sanitizeName } from "./names";
import { clientKey, rateLimit } from "./rateLimit";
import { getStore } from "./store";
import { signRunToken, verifyRunToken } from "./token";

/**
 * Framework-agnostic API handlers. Used by Next.js route handlers (Amplify Hosting runs these
 * on AWS Lambda-backed compute) and can be wrapped by a standalone Lambda (infra/lambda).
 */
export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

const err = (status: number, reason: string): ApiResult => ({ status, body: { ok: false, reason } });

function log(event: string, data: Record<string, unknown>) {
  // Structured JSON logs → CloudWatch Logs Insights friendly
  console.log(JSON.stringify({ svc: "chitti-run-api", event, ...data }));
}

export function boardFor(mode: GameMode, level: LevelId, extra?: { chapterId?: string; dailyDate?: string }): string | null {
  if (mode === "endless") return `endless:${level}`;
  if (mode === "daily") {
    const d = extra?.dailyDate;
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const today = utcDateKey();
    const yesterday = utcDateKey(new Date(Date.now() - 86400000));
    if (d !== today && d !== yesterday) return null;
    return `daily:${d}`;
  }
  if (mode === "campaign") {
    const ch = CHAPTERS.find((c) => c.id === extra?.chapterId);
    return ch ? `campaign:${ch.id}` : null;
  }
  return null;
}

export function isValidBoard(board: unknown): board is string {
  if (typeof board !== "string" || board.length > 64) return false;
  const [kind, id] = board.split(":");
  if (kind === "endless") return isLevelId(id);
  if (kind === "daily") return /^\d{4}-\d{2}-\d{2}$/.test(id ?? "");
  if (kind === "campaign") return CHAPTERS.some((c) => c.id === id);
  return false;
}

export async function startRun(body: unknown, headers: Headers): Promise<ApiResult> {
  if (!rateLimit(`start:${clientKey(headers)}`, 20, 0.2)) return err(429, "rate-limited");
  const secret = runTokenSecret();
  if (!secret) return err(503, "server-not-configured");
  const b = (body ?? {}) as Record<string, unknown>;
  const mode = b.mode as GameMode;
  if (!["endless", "daily", "campaign"].includes(mode)) return err(400, "bad-mode");
  let level = b.level as LevelId;
  if (mode === "daily" && typeof b.dailyDate === "string") level = dailyChallengeFor(b.dailyDate).level;
  if (mode === "campaign") level = CHAPTERS.find((c) => c.id === b.chapterId)?.level ?? level;
  if (!isLevelId(level)) return err(400, "bad-level");
  const board = boardFor(mode, level, { chapterId: b.chapterId as string, dailyDate: b.dailyDate as string });
  if (!board) return err(400, "bad-board");
  const rid = crypto.randomUUID();
  const token = signRunToken({ v: 1, rid, iat: Date.now(), mode, level, board }, secret);
  log("run.start", { rid, board });
  return { status: 200, body: { ok: true, runId: rid, token, board } };
}

export async function submitScore(body: unknown, headers: Headers): Promise<ApiResult> {
  if (!rateLimit(`submit:${clientKey(headers)}`, 10, 0.1)) return err(429, "rate-limited");
  const secret = runTokenSecret();
  if (!secret) return err(503, "server-not-configured");
  const b = (body ?? {}) as Record<string, unknown>;
  const payload = verifyRunToken(b.token, secret);
  if (!payload) return err(401, "invalid-token");
  const ageSec = (Date.now() - payload.iat) / 1000;
  if (ageSec > MAX_RUN_SECONDS + 600) return err(401, "token-expired");

  const s = b.summary as RunSummary | undefined;
  if (!s || typeof s !== "object") return err(400, "missing-summary");
  const v = validateRunSummary(s);
  if (!v.ok) {
    log("score.rejected", { rid: payload.rid, reason: v.reason, score: s.score });
    return err(422, v.reason ?? "invalid-summary");
  }
  // Wall-clock check: real time elapsed since the server issued the token must cover the play time.
  if (ageSec < s.durationSec * 0.97 - 3) {
    log("score.rejected", { rid: payload.rid, reason: "too-fast", ageSec, duration: s.durationSec });
    return err(422, "duration-mismatch");
  }
  const store = await getStore();
  const fresh = await store.claimRun(payload.rid, MAX_RUN_SECONDS + 3600);
  if (!fresh) return err(409, "run-already-submitted");

  const name = sanitizeName(b.name);
  const score = Math.floor(s.score);
  await store.putScore({ board: payload.board, name, score, runId: payload.rid, level: payload.level, at: new Date().toISOString() });
  const rank = await store.rankOf(payload.board, score);
  log("score.accepted", { rid: payload.rid, board: payload.board, score, rank });
  return { status: 200, body: { ok: true, rank, board: payload.board } };
}

export async function leaderboard(params: URLSearchParams, headers: Headers): Promise<ApiResult> {
  if (!rateLimit(`lb:${clientKey(headers)}`, 60, 1)) return err(429, "rate-limited");
  const board = params.get("board");
  if (!isValidBoard(board)) return err(400, "bad-board");
  const limit = Math.min(50, Math.max(1, Number(params.get("limit") ?? 20) || 20));
  const store = await getStore();
  const rows = await store.top(board, limit);
  return {
    status: 200,
    body: { ok: true, board, entries: rows.map((r, i) => ({ rank: i + 1, name: r.name, score: r.score, at: r.at })) },
  };
}
