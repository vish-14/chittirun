import { RunSim } from "../src/game/logic/sim";
import { autopilot } from "../src/game/logic/autopilot";
import { LEVELS } from "../src/game/logic/levels";

const skill = Number(process.argv[2] ?? 1);
for (const L of LEVELS) {
  const rows: string[] = [];
  for (let seed = 1; seed <= 6; seed++) {
    const sim = new RunSim({ level: L.id, mode: "endless", seed });
    let steps = 0;
    const stages = new Set<string>();
    while (sim.phase !== "over" && sim.t < 600 && steps < 400000) {
      autopilot(sim, skill);
      sim.update(1 / 60);
      for (const e of sim.drainEvents()) if (e.type === "stageChange") stages.add(e.to);
      steps++;
    }
    rows.push(`seed${seed}: t=${sim.t.toFixed(0)} end=${sim.endReason} score=${Math.round(sim.score)} coins=${sim.coins} hits=${sim.collisions} M+${sim.missionsCompleted}/-${sim.missionsFailed} boss=${sim.bossesDefeated} fc=${sim.fcWins}/${sim.fcAttempts} pow=${sim.gov.power.toFixed(0)} appr=${sim.gov.approval.toFixed(0)} [${[...stages].join(",")}] fails=${sim.missionLog.filter(m=>m.status==="failed").map(m=>m.id).join(",")}`);
  }
  console.log(L.id + "\n  " + rows.join("\n  "));
}
