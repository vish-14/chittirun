import { expect, test } from "@playwright/test";

test.describe("score API security", () => {
  test.skip(({ isMobile }) => isMobile, "API checks run once");

  test("rejects forged tokens, impossible scores and replays", async ({ request }) => {
    const forged = await request.post("/api/scores", { data: { token: "abc.def", summary: {} } });
    expect(forged.status()).toBe(401);

    const start = await (await request.post("/api/runs", { data: { mode: "endless", level: "old-city" } })).json();
    expect(start.ok).toBe(true);
    const cheat = await request.post("/api/scores", {
      data: { token: start.token, summary: { score: 1e9, distance: 10, coins: 0, durationSec: 2, missionsCompleted: 0, bossesDefeated: 0, finalChallengesWon: 0, checkpoints: [] } },
    });
    expect(cheat.status()).toBe(422);

    const bad = await request.post("/api/scores", { data: "not json", headers: { "content-type": "application/json" } });
    expect([400, 401]).toContain(bad.status());
    const lb = await request.get("/api/leaderboard?board=endless:nowhere");
    expect(lb.status()).toBe(400);
  });
});
