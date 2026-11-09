import { describe, expect, it } from "vitest";
import { RunSim } from "@/game/logic/sim";
import { autopilot } from "@/game/logic/autopilot";
import { LEVELS } from "@/game/logic/levels";
import { OBSTACLES } from "@/game/logic/catalog";
import { validateRunSummary } from "@/game/logic/scoring";
import type { ObstacleKind } from "@/game/logic/types";

const step = (sim: RunSim, seconds: number, bot = true) => {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n && sim.phase !== "over"; i++) {
    if (bot) autopilot(sim);
    sim.update(1 / 60);
  }
};

describe("run simulation", () => {
  it("is deterministic for a given seed", () => {
    const a = new RunSim({ level: "traffic", mode: "endless", seed: 42 });
    const b = new RunSim({ level: "traffic", mode: "endless", seed: 42 });
    step(a, 40);
    step(b, 40);
    expect(a.summary()).toEqual(b.summary());
  });

  it("handles lane changes, jump and slide", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 1, missionsEnabled: false });
    sim.moveLeft();
    sim.moveLeft(); // clamped
    expect(sim.player.lane).toBe(0);
    for (let i = 0; i < 10; i++) sim.update(0.02);
    expect(sim.player.x).toBe(0);
    sim.jump();
    for (let i = 0; i < 15; i++) sim.update(0.02);
    expect(sim.player.y).toBeGreaterThan(0.5);
    sim.slide(); // fast fall into a slide
    expect(sim.player.y).toBe(0);
    expect(sim.player.slideT).toBeGreaterThanOrEqual(0);
  });

  it("collisions cost a life and CM power; three hits end the run", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 3, missionsEnabled: false });
    const startPower = sim.gov.power;
    for (let i = 0; i < 3; i++) {
      sim.entities = [];
      sim.player.invuln = 0;
      sim.entities.push({ id: 900 + i, type: "obstacle", kind: "cow", lane: sim.player.lane, z: 0.3, vz: 0, length: 2, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 });
      sim.update(0.02);
    }
    expect(sim.lives).toBe(0);
    expect(sim.phase).toBe("over");
    expect(sim.endReason).toBe("lives");
    expect(sim.gov.power).toBeLessThan(startPower);
  });

  it("biryani shield absorbs a collision", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 3, missionsEnabled: false });
    sim.powerups.biryani = 10;
    sim.entities = [{ id: 1, type: "obstacle", kind: "auto", lane: 1, z: 0.2, vz: 0, length: 2, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }];
    sim.update(0.02);
    expect(sim.lives).toBe(3);
    expect(sim.powerups.biryani).toBeUndefined();
  });

  it("sliding over a pothole fixes it and counts for the road mission", () => {
    const sim = new RunSim({ level: "pothole", mode: "endless", seed: 9, briefings: false, firstMissionDelay: 0 });
    // force the road mission
    while (!sim.mission || sim.mission.id !== "road") {
      sim.mission = null;
      (sim as unknown as { missionBag: string[] }).missionBag = ["road"];
      sim.missionTimer = 0;
      sim.update(0.02);
    }
    sim.entities = [{ id: 1, type: "obstacle", kind: "pothole", lane: 1, z: 0.4, vz: 0, length: 1.4, height: 0, resolved: false, hit: false, collected: false, laneOffset: 0 }];
    sim.slide();
    sim.update(0.02);
    expect(sim.potholesFixed).toBe(1);
    expect(sim.mission.progress).toBe(1);
    expect(sim.lives).toBe(3);
  });

  it("never spawns a row that blocks all three lanes with lane-only obstacles", () => {
    for (const L of LEVELS) {
      const sim = new RunSim({ level: L.id, mode: "endless", seed: 7, missionsEnabled: false });
      sim.player.invuln = 1e9;
      for (let i = 0; i < 60 * 240; i++) {
        sim.update(1 / 60);
        const fresh = sim.entities.filter((e) => e.type === "obstacle" && e.z > 55 && e.z < 70 && e.kind !== "bossShot");
        const groups = new Map<number, Set<number>>();
        for (const e of fresh) {
          if (OBSTACLES[e.kind as ObstacleKind].avoid !== "lane") continue;
          const key = Math.round(e.z * (sim.speed / (sim.speed + e.vz)));
          if (!groups.has(key)) groups.set(key, new Set());
          groups.get(key)!.add(e.lane);
        }
        for (const lanes of groups.values()) expect(lanes.size).toBeLessThan(3);
      }
    }
  });

  it("a skilled player can survive and complete missions on every level", () => {
    for (const L of LEVELS) {
      const sim = new RunSim({ level: L.id, mode: "endless", seed: 11 });
      step(sim, 240);
      expect(sim.missionsCompleted, L.id).toBeGreaterThanOrEqual(3);
      expect(sim.phase, L.id).not.toBe("over");
      expect(validateRunSummary(sim.summary()).ok, L.id).toBe(true);
    }
  });

  it("failed missions reduce power and approval", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 5, briefings: false, firstMissionDelay: 0 });
    sim.update(0.02);
    expect(sim.mission).not.toBeNull();
    const before = { p: sim.gov.power, a: sim.gov.approval };
    const pen = sim.mission!.def.penalty;
    sim.mission!.timeLeft = 0.01;
    sim.entities = [];
    sim.update(0.02);
    expect(sim.missionsFailed).toBe(1);
    expect(sim.gov.power).toBeLessThanOrEqual(before.p - pen.power + 0.1);
    expect(sim.gov.approval).toBeLessThanOrEqual(before.a - pen.approval + 0.1);
  });

  it("bosses appear and can be defeated with petitions", () => {
    const sim = new RunSim({ level: "secretariat", mode: "endless", seed: 21, missionsEnabled: false });
    const events: string[] = [];
    for (let i = 0; i < 60 * 90 && sim.phase !== "over"; i++) {
      autopilot(sim);
      sim.update(1 / 60);
      for (const e of sim.drainEvents()) events.push(e.type);
    }
    expect(events).toContain("bossStart");
    expect(sim.bossesDefeated).toBeGreaterThanOrEqual(1);
  });
});

