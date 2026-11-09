import { describe, expect, it } from "vitest";
import { validateRunSummary, type RunSummary } from "@/game/logic/scoring";
import { dailyChallengeFor } from "@/game/logic/daily";
import { applyChapterResult, initialCampaign } from "@/game/logic/campaign";

const ok: RunSummary = {
  score: 9000,
  distance: 2000,
  coins: 150,
  durationSec: 120,
  missionsCompleted: 1,
  bossesDefeated: 0,
  finalChallengesWon: 0,
  checkpoints: [
    [10, 150, 400],
    [60, 1000, 4000],
    [120, 2000, 9000],
  ],
};

describe("score plausibility validation", () => {
  it("accepts a plausible run", () => expect(validateRunSummary(ok)).toEqual({ ok: true }));
  it("rejects impossible distance", () => expect(validateRunSummary({ ...ok, distance: 100000 }).reason).toBe("distance-too-high"));
  it("rejects arbitrary scores", () => expect(validateRunSummary({ ...ok, score: 99_999_999 }).ok).toBe(false));
  it("rejects too many missions", () => expect(validateRunSummary({ ...ok, missionsCompleted: 99 }).reason).toBe("missions-too-high"));
  it("rejects bad types", () => expect(validateRunSummary({ ...ok, coins: -1 }).ok).toBe(false));
  it("rejects non-monotonic checkpoints", () =>
    expect(validateRunSummary({ ...ok, checkpoints: [[10, 150, 400], [20, 100, 500]] }).reason).toBe("non-monotonic-checkpoints"));
  it("rejects score spikes between checkpoints", () =>
    expect(validateRunSummary({ ...ok, score: 20000, checkpoints: [[10, 150, 400], [11, 170, 20000]] }).reason).toBe("checkpoint-score-spike"));
});

describe("daily challenge", () => {
  it("is deterministic per date and varies across dates", () => {
    expect(dailyChallengeFor("2026-11-09")).toEqual(dailyChallengeFor("2026-11-09"));
    const set = new Set(Array.from({ length: 20 }, (_, i) => dailyChallengeFor(`2026-12-${String(i + 1).padStart(2, "0")}`).seed));
    expect(set.size).toBe(20);
  });
});

describe("campaign progress", () => {
  it("unlocks the next chapter on success and keeps best mission states", () => {
    let p = initialCampaign();
    p = applyChapterResult(p, "first-100-days", { success: false, missions: { employment: "completed", road: "failed" }, score: 100 });
    expect(p["first-100-days"].status).toBe("failed");
    expect(p["infrastructure-challenge"].status).toBe("locked");
    p = applyChapterResult(p, "first-100-days", { success: true, missions: { employment: "failed", road: "completed", publicService: "completed" }, score: 50 });
    expect(p["first-100-days"].status).toBe("completed");
    expect(p["first-100-days"].missions.employment).toBe("completed");
    expect(p["first-100-days"].bestScore).toBe(100);
    expect(p["infrastructure-challenge"].status).toBe("available");
  });
});
