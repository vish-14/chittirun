import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { leaderboard, startRun, submitScore } from "@/server/handlers";
import { signRunToken, verifyRunToken } from "@/server/token";
import { sanitizeName } from "@/server/names";
import { __setStore } from "@/server/store";

const SECRET = "x".repeat(40);
let ip = 0;
const headers = () => new Headers({ "x-forwarded-for": `10.0.0.${++ip}` });

beforeEach(() => {
  process.env.RUN_TOKEN_SECRET = SECRET;
  process.env.APP_STAGE = "development";
  __setStore(null);
});

describe("run tokens", () => {
  it("round-trips and rejects tampering", () => {
    const t = signRunToken({ v: 1, rid: "r1", iat: 1, mode: "endless", level: "old-city", board: "endless:old-city" }, SECRET);
    expect(verifyRunToken(t, SECRET)?.rid).toBe("r1");
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ v: 1, rid: "r1", iat: 1, mode: "endless", level: "old-city", board: "endless:secretariat" })).toString("base64url");
    expect(verifyRunToken(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifyRunToken(`${body}.${sig}`, "other-secret-other-secret-other-secret")).toBeNull();
    expect(verifyRunToken("garbage", SECRET)).toBeNull();
  });
});

describe("score API", () => {
  const summary = (durationSec: number, score: number) => ({
    score,
    distance: durationSec * 15,
    coins: 20,
    durationSec,
    missionsCompleted: 0,
    bossesDefeated: 0,
    finalChallengesWon: 0,
    checkpoints: [],
  });

  it("refuses to run without a secret outside development", async () => {
    delete process.env.RUN_TOKEN_SECRET;
    process.env.APP_STAGE = "production";
    const r = await startRun({ mode: "endless", level: "old-city" }, headers());
    expect(r.status).toBe(503);
  });

  it("accepts a valid run once, then rejects the replay", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
    const s = await startRun({ mode: "endless", level: "traffic" }, headers());
    expect(s.status).toBe(200);
    vi.setSystemTime(new Date("2026-11-09T10:01:05Z"));
    const r1 = await submitScore({ token: s.body.token, name: "Ravi<script>", summary: summary(60, 1200) }, headers());
    expect(r1.status).toBe(200);
    expect(r1.body.rank).toBe(1);
    const r2 = await submitScore({ token: s.body.token, name: "Ravi", summary: summary(60, 1200) }, headers());
    expect(r2.status).toBe(409);
    const lb = await leaderboard(new URLSearchParams({ board: "endless:traffic" }), headers());
    expect(lb.body.entries).toEqual([expect.objectContaining({ name: "Raviscript", score: 1200, rank: 1 })]);
    vi.useRealTimers();
  });

  it("rejects a run submitted faster than it could have been played", async () => {
    const s = await startRun({ mode: "endless", level: "traffic" }, headers());
    const r = await submitScore({ token: s.body.token, summary: summary(300, 3000) }, headers());
    expect(r.status).toBe(422);
    expect(r.body.reason).toBe("duration-mismatch");
  });

  it("rejects arbitrary scores and forged tokens", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
    const s = await startRun({ mode: "endless", level: "traffic" }, headers());
    vi.setSystemTime(new Date("2026-11-09T10:02:00Z"));
    const r = await submitScore({ token: s.body.token, summary: summary(60, 50_000_000) }, headers());
    expect(r.status).toBe(422);
    const f = await submitScore({ token: "abc.def", summary: summary(60, 100) }, headers());
    expect(f.status).toBe(401);
    vi.useRealTimers();
  });

  it("validates boards", async () => {
    expect((await leaderboard(new URLSearchParams({ board: "endless:mars" }), headers())).status).toBe(400);
    expect((await startRun({ mode: "daily", level: "old-city", dailyDate: "1999-01-01" }, headers())).status).toBe(400);
  });

  it("rate limits bursts", async () => {
    const h = new Headers({ "x-forwarded-for": "9.9.9.9" });
    const codes = [];
    for (let i = 0; i < 25; i++) codes.push((await startRun({ mode: "endless", level: "old-city" }, h)).status);
    expect(codes).toContain(429);
  });
});

describe("name sanitising", () => {
  it("strips markup, limits length and filters profanity", () => {
    expect(sanitizeName("<b>Chitti</b>")).toBe("bChittib");
    expect(sanitizeName("a".repeat(40)).length).toBe(16);
    expect(sanitizeName("  ")).toBe("Chitti Fan");
    expect(sanitizeName(42)).toBe("Chitti Fan");
  });
});
