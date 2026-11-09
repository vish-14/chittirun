import type { MissionId, MissionStatus, TokenKind } from "./types";

/** Progress events emitted by the run simulation. */
export type ProgressEvent =
  | "pothole"
  | "tanker"
  | "jam"
  | "job"
  | "service"
  | "project"
  | "siren"
  | "coin"
  | "dodge"
  | "jump";

export interface MissionDef {
  id: MissionId;
  title: string;
  icon: string;
  objective: (target: number) => string;
  instructions: string[];
  event: ProgressEvent;
  target: number;
  /** seconds */
  timeLimit: number;
  /** true for the special "timed emergency" type with a short fuse */
  emergency?: boolean;
  /** what the spawner should supply */
  supply: TokenKind | "pothole" | "jam";
  reward: { score: number; power: number; approval: number; life: boolean };
  penalty: { power: number; approval: number };
}

export const MISSIONS: Record<MissionId, MissionDef> = {
  road: {
    id: "road",
    title: "Road Development",
    icon: "🛣️",
    objective: (n) => `Fix ${n} potholes`,
    instructions: [
      "SLIDE over a pothole to patch it (jumping only avoids it).",
      "The Water Tanker Shield also patches potholes you drive over.",
      "Running straight into a pothole costs a life and CM Power.",
    ],
    event: "pothole",
    target: 10,
    timeLimit: 95,
    supply: "pothole",
    reward: { score: 2500, power: 10, approval: 12, life: true },
    penalty: { power: 14, approval: 10 },
  },
  water: {
    id: "water",
    title: "Water Supply",
    icon: "🚰",
    objective: (n) => `Deliver ${n} water tankers`,
    instructions: [
      "Grab the blue WATER DELIVERY tokens – each one is a tanker delivered to a colony.",
      "Tokens float in safe lanes between obstacles.",
      "The File Collector magnet pulls tokens towards you.",
    ],
    event: "tanker",
    target: 5,
    timeLimit: 75,
    supply: "tankerToken",
    reward: { score: 2200, power: 10, approval: 12, life: true },
    penalty: { power: 14, approval: 10 },
  },
  traffic: {
    id: "traffic",
    title: "Traffic Management",
    icon: "🚦",
    objective: (n) => `Clear ${n} traffic blockages`,
    instructions: [
      "Collect a WHISTLE to clear the next traffic jam ahead.",
      "Whistles appear in the same lane as the jam they clear.",
      "Missed the whistle? Dodge the jam by changing lanes.",
    ],
    event: "jam",
    target: 8,
    timeLimit: 100,
    supply: "jam",
    reward: { score: 2600, power: 10, approval: 12, life: true },
    penalty: { power: 14, approval: 10 },
  },
  employment: {
    id: "employment",
    title: "Employment Drive",
    icon: "💼",
    objective: (n) => `Collect ${n} employment tokens`,
    instructions: [
      "Collect the green BRIEFCASE tokens – each is a new job created.",
      "They often come in short lines. Stay in lane!",
    ],
    event: "job",
    target: 20,
    timeLimit: 85,
    supply: "job",
    reward: { score: 2400, power: 10, approval: 14, life: true },
    penalty: { power: 14, approval: 10 },
  },
  publicService: {
    id: "publicService",
    title: "Public Services",
    icon: "📋",
    objective: (n) => `Complete ${n} public-service missions`,
    instructions: [
      "Collect PUBLIC SERVICE FILES – ration cards, pensions and health cards.",
      "Each file collected completes one public-service mission.",
    ],
    event: "service",
    target: 5,
    timeLimit: 75,
    supply: "service",
    reward: { score: 2200, power: 10, approval: 12, life: true },
    penalty: { power: 14, approval: 10 },
  },
  infrastructure: {
    id: "infrastructure",
    title: "Infrastructure Development",
    icon: "🏗️",
    objective: (n) => `Complete ${n} construction projects`,
    instructions: [
      "Bricks come in lines of 4. Collect all 4 in a line to finish one project.",
      "Miss a brick and that project stalls – wait for the next line.",
    ],
    event: "project",
    target: 3,
    timeLimit: 100,
    supply: "brick",
    reward: { score: 3000, power: 12, approval: 12, life: true },
    penalty: { power: 14, approval: 10 },
  },
  emergency: {
    id: "emergency",
    title: "Emergency Response",
    icon: "🚨",
    objective: (n) => `Reach ${n} emergency sirens before time runs out`,
    instructions: [
      "TIMED EMERGENCY! Collect the red SIREN tokens quickly.",
      "Short timer – prioritise sirens over coins.",
    ],
    event: "siren",
    target: 3,
    timeLimit: 28,
    emergency: true,
    supply: "siren",
    reward: { score: 2800, power: 12, approval: 14, life: true },
    penalty: { power: 12, approval: 8 },
  },
};

export const MISSION_IDS = Object.keys(MISSIONS) as MissionId[];

export interface ActiveMission {
  id: MissionId;
  def: MissionDef;
  target: number;
  timeLimit: number;
  timeLeft: number;
  progress: number;
  status: MissionStatus;
  collisions: number;
}

/**
 * Scale a mission for the n-th cycle of a run (progressive difficulty) and the relaxed setting.
 * Time limits shrink a little each cycle but never below 80 % of the base value, so missions stay fair.
 */
export function createMission(id: MissionId, cycle: number, relaxed = false): ActiveMission {
  const def = MISSIONS[id];
  const timeFactor = Math.max(0.8, 1 - 0.05 * cycle) * (relaxed ? 1.25 : 1);
  const targetFactor = def.emergency ? 1 : Math.min(1.3, 1 + 0.1 * cycle);
  const target = Math.max(1, Math.round(def.target * targetFactor));
  const timeLimit = Math.round(def.timeLimit * timeFactor);
  return { id, def, target, timeLimit, timeLeft: timeLimit, progress: 0, status: "active", collisions: 0 };
}

export type MissionTickResult = "none" | "completed" | "failed";

export function recordMissionEvent(m: ActiveMission, ev: ProgressEvent, amount = 1): MissionTickResult {
  if (m.status !== "active" || m.def.event !== ev) return "none";
  m.progress = Math.min(m.target, m.progress + amount);
  if (m.progress >= m.target) {
    m.status = "completed";
    return "completed";
  }
  return "none";
}

export function tickMission(m: ActiveMission, dt: number): MissionTickResult {
  if (m.status !== "active") return "none";
  m.timeLeft = Math.max(0, m.timeLeft - dt);
  if (m.timeLeft <= 0) {
    m.status = "failed";
    return "failed";
  }
  return "none";
}
