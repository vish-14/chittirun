import { RunSim } from "../src/game/logic/sim";
import { autopilot } from "../src/game/logic/autopilot";
import { LEVELS } from "../src/game/logic/levels";
for (const skill of [1, 0.4]) {
  let won = 0, lost = 0;
  const objs: Record<string, [number, number]> = {};
  for (const L of LEVELS) for (let seed = 1; seed <= 10; seed++) {
    const sim = new RunSim({ level: L.id, mode: "endless", seed, briefings: true });
    let forced = false;
    while (sim.phase !== "over" && sim.t < 200) {
      if (!forced && sim.t > 20) { sim.gov.adjust(-(sim.gov.power - 14), 0); forced = true; (sim as any).checkGovernanceThresholds(); }
      const fc = sim.fc;
      autopilot(sim, skill);
      sim.update(1 / 60);
      for (const e of sim.drainEvents()) {
        if (e.type === "fcWon") { won++; fc!.objectives.forEach(o => { objs[o.def.id] ??= [0,0]; objs[o.def.id][0]++; }); }
        if (e.type === "fcLost") { lost++; fc!.objectives.forEach(o => { objs[o.def.id] ??= [0,0]; if(!o.done) objs[o.def.id][1]++; }); }
      }
      if (forced && !sim.fc && !sim.pendingFc) break;
    }
  }
  console.log(`skill ${skill}: FC won ${won} lost ${lost}`, JSON.stringify(objs));
}
