import { APPROVAL_START, POWER_START, STAGE_THRESHOLDS } from "./constants";
import type { GovernanceStage } from "./types";

/**
 * Balanced governance rules. All values are fictional game-balance numbers.
 * Documented in docs/GOVERNANCE.md – keep them in sync.
 */
export const GOV_RULES = {
  passivePowerDecay: 0.14, // per second: fictional opposition keeps talking
  lowApprovalExtraDecay: 0.12, // extra per second when approval < 30
  highApprovalDecayRelief: 0.05, // per second less decay when approval >= 75
  collision: { power: -3, approval: -2 },
  collisionDuringMission: { power: -6, approval: -4 },
  collisionDuringFinal: { power: 0, approval: -4 },
  bossDefeated: { power: 4, approval: 6 },
  bossEscaped: { power: 0, approval: -3 },
  coinsPerApprovalPoint: 50,
  finalChallengeWin: { power: 35, approval: 20 },
  demolitionStopped: { power: 4, approval: 6 },
  demolitionDone: { power: -10, approval: -8 },
} as const;

export function stageForPower(power: number): GovernanceStage {
  if (power <= 0) return "lost";
  if (power >= STAGE_THRESHOLDS.control) return "control";
  if (power >= STAGE_THRESHOLDS.pressure) return "pressure";
  if (power >= STAGE_THRESHOLDS.crisis) return "crisis";
  return "final";
}

export const STAGE_INFO: Record<GovernanceStage, { label: string; range: string; color: string; blurb: string }> = {
  control: { label: "CM in Control", range: "100–70%", color: "#22c55e", blurb: "Smiles, selfies and smooth roads (mostly)." },
  pressure: { label: "Public Pressure", range: "69–40%", color: "#eab308", blurb: "The crowd has questions. Many questions." },
  crisis: { label: "Political Crisis", range: "39–15%", color: "#f97316", blurb: "Breaking news every five minutes." },
  final: { label: "Final Confidence Challenge", range: "Below 15%", color: "#ef4444", blurb: "One last chance to prove yourself." },
  lost: { label: "CM Position Lost", range: "0%", color: "#7f1d1d", blurb: "Game over, Chitti garu." },
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export interface StageChange {
  from: GovernanceStage;
  to: GovernanceStage;
}

export class Governance {
  power: number;
  approval: number;
  stage: GovernanceStage;
  private coinBank = 0;

  constructor(power = POWER_START, approval = APPROVAL_START) {
    this.power = clamp(power);
    this.approval = clamp(approval);
    this.stage = stageForPower(this.power);
  }

  /** Apply deltas; returns a stage change if one occurred. */
  adjust(dPower: number, dApproval: number): StageChange | null {
    this.power = clamp(this.power + dPower);
    this.approval = clamp(this.approval + dApproval);
    return this.refreshStage();
  }

  /** Passive drift. `frozen` stops decay (e.g. during the final confidence challenge). */
  tick(dt: number, frozen: boolean): StageChange | null {
    if (frozen || dt <= 0) return null;
    let decay = GOV_RULES.passivePowerDecay;
    if (this.approval < 30) decay += GOV_RULES.lowApprovalExtraDecay;
    if (this.approval >= 75) decay -= GOV_RULES.highApprovalDecayRelief;
    this.power = clamp(this.power - decay * dt);
    return this.refreshStage();
  }

  /** Coins slowly improve approval ("visible progress"). */
  addCoins(n: number): StageChange | null {
    this.coinBank += n;
    let gained = 0;
    while (this.coinBank >= GOV_RULES.coinsPerApprovalPoint) {
      this.coinBank -= GOV_RULES.coinsPerApprovalPoint;
      gained++;
    }
    return gained ? this.adjust(0, gained) : null;
  }

  private refreshStage(): StageChange | null {
    const next = stageForPower(this.power);
    if (next !== this.stage) {
      const ch = { from: this.stage, to: next };
      this.stage = next;
      return ch;
    }
    return null;
  }
}
