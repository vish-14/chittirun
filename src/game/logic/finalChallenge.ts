import type { Rng } from "./rng";
import type { FcObjectiveId, TokenKind } from "./types";
import type { ProgressEvent } from "./missions";

export interface FcObjectiveDef {
  id: FcObjectiveId;
  label: (n: number) => string;
  event: ProgressEvent;
  base: number;
  supply: TokenKind | "pothole" | "jam" | null;
  /** resets on collision */
  streak?: boolean;
}

export const FC_OBJECTIVES: FcObjectiveDef[] = [
  { id: "coins", label: (n) => `Collect ${n} coins`, event: "coin", base: 30, supply: null },
  { id: "jobs", label: (n) => `Create ${n} jobs`, event: "job", base: 6, supply: "job" },
  { id: "potholes", label: (n) => `Fix ${n} potholes`, event: "pothole", base: 3, supply: "pothole" },
  { id: "services", label: (n) => `Deliver ${n} public services`, event: "service", base: 3, supply: "service" },
  { id: "tankers", label: (n) => `Deliver ${n} water tankers`, event: "tanker", base: 2, supply: "tankerToken" },
  { id: "jams", label: (n) => `Clear ${n} traffic jams`, event: "jam", base: 2, supply: "jam" },
  { id: "dodges", label: (n) => `Pass ${n} obstacles without a collision`, event: "dodge", base: 14, supply: null, streak: true },
  { id: "jumps", label: (n) => `Jump over ${n} obstacles`, event: "jump", base: 4, supply: null },
];

export interface FcObjective {
  def: FcObjectiveDef;
  target: number;
  progress: number;
  done: boolean;
}

export const FC_TIME_LIMIT = 60;

export class FinalChallenge {
  objectives: FcObjective[];
  timeLimit: number;
  timeLeft: number;
  status: "active" | "won" | "lost" = "active";

  constructor(rng: Rng, attempt: number, relaxed = false) {
    const pool = rng.shuffle([...FC_OBJECTIVES]);
    // At most one "skill" objective (dodges/jumps/coins) so the challenge stays achievable.
    const picked: FcObjectiveDef[] = [];
    let skill = 0;
    for (const d of pool) {
      const isSkill = d.supply === null;
      if (isSkill && skill >= 1) continue;
      picked.push(d);
      if (isSkill) skill++;
      if (picked.length === 3) break;
    }
    const scale = 1 + 0.2 * Math.max(0, attempt - 1);
    this.objectives = picked.map((def) => ({ def, target: Math.round(def.base * scale), progress: 0, done: false }));
    this.timeLimit = FC_TIME_LIMIT * (relaxed ? 1.25 : 1);
    this.timeLeft = this.timeLimit;
  }

  record(ev: ProgressEvent, amount = 1): boolean {
    if (this.status !== "active") return false;
    let changed = false;
    for (const o of this.objectives) {
      if (!o.done && o.def.event === ev) {
        o.progress = Math.min(o.target, o.progress + amount);
        if (o.progress >= o.target) o.done = true;
        changed = true;
      }
    }
    if (this.objectives.every((o) => o.done)) this.status = "won";
    return changed;
  }

  onCollision(): void {
    for (const o of this.objectives) if (o.def.streak && !o.done) o.progress = 0;
  }

  tick(dt: number): "none" | "won" | "lost" {
    if (this.status !== "active") return "none";
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      this.status = "lost";
      return "lost";
    }
    return "none";
  }

  get supplies(): (TokenKind | "pothole" | "jam")[] {
    return this.objectives.filter((o) => !o.done && o.def.supply).map((o) => o.def.supply!) ;
  }
}
