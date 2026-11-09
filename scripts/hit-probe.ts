import { RunSim } from "../src/game/logic/sim";
import { autopilot } from "../src/game/logic/autopilot";
const level = (process.argv[2] ?? "water") as any;
for (let seed = 1; seed <= 4; seed++) {
  const sim = new RunSim({ level, mode: "endless", seed });
  while (sim.phase !== "over" && sim.t < 300) {
    autopilot(sim, 1);
    const before = sim.entities.map((e) => ({ ...e }));
    sim.update(1 / 60);
    for (const e of sim.drainEvents()) if (e.type === "hit") {
      const near = before.filter((x) => x.type === "obstacle" && x.z < 25 && x.z > -3).map((x) => `${x.kind}@L${x.lane} z=${x.z.toFixed(1)}${x.hit?"H":""}`);
      console.log(`seed${seed} t=${sim.t.toFixed(1)} hit ${e.kind} player lane=${sim.player.lane} x=${sim.player.x.toFixed(2)} y=${sim.player.y.toFixed(2)} slide=${sim.player.slideT.toFixed(2)} spd=${sim.speed.toFixed(1)} | ${near.join(" ")}`);
    }
  }
}
