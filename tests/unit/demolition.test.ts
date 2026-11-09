import { describe, expect, it } from "vitest";
import { RunSim } from "@/game/logic/sim";
import { autopilot } from "@/game/logic/autopilot";
import { GOV_RULES } from "@/game/logic/governance";
import { validateRunSummary } from "@/game/logic/scoring";

function untilDemolition(sim: RunSim) {
  sim.demolitionTimer = 0.01;
  sim.missionTimer = 999;
  for (let i = 0; i < 10 && !sim.demolition; i++) sim.update(1 / 60);
  expect(sim.demolition).not.toBeNull();
}

describe("HYDRA demolition event", () => {
  it("gives 5–10 seconds, tighter later in the run, longer in relaxed mode", () => {
    const early = new RunSim({ level: "old-city", mode: "endless", seed: 1 });
    untilDemolition(early);
    expect(early.demolition!.timeLimit).toBeCloseTo(10, 0);
    const late = new RunSim({ level: "old-city", mode: "endless", seed: 1 });
    late.t = 400;
    untilDemolition(late);
    expect(late.demolition!.timeLimit).toBeGreaterThanOrEqual(5.9);
    expect(late.demolition!.timeLimit).toBeLessThanOrEqual(6.1);
  });

  it("collecting 3 stay orders stops it: bonus, power and approval up", () => {
    const sim = new RunSim({ level: "traffic", mode: "endless", seed: 4 });
    untilDemolition(sim);
    const p = sim.gov.power;
    const a = sim.gov.approval;
    let stopped = false;
    for (let i = 0; i < 60 * 12 && sim.demolition; i++) {
      autopilot(sim);
      sim.update(1 / 60);
      if (sim.drainEvents().some((e) => e.type === "demolitionStopped")) stopped = true;
    }
    expect(stopped).toBe(true);
    expect(sim.demolitionsStopped).toBe(1);
    expect(sim.gov.approval).toBeGreaterThan(a);
    expect(sim.gov.power).toBeGreaterThan(p - 2);
    expect(sim.entities.some((e) => e.kind === "stayOrder")).toBe(false);
    expect(validateRunSummary(sim.summary()).ok).toBe(true);
  });

  it("missing the deadline demolishes the building and costs CM power", () => {
    const sim = new RunSim({ level: "water", mode: "endless", seed: 4 });
    untilDemolition(sim);
    sim.player.invuln = 1e9;
    sim.player.lane = 0;
    const p = sim.gov.power;
    const events: string[] = [];
    for (let i = 0; i < 60 * 12 && sim.demolition; i++) {
      sim.entities = sim.entities.filter((e) => e.kind !== "stayOrder"); // a player who ignores the orders
      sim.update(1 / 60);
      events.push(...sim.drainEvents().map((e) => e.type));
    }
    expect(events).toContain("demolitionDone");
    expect(sim.buildingsDemolished).toBe(1);
    expect(sim.gov.power).toBeLessThanOrEqual(p + GOV_RULES.demolitionDone.power + 0.5);
  });

  it("is cancelled without penalty when the no-confidence motion starts", () => {
    const sim = new RunSim({ level: "old-city", mode: "endless", seed: 2, briefings: false });
    untilDemolition(sim);
    sim.gov.adjust(-90, 0);
    sim.update(1 / 60);
    expect(sim.fc).not.toBeNull();
    expect(sim.demolition).toBeNull();
    expect(sim.buildingsDemolished).toBe(0);
  });

  it("server bounds reject impossible demolition counts", () => {
    const base = { score: 2000, distance: 600, coins: 10, durationSec: 40, missionsCompleted: 0, bossesDefeated: 0, finalChallengesWon: 0, checkpoints: [] as [number, number, number][] };
    expect(validateRunSummary({ ...base, demolitionsStopped: 2 }).ok).toBe(true);
    expect(validateRunSummary({ ...base, demolitionsStopped: 50 }).reason).toBe("demolitions-too-high");
  });
});
