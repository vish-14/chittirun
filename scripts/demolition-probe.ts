import { RunSim } from "../src/game/logic/sim";
import { autopilot } from "../src/game/logic/autopilot";
import { LEVELS } from "../src/game/logic/levels";
for (const skill of [1, 0.4]) {
  let stopped = 0, done = 0;
  for (const L of LEVELS) for (let seed = 1; seed <= 6; seed++) {
    const sim = new RunSim({ level: L.id, mode: "endless", seed });
    while (sim.phase !== "over" && sim.t < 400) { autopilot(sim, skill); sim.update(1 / 60); sim.drainEvents(); }
    stopped += sim.demolitionsStopped; done += sim.buildingsDemolished;
  }
  console.log(`skill ${skill}: stopped ${stopped}, demolished ${done}`);
}
