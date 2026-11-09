import type { LevelId, MissionId, MissionStatus } from "./types";

export interface ChapterDef {
  id: string;
  index: number;
  title: string;
  level: LevelId;
  brief: string;
  missions: MissionId[];
  startPower?: number;
  startApproval?: number;
  /** Extra success condition checked when all missions are done. */
  minApprovalAtEnd?: number;
  requireFinalChallengeWin?: boolean;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: "first-100-days",
    index: 0,
    title: "First 100 Days",
    level: "old-city",
    brief: "New CM, new promises. Create jobs, deliver services and fix the roads before the honeymoon ends.",
    missions: ["employment", "publicService", "road"],
  },
  {
    id: "infrastructure-challenge",
    index: 1,
    title: "Infrastructure Challenge",
    level: "pothole",
    brief: "Ribbon-cutting season! Complete construction projects and patch Pothole Paradise.",
    missions: ["road", "infrastructure", "emergency"],
  },
  {
    id: "water-emergency",
    index: 2,
    title: "Water Emergency",
    level: "water",
    brief: "Taps are dry, tempers are not. Get those tankers rolling.",
    missions: ["water", "emergency", "publicService"],
  },
  {
    id: "traffic-transformation",
    index: 3,
    title: "Traffic Transformation",
    level: "traffic",
    brief: "Unclog the city, one whistle at a time.",
    missions: ["traffic", "employment", "infrastructure"],
  },
  {
    id: "public-approval-test",
    index: 4,
    title: "Public Approval Test",
    level: "old-city",
    brief: "The fictional opinion poll is coming. Finish every mission with at least 75% Public Approval.",
    missions: ["publicService", "water", "traffic"],
    startApproval: 45,
    minApprovalAtEnd: 75,
  },
  {
    id: "final-cm-survival",
    index: 5,
    title: "Final CM Survival Challenge",
    level: "secretariat",
    brief: "Power is low and a no-confidence motion looms. Complete the missions AND win the Final Confidence Challenge.",
    missions: ["road", "traffic", "water", "infrastructure"],
    startPower: 32,
    startApproval: 40,
    requireFinalChallengeWin: true,
  },
];

export type ChapterStatus = "locked" | "available" | "completed" | "failed";

export interface ChapterProgress {
  status: ChapterStatus;
  missions: Partial<Record<MissionId, MissionStatus>>;
  bestScore: number;
  attempts: number;
}

export type CampaignProgress = Record<string, ChapterProgress>;

export function initialCampaign(): CampaignProgress {
  const p: CampaignProgress = {};
  CHAPTERS.forEach((c, i) => {
    p[c.id] = {
      status: i === 0 ? "available" : "locked",
      missions: Object.fromEntries(c.missions.map((m) => [m, "pending"])) as ChapterProgress["missions"],
      bestScore: 0,
      attempts: 0,
    };
  });
  return p;
}

/** Merge the result of a campaign run into saved progress and unlock the next chapter on success. */
export function applyChapterResult(
  progress: CampaignProgress,
  chapterId: string,
  result: { success: boolean; missions: Partial<Record<MissionId, MissionStatus>>; score: number },
): CampaignProgress {
  const next: CampaignProgress = structuredClone(progress);
  const idx = CHAPTERS.findIndex((c) => c.id === chapterId);
  if (idx < 0) return next;
  const cp = next[chapterId] ?? initialCampaign()[chapterId];
  cp.attempts += 1;
  cp.bestScore = Math.max(cp.bestScore, result.score);
  // Missions keep their best-ever state: once completed, always completed.
  for (const [m, st] of Object.entries(result.missions) as [MissionId, MissionStatus][]) {
    if (cp.missions[m] === "completed") continue;
    cp.missions[m] = st === "active" ? "failed" : st;
  }
  if (result.success) cp.status = "completed";
  else if (cp.status !== "completed") cp.status = "failed";
  next[chapterId] = cp;
  if (result.success && idx + 1 < CHAPTERS.length) {
    const nid = CHAPTERS[idx + 1].id;
    if (next[nid].status === "locked") next[nid].status = "available";
  }
  return next;
}
