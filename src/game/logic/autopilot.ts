import { OBSTACLES } from "./catalog";
import type { RunSim } from "./sim";
import type { Entity, ObstacleKind } from "./types";

const avoidOf = (e: Entity) => OBSTACLES[e.kind as ObstacleKind].avoid;

/**
 * A simple look-ahead bot. Used by automated tests to prove missions and the final
 * confidence challenge are achievable, and by the debug "demo" mode.
 * `skill` (0..1): lower skill ignores pickups and reacts later.
 */
export function autopilot(sim: RunSim, skill = 1) {
  if (sim.phase === "briefing") {
    sim.confirmBriefing();
    return;
  }
  if (sim.phase !== "running") return;
  const p = sim.player;
  const look = sim.speed * 1.1;
  const ahead = sim.entities.filter(
    (e) => e.z + e.length > -0.7 && e.z < look && !e.collected && !e.cleared && !e.hit,
  );
  const whistles = ahead.filter((e) => e.kind === "whistle");
  const obstacles = ahead.filter(
    (e) =>
      e.type === "obstacle" &&
      !e.fixed &&
      !e.resolved &&
      !(e.kind === "jam" && whistles.some((w) => w.lane === e.lane && w.z < e.z)),
  );
  const invincible = (sim.powerups.metro ?? 0) > 0 || sim.isFlying;
  const tta = (o: Entity) => o.z / (sim.speed + o.vz); // time to arrival

  // 1) vertical actions for the lane we are heading into
  if (!invincible) {
    const next = obstacles
      .filter((o) => o.lane === p.lane && o.z + o.length > -0.6 && avoidOf(o) !== "lane")
      .sort((a, b) => a.z - b.z)[0];
    if (next) {
      const avoid = avoidOf(next);
      const t = tta(next);
      if (avoid === "jump" && t < 0.2 && p.jumpT < 0) sim.jump();
      else if ((avoid === "slide" || avoid === "jumpOrSlide") && t < 0.2 && p.slideT < 0) sim.slide();
    }
  }
  if (p.x !== p.lane) return;

  const blockedWithin = (lane: number, seconds: number) =>
    obstacles.some((o) => o.lane === lane && avoidOf(o) === "lane" && tta(o) < seconds && o.z + o.length > -0.8);
  const anyWithin = (lane: number, seconds: number) =>
    obstacles.some((o) => o.lane === lane && tta(o) < seconds && o.z + o.length > -0.8);
  const safeToEnter = (lane: number) =>
    lane >= 0 && lane <= 2 && !blockedWithin(lane, 0.75 + 0.2 * skill) && !anyWithin(lane, 0.22);

  if (!invincible && blockedWithin(p.lane, 0.55 + 0.35 * skill)) {
    const options = [p.lane - 1, p.lane + 1].filter(safeToEnter);
    if (options.length) {
      const best = options.sort((a, b) => laneValue(sim, ahead, b) - laneValue(sim, ahead, a))[0];
      return best < p.lane ? sim.moveLeft() : sim.moveRight();
    }
    const far = p.lane === 0 ? 2 : p.lane === 2 ? 0 : -1;
    if (far >= 0 && !blockedWithin(1, 0.3) && safeToEnter(far)) return far < p.lane ? sim.moveLeft() : sim.moveRight();
    return;
  }
  if (skill < 0.5) return;
  const values = [0, 1, 2].map((l) => laneValue(sim, ahead, l));
  const target = values.indexOf(Math.max(...values));
  if (target !== p.lane && values[target] > values[p.lane] + 0.5) {
    const step = target < p.lane ? p.lane - 1 : p.lane + 1;
    if (invincible ? !blockedWithin(step, 0.1) || invincible : safeToEnter(step)) {
      return step < p.lane ? sim.moveLeft() : sim.moveRight();
    }
  }
}

function laneValue(sim: RunSim, ahead: Entity[], lane: number) {
  let v = 0;
  const fcNeeds = (id: string) => !!sim.fc?.objectives.some((o) => o.def.id === id && !o.done);
  const wantPotholes = sim.mission?.id === "road" || fcNeeds("potholes");
  const wantJumps = fcNeeds("jumps");
  for (const e of ahead) {
    if (e.lane !== lane) continue;
    const near = 1 + Math.max(0, 20 - e.z) / 20;
    if (e.type === "token") v += 6 * near;
    else if (e.type === "powerup") v += 3 * near;
    else if (e.type === "coin" && e.height < 0.5) v += 0.4 * near;
    else if (e.type === "obstacle" && e.kind === "pothole" && !e.fixed) v += wantPotholes ? 5 * near : -0.5;
    else if (e.type === "obstacle" && avoidOf(e) === "lane" && e.kind !== "jam") v -= 4 * near;
    else if (e.type === "obstacle" && wantJumps && avoidOf(e) === "jump") v += 3 * near;
    else if (e.type === "obstacle") v -= 0.6 * near;
  }
  return v;
}
