import { describe, expect, it } from "vitest";
import { GOV_RULES, Governance, stageForPower } from "@/game/logic/governance";

describe("governance stages", () => {
  it("maps power to the documented stages", () => {
    expect(stageForPower(100)).toBe("control");
    expect(stageForPower(70)).toBe("control");
    expect(stageForPower(69.9)).toBe("pressure");
    expect(stageForPower(40)).toBe("pressure");
    expect(stageForPower(39)).toBe("crisis");
    expect(stageForPower(15)).toBe("crisis");
    expect(stageForPower(14.9)).toBe("final");
    expect(stageForPower(0.1)).toBe("final");
    expect(stageForPower(0)).toBe("lost");
  });

  it("clamps values and reports stage changes", () => {
    const g = new Governance(75, 50);
    expect(g.adjust(-10, 0)).toEqual({ from: "control", to: "pressure" });
    expect(g.adjust(0, 500)).toBeNull();
    expect(g.approval).toBe(100);
    g.adjust(-1000, -1000);
    expect(g.power).toBe(0);
    expect(g.stage).toBe("lost");
  });

  it("drains power passively, faster with low approval, and freezes when asked", () => {
    const a = new Governance(100, 60);
    const b = new Governance(100, 20);
    a.tick(10, false);
    b.tick(10, false);
    expect(a.power).toBeCloseTo(100 - GOV_RULES.passivePowerDecay * 10);
    expect(b.power).toBeLessThan(a.power);
    const c = new Governance(50, 50);
    c.tick(100, true);
    expect(c.power).toBe(50);
  });

  it("turns coins into approval", () => {
    const g = new Governance(100, 50);
    g.addCoins(GOV_RULES.coinsPerApprovalPoint * 3);
    expect(g.approval).toBe(53);
  });
});
