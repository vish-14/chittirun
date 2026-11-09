import { describe, expect, it } from "vitest";
import { MISSIONS, MISSION_IDS, createMission, recordMissionEvent, tickMission } from "@/game/logic/missions";

describe("missions", () => {
  it("defines all seven governance missions with objectives, rewards and penalties", () => {
    expect(MISSION_IDS).toEqual(["road", "water", "traffic", "employment", "publicService", "infrastructure", "emergency"]);
    expect(MISSIONS.road.target).toBe(10);
    expect(MISSIONS.water.target).toBe(5);
    expect(MISSIONS.traffic.target).toBe(8);
    expect(MISSIONS.employment.target).toBe(20);
    expect(MISSIONS.publicService.target).toBe(5);
    expect(MISSIONS.infrastructure.target).toBe(3);
    expect(MISSIONS.emergency.emergency).toBe(true);
    for (const id of MISSION_IDS) {
      const m = MISSIONS[id];
      expect(m.instructions.length).toBeGreaterThan(0);
      expect(m.reward.score).toBeGreaterThan(0);
      expect(m.penalty.power).toBeGreaterThan(0);
      expect(m.timeLimit).toBeGreaterThan(0);
    }
  });

  it("counts progress only for its own event and completes at the target", () => {
    const m = createMission("water", 0);
    expect(recordMissionEvent(m, "job")).toBe("none");
    for (let i = 0; i < 4; i++) recordMissionEvent(m, "tanker");
    expect(m.progress).toBe(4);
    expect(recordMissionEvent(m, "tanker")).toBe("completed");
    expect(m.status).toBe("completed");
  });

  it("fails when the countdown expires", () => {
    const m = createMission("emergency", 0);
    expect(tickMission(m, m.timeLimit - 1)).toBe("none");
    expect(tickMission(m, 2)).toBe("failed");
    expect(m.status).toBe("failed");
  });

  it("scales difficulty progressively but fairly", () => {
    const a = createMission("employment", 0);
    const b = createMission("employment", 5);
    expect(b.target).toBeGreaterThan(a.target);
    expect(b.timeLimit).toBeGreaterThanOrEqual(Math.round(MISSIONS.employment.timeLimit * 0.8));
    expect(createMission("employment", 0, true).timeLimit).toBeGreaterThan(a.timeLimit);
  });
});