describe("final confidence challenge & CM position loss", () => {
  it("triggers below 15% power, pauses for a briefing with 3 objectives, and can be won", () => {
    const sim = new RunSim({ level: "water", mode: "endless", seed: 8 });
    step(sim, 10);
    sim.gov.adjust(-(sim.gov.power - 14), 0);
    sim.update(1 / 60);
    if (sim.phase === "briefing" && sim.pendingMission) {
      sim.confirmBriefing();
      sim.update(1 / 60);
    }
    expect(sim.phase).toBe("briefing");
    expect(sim.pendingFc?.objectives.length).toBe(3);
    const powerAtStart = sim.gov.power;
    sim.confirmBriefing();
    expect(sim.fc).not.toBeNull();
    let won = false;
    for (let i = 0; i < 60 * 70 && sim.phase !== "over"; i++) {
      autopilot(sim);
      sim.update(1 / 60);
      for (const e of sim.drainEvents()) if (e.type === "fcWon") won = true;
      if (won) break;
    }
    expect(won).toBe(true);
    expect(sim.gov.power).toBeGreaterThanOrEqual(powerAtStart + 30);
    expect(sim.rewardsUnlocked.length).toBe(1);
    expect(sim.phase).not.toBe("over");
  });

  it("losing the challenge removes CM status (noConfidence game over)", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 8, briefings: false });
    sim.gov.adjust(-90, 0);
    sim.update(1 / 60);
    expect(sim.fc).not.toBeNull();
    for (const o of sim.fc!.objectives) o.target = 999; // a player who ignores the objectives
    sim.player.invuln = 1e9;
    // a passive player that ignores objectives
    for (let i = 0; i < 60 * 80 && sim.phase !== "over"; i++) sim.update(1 / 60);
    expect(sim.phase).toBe("over");
    expect(sim.endReason).toBe("noConfidence");
    expect(sim.gov.power).toBe(0);
    expect(sim.gov.stage).toBe("lost");
  });

  it("power is frozen during the challenge", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 8, briefings: false });
    sim.gov.adjust(-88, 0);
    sim.update(1 / 60);
    const p = sim.gov.power;
    sim.player.invuln = 1e9;
    for (let i = 0; i < 60 * 10; i++) sim.update(1 / 60);
    expect(sim.gov.power).toBe(p);
  });
});

describe("campaign", () => {
  it("completes a chapter when every mission is done", () => {
    const sim = new RunSim({ level: "old-city", mode: "campaign", chapterId: "first-100-days", seed: 4 });
    step(sim, 600);
    expect(sim.endReason).toBe("campaignComplete");
    expect(sim.campaignSuccess).toBe(true);
    expect(Object.values(sim.campaignStatus).every((s) => s === "completed")).toBe(true);
  });

  it("gives a failed mission one second chance", () => {
    const sim = new RunSim({ level: "old-city", mode: "campaign", chapterId: "first-100-days", seed: 4, briefings: false, firstMissionDelay: 0 });
    sim.update(0.02);
    const id = sim.mission!.id;
    sim.mission!.timeLeft = 0.001;
    sim.update(0.02);
    expect(sim.campaignStatus[id]).toBe("pending");
    expect(sim.campaignQueue[sim.campaignQueue.length - 1]).toBe(id);
    expect(sim.phase).toBe("running");
  });

  it("the final chapter forces a confidence challenge", () => {
    const sim = new RunSim({ level: "secretariat", mode: "campaign", chapterId: "final-cm-survival", seed: 2 });
    expect(sim.gov.power).toBe(32);
    let sawFc = false;
    for (let i = 0; i < 60 * 900 && sim.phase !== "over"; i++) {
      autopilot(sim);
      sim.update(1 / 60);
      if (sim.pendingFc || sim.fc) sawFc = true;
    }
    expect(sawFc).toBe(true);
    expect(sim.endReason).toBe("campaignComplete");
    expect(sim.campaignSuccess).toBe(true);
  });
});
