import {
  ABSOLUTE_MAX_SPEED,
  COIN_VALUE,
  DESPAWN_Z,
  DISTANCE_POINTS_PER_METRE,
  INVULN_AFTER_HIT,
  JUMP_CLEAR_HEIGHT,
  JUMP_DURATION,
  LANE_SWITCH_TIME,
  LANES,
  MAX_LIVES,
  PICKUP_WINDOW,
  SLIDE_DURATION,
  SPAWN_Z,
  START_LIVES,
} from "./constants";
import { OBSTACLES, POWERUPS, isGroundHazard } from "./catalog";
import { CHAPTERS, type ChapterDef } from "./campaign";
import type { DailyModifier } from "./daily";
import { FinalChallenge } from "./finalChallenge";
import { GOV_RULES, Governance, type StageChange } from "./governance";
import { getLevel, type LevelDef } from "./levels";
import {
  MISSION_IDS,
  createMission,
  recordMissionEvent,
  tickMission,
  type ActiveMission,
  type ProgressEvent,
} from "./missions";
import { Rng } from "./rng";
import { BONUS, scoreMultiplier, type RunSummary } from "./scoring";
import type {
  EndReason,
  Entity,
  GameMode,
  GovernanceStage,
  LevelId,
  MissionId,
  MissionStatus,
  ObstacleKind,
  PowerUpKind,
  TokenKind,
} from "./types";

export interface SimOptions {
  level: LevelId;
  mode: GameMode;
  seed: number;
  /** Accessibility: slower world, longer mission timers. */
  relaxed?: boolean;
  chapterId?: string;
  dailyModifier?: DailyModifier;
  /** Pause for an instruction card before each mission (default true). */
  briefings?: boolean;
  /** Disable missions entirely (used by some tests). */
  missionsEnabled?: boolean;
  /** Override first mission delay (tests). */
  firstMissionDelay?: number;
}

export type SimEvent =
  | { type: "coin"; amount: number }
  | { type: "jump" }
  | { type: "slide" }
  | { type: "laneChange"; lane: number }
  | { type: "hit"; kind: ObstacleKind; lifeLost: boolean }
  | { type: "shieldBlock" }
  | { type: "powerup"; kind: PowerUpKind }
  | { type: "powerupEnd"; kind: PowerUpKind }
  | { type: "token"; kind: TokenKind }
  | { type: "potholeFixed" }
  | { type: "jamCleared" }
  | { type: "projectComplete" }
  | { type: "projectStalled" }
  | { type: "missionBriefing"; mission: ActiveMission }
  | { type: "missionStart"; mission: ActiveMission }
  | { type: "missionComplete"; mission: ActiveMission; bonus: number }
  | { type: "missionFail"; mission: ActiveMission }
  | { type: "stageChange"; from: GovernanceStage; to: GovernanceStage }
  | { type: "fcBriefing" }
  | { type: "fcStart" }
  | { type: "fcWon"; reward: string }
  | { type: "fcLost" }
  | { type: "bossStart"; name: string }
  | { type: "bossWarn"; lanes: number[] }
  | { type: "bossHit" }
  | { type: "bossDefeated" }
  | { type: "bossEscaped" }
  | { type: "checkpoint" }
  | { type: "gameOver"; reason: EndReason };

export type Phase = "running" | "briefing" | "over";

interface BossState {
  name: string;
  hp: number;
  maxHp: number;
  timeLeft: number;
  attackTimer: number;
  petitionTimer: number;
  warnings: { lanes: number[]; t: number }[];
}

interface BrickGroup {
  collected: number;
  total: number;
  stalled: boolean;
}

export interface PlayerState {
  lane: number;
  x: number;
  y: number;
  jumpT: number; // -1 when grounded
  slideT: number; // -1 when not sliding
  invuln: number;
  jumpBuffer: number;
  hitFlash: number;
}

export const FC_REWARDS = ["Golden Kurta outfit", "Confidence Trophy", "Bonus 5000 points"] as const;

export class RunSim {
  readonly opts: Required<Omit<SimOptions, "chapterId" | "dailyModifier" | "firstMissionDelay">> & {
    chapterId?: string;
    dailyModifier?: DailyModifier;
  };
  readonly level: LevelDef;
  readonly chapter?: ChapterDef;
  readonly rng: Rng;
  readonly gov: Governance;

  phase: Phase = "running";
  t = 0;
  distance = 0;
  score = 0;
  coins = 0;
  lives = START_LIVES;
  speed: number;
  player: PlayerState = { lane: 1, x: 1, y: 0, jumpT: -1, slideT: -1, invuln: 0, jumpBuffer: 0, hitFlash: 0 };
  powerups: Partial<Record<PowerUpKind, number>> = {};
  entities: Entity[] = [];
  events: SimEvent[] = [];

  // missions
  mission: ActiveMission | null = null;
  pendingMission: ActiveMission | null = null;
  missionTimer: number;
  missionCycle = 0;
  missionsCompleted = 0;
  missionsFailed = 0;
  missionLog: { id: MissionId; status: MissionStatus; t: number }[] = [];
  private missionBag: MissionId[] = [];
  private lastMission: MissionId | null = null;
  campaignQueue: MissionId[] = [];
  campaignStatus: Partial<Record<MissionId, MissionStatus>> = {};
  private campaignRetried = new Set<MissionId>();
  campaignSuccess = false;

  // final confidence challenge
  fc: FinalChallenge | null = null;
  pendingFc: FinalChallenge | null = null;
  fcAttempts = 0;
  fcWins = 0;
  private fcCooldown = 0;
  rewardsUnlocked: string[] = [];

  // boss
  boss: BossState | null = null;
  bossTimer: number;
  bossesDefeated = 0;

  // stats
  collisions = 0;
  jumpsOver = 0;
  potholesFixed = 0;
  jamsCleared = 0;
  endReason: EndReason | null = null;
  checkpoints: [number, number, number][] = [];
  private checkpointTimer = 10;

  // spawner state
  private nextId = 1;
  private rowTimer = 1.6;
  private powerupTimer: number;
  private supplyTimers = new Map<string, number>();
  private reservedLane: number | null = null;
  private prevRowLaneBlocked: boolean[] = [false, false, false];
  private brickGroups = new Map<number, BrickGroup>();
  private nextBrickGroup = 1;
  private suppressRows = 0;

  constructor(options: SimOptions) {
    this.opts = {
      relaxed: false,
      briefings: true,
      missionsEnabled: true,
      ...options,
    } as RunSim["opts"];
    this.level = getLevel(options.level);
    this.rng = new Rng(options.seed);
    this.chapter = options.chapterId ? CHAPTERS.find((c) => c.id === options.chapterId) : undefined;
    this.gov = new Governance(this.chapter?.startPower, this.chapter?.startApproval);
    this.lastStage = this.gov.stage;
    this.speed = this.level.baseSpeed;
    this.missionTimer = options.firstMissionDelay ?? 6;
    this.bossTimer = this.level.boss.firstAt;
    this.powerupTimer = this.rng.range(8, 14);
    if (this.opts.mode === "campaign" && this.chapter) {
      this.campaignQueue = [...this.chapter.missions];
      for (const m of this.chapter.missions) this.campaignStatus[m] = "pending";
    }
  }

  // ───────────────────────────── input ─────────────────────────────
  private get canAct() {
    return this.phase === "running";
  }

  moveLeft() {
    if (!this.canAct || this.player.lane <= 0) return;
    this.player.lane -= 1;
    this.emit({ type: "laneChange", lane: this.player.lane });
  }

  moveRight() {
    if (!this.canAct || this.player.lane >= LANES - 1) return;
    this.player.lane += 1;
    this.emit({ type: "laneChange", lane: this.player.lane });
  }

  jump() {
    if (!this.canAct || this.isFlying || this.powerups.metro) return;
    const p = this.player;
    if (p.jumpT >= 0) {
      p.jumpBuffer = 0.18; // buffered jump on landing
      return;
    }
    p.slideT = -1;
    p.jumpT = 0;
    this.emit({ type: "jump" });
  }

  slide() {
    if (!this.canAct || this.isFlying || this.powerups.metro) return;
    const p = this.player;
    p.jumpT = -1; // fast-fall into a slide
    p.y = 0;
    p.jumpBuffer = 0;
    p.slideT = 0;
    this.emit({ type: "slide" });
  }

  confirmBriefing() {
    if (this.phase !== "briefing") return;
    this.phase = "running";
    if (this.pendingMission) {
      this.mission = this.pendingMission;
      this.pendingMission = null;
      this.emit({ type: "missionStart", mission: this.mission });
      this.setSupplyTimersForMission();
    } else if (this.pendingFc) {
      this.fc = this.pendingFc;
      this.pendingFc = null;
      this.emit({ type: "fcStart" });
      for (const s of this.fc.supplies) this.supplyTimers.set(s, 1.5);
    }
  }

  /** Player quits from the pause menu. */
  quit() {
    this.end("quit");
  }

  // ─────────────────────────── helpers ────────────────────────────
  get isFlying() {
    return (this.powerups.rocket ?? 0) > 0;
  }

  get multiplier() {
    return scoreMultiplier(this.missionsCompleted, (this.powerups.chai ?? 0) > 0, this.gov.approval);
  }

  get difficulty() {
    return Math.min(1, this.t / 210);
  }

  get stage() {
    return this.gov.stage;
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private emit(e: SimEvent) {
    this.events.push(e);
  }

  private lastStage: GovernanceStage = "control";

  /** Emit a stage change whenever the governance stage differs from the last one we announced. */
  private onStage(_ch?: StageChange | null) {
    const now = this.gov.stage;
    if (now !== this.lastStage) {
      this.emit({ type: "stageChange", from: this.lastStage, to: now });
      this.lastStage = now;
    }
  }

  private end(reason: EndReason) {
    if (this.phase === "over") return;
    if (this.mission && this.mission.status === "active") {
      this.mission.status = "failed";
      if (this.opts.mode === "campaign") this.campaignStatus[this.mission.id] = "failed";
    }
    this.phase = "over";
    this.endReason = reason;
    this.score = Math.round(this.score);
    this.checkpoints.push([round2(this.t), round2(this.distance), this.score]);
    this.emit({ type: "gameOver", reason });
  }

  // ─────────────────────────── update ─────────────────────────────
  update(rawDt: number) {
    if (this.phase !== "running") return;
    const dt = Math.min(0.05, Math.max(0, rawDt));
    if (dt === 0) return;
    this.t += dt;

    this.updatePowerups(dt);
    this.updateSpeed();
    this.updatePlayer(dt);
    this.moveEntities(dt);
    this.resolveInteractions();
    this.entities = this.entities.filter((e) => e.z + e.length > DESPAWN_Z && !e.collected && !e.cleared);
    if (this.phase !== "running") return;

    this.updateBoss(dt);
    this.spawn(dt);
    this.updateMissions(dt);
    if (this.phase !== "running") return;
    this.updateFinalChallenge(dt);
    if (this.phase !== "running") return;

    // governance drift
    this.gov.tick(dt, !!this.fc || !!this.pendingFc);
    this.onStage();
    this.checkGovernanceThresholds();
    if (this.phase !== "running") return;

    // scoring
    const metres = this.speed * dt;
    this.distance += metres;
    this.score += metres * DISTANCE_POINTS_PER_METRE * this.multiplier;

    this.checkpointTimer -= dt;
    if (this.checkpointTimer <= 0) {
      this.checkpointTimer = 10;
      this.checkpoints.push([round2(this.t), round2(this.distance), Math.round(this.score)]);
      this.emit({ type: "checkpoint" });
    }
  }

  private updateSpeed() {
    const L = this.level;
    let s = Math.min(L.maxSpeed, L.baseSpeed + L.accel * this.t);
    if (this.opts.relaxed) s *= 0.82;
    if (this.opts.dailyModifier) s *= this.opts.dailyModifier.speedMult;
    if ((this.powerups.chai ?? 0) > 0) s *= 1.1;
    this.speed = Math.min(ABSOLUTE_MAX_SPEED, s);
  }

  private updatePowerups(dt: number) {
    for (const k of Object.keys(this.powerups) as PowerUpKind[]) {
      const left = (this.powerups[k] ?? 0) - dt;
      if (left <= 0) {
        delete this.powerups[k];
        this.emit({ type: "powerupEnd", kind: k });
        if (k === "rocket") {
          this.player.invuln = Math.max(this.player.invuln, 1.2);
          this.suppressRows = Math.max(this.suppressRows, 1.2);
        }
        if (k === "metro") this.player.invuln = Math.max(this.player.invuln, 0.8);
      } else this.powerups[k] = left;
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const dir = Math.sign(p.lane - p.x);
    if (dir !== 0) {
      p.x += (dir * dt) / LANE_SWITCH_TIME;
      if ((dir > 0 && p.x > p.lane) || (dir < 0 && p.x < p.lane)) p.x = p.lane;
    }
    if (this.isFlying) {
      p.y += (2.2 - p.y) * Math.min(1, dt * 6);
      p.jumpT = -1;
      p.slideT = -1;
    } else if (p.jumpT >= 0) {
      p.jumpT += dt;
      const k = p.jumpT / JUMP_DURATION;
      if (k >= 1) {
        p.jumpT = -1;
        p.y = 0;
        if (p.jumpBuffer > 0) {
          p.jumpBuffer = 0;
          p.jumpT = 0;
          this.emit({ type: "jump" });
        }
      } else p.y = 4 * k * (1 - k);
    } else if (p.y > 0) {
      p.y = Math.max(0, p.y - dt * 5); // landing after rocket
    }
    if (p.jumpBuffer > 0) p.jumpBuffer -= dt;
    if (p.slideT >= 0) {
      p.slideT += dt;
      if (p.slideT >= SLIDE_DURATION) p.slideT = -1;
    }
    if (p.invuln > 0) p.invuln -= dt;
    if (p.hitFlash > 0) p.hitFlash -= dt;
  }

  private moveEntities(dt: number) {
    const magnet = (this.powerups.fileCollector ?? 0) > 0;
    const p = this.player;
    for (const e of this.entities) {
      e.z -= (this.speed + e.vz) * dt;
      if (magnet && (e.type === "coin" || e.type === "token") && e.z < 16 && e.z > -1) {
        const target = p.x - e.lane;
        e.laneOffset += (target - e.laneOffset) * Math.min(1, dt * 10);
        e.height += (p.y - e.height) * Math.min(1, dt * 10);
      }
    }
  }

  private laneOverlap(e: Entity) {
    return Math.abs(e.lane + e.laneOffset - this.player.x) < 0.5;
  }

  private resolveInteractions() {
    const p = this.player;
    const sliding = p.slideT >= 0;
    const invincible = (this.powerups.metro ?? 0) > 0 || this.isFlying;
    for (const e of this.entities) {
      if (e.type === "obstacle") {
        const overlapZ = e.z <= 0.6 && e.z + e.length >= -0.6;
        if (!e.resolved && e.z + e.length < -0.6) {
          e.resolved = true;
          if (!e.hit) {
            this.progress("dodge");
          }
          continue;
        }
        if (!overlapZ || e.hit || e.cleared || e.resolved) continue;
        if (!this.laneOverlap(e)) continue;
        const spec = OBSTACLES[e.kind as ObstacleKind];
        const kind = e.kind as ObstacleKind;
        // pothole patching by sliding / tanker shield
        if (kind === "pothole" && !e.fixed && (sliding || (this.powerups.tankerShield ?? 0) > 0)) {
          e.fixed = true;
          e.resolved = true;
          this.potholesFixed++;
          this.emit({ type: "potholeFixed" });
          this.progress("pothole");
          continue;
        }
        if (e.fixed) continue;
        if (invincible || ((this.powerups.tankerShield ?? 0) > 0 && isGroundHazard(kind))) continue;
        let safe = false;
        if (spec.avoid === "jump") safe = p.y >= JUMP_CLEAR_HEIGHT;
        else if (spec.avoid === "slide") safe = sliding;
        else if (spec.avoid === "jumpOrSlide") safe = p.y >= JUMP_CLEAR_HEIGHT || sliding;
        if (safe) {
          if (spec.avoid !== "slide" && p.y >= JUMP_CLEAR_HEIGHT && !(e as Entity & { jumped?: boolean }).jumped) {
            (e as Entity & { jumped?: boolean }).jumped = true;
            this.jumpsOver++;
            this.progress("jump");
          }
          continue;
        }
        if (p.invuln > 0) continue;
        e.hit = true;
        this.collide(kind);
        if (this.phase !== "running") return;
      } else {
        // pickups
        if (e.collected) continue;
        if (Math.abs(e.z) > PICKUP_WINDOW || !this.laneOverlap(e)) {
          if (e.type === "token" && e.kind === "brick" && e.z < -PICKUP_WINDOW && !e.resolved) {
            e.resolved = true;
            this.brickMissed(e);
          }
          continue;
        }
        if (Math.abs(p.y - e.height) > 0.75) continue;
        e.collected = true;
        this.collect(e);
      }
    }
  }

  private collide(kind: ObstacleKind) {
    const p = this.player;
    if ((this.powerups.biryani ?? 0) > 0) {
      delete this.powerups.biryani;
      p.invuln = 1.0;
      this.emit({ type: "shieldBlock" });
      this.emit({ type: "powerupEnd", kind: "biryani" });
      return;
    }
    this.collisions++;
    this.lives -= 1;
    p.invuln = INVULN_AFTER_HIT;
    p.hitFlash = 0.5;
    p.slideT = -1;
    this.emit({ type: "hit", kind, lifeLost: true });
    // governance consequences
    if (this.fc) {
      this.fc.onCollision();
      this.onStage(this.gov.adjust(GOV_RULES.collisionDuringFinal.power, GOV_RULES.collisionDuringFinal.approval));
    } else if (this.mission) {
      this.mission.collisions++;
      this.onStage(this.gov.adjust(GOV_RULES.collisionDuringMission.power, GOV_RULES.collisionDuringMission.approval));
    } else {
      this.onStage(this.gov.adjust(GOV_RULES.collision.power, GOV_RULES.collision.approval));
    }
    if (this.lives <= 0) {
      this.end("lives");
      return;
    }
    this.checkGovernanceThresholds();
  }

  private collect(e: Entity) {
    if (e.type === "coin") {
      this.coins += 1;
      this.score += COIN_VALUE * this.multiplier;
      this.emit({ type: "coin", amount: 1 });
      this.onStage(this.gov.addCoins(1));
      this.progress("coin");
      return;
    }
    if (e.type === "powerup") {
      const k = e.kind as PowerUpKind;
      this.powerups[k] = POWERUPS[k].duration * (this.opts.relaxed ? 1.2 : 1);
      if (k === "rocket") {
        this.player.jumpT = -1;
        this.player.slideT = -1;
        this.suppressRows = POWERUPS.rocket.duration + 1;
        this.spawnSkyCoins();
      }
      this.emit({ type: "powerup", kind: k });
      return;
    }
    const k = e.kind as TokenKind;
    this.emit({ type: "token", kind: k });
    switch (k) {
      case "whistle": {
        const jam = this.entities
          .filter((x) => x.kind === "jam" && !x.cleared && x.z > -0.5)
          .sort((a, b) => (a.lane === e.lane ? -1 : 0) - (b.lane === e.lane ? -1 : 0) || a.z - b.z)[0];
        if (jam) {
          jam.cleared = true;
          this.jamsCleared++;
          this.emit({ type: "jamCleared" });
          this.progress("jam");
        }
        break;
      }
      case "tankerToken":
        this.progress("tanker");
        break;
      case "job":
        this.progress("job");
        break;
      case "service":
        this.progress("service");
        break;
      case "siren":
        this.progress("siren");
        break;
      case "brick": {
        const g = this.brickGroups.get(e.group ?? 0);
        if (g && !g.stalled) {
          g.collected++;
          if (g.collected >= g.total) {
            this.brickGroups.delete(e.group ?? 0);
            this.emit({ type: "projectComplete" });
            this.progress("project");
          }
        }
        break;
      }
      case "petition":
        if (this.boss) {
          this.boss.hp -= 1;
          this.emit({ type: "bossHit" });
          if (this.boss.hp <= 0) this.defeatBoss();
        }
        break;
    }
  }

  private brickMissed(e: Entity) {
    const g = this.brickGroups.get(e.group ?? 0);
    if (g && !g.stalled) {
      g.stalled = true;
      this.brickGroups.delete(e.group ?? 0);
      this.emit({ type: "projectStalled" });
    }
  }

  private progress(ev: ProgressEvent) {
    if (this.mission) {
      const r = recordMissionEvent(this.mission, ev);
      if (r === "completed") this.completeMission();
    }
    if (this.fc) {
      this.fc.record(ev);
    }
  }

  // ─────────────────────────── missions ───────────────────────────
  private nextMissionId(): MissionId | null {
    if (this.opts.mode === "campaign") return this.campaignQueue[0] ?? null;
    if (this.missionBag.length === 0) {
      this.missionBag = this.rng.shuffle([...MISSION_IDS]);
      if (this.missionBag[0] === this.lastMission) this.missionBag.push(this.missionBag.shift()!);
    }
    return this.missionBag[0];
  }

  private updateMissions(dt: number) {
    if (!this.opts.missionsEnabled) return;
    if (this.mission) {
      const r = tickMission(this.mission, dt);
      if (r === "failed") this.failMission();
      return;
    }
    if (this.fc || this.pendingFc || this.boss || this.bossTimer <= 0) return;
    this.missionTimer -= dt;
    if (this.missionTimer > 0) return;
    const id = this.nextMissionId();
    if (!id) {
      if (this.opts.mode === "campaign") this.finishCampaign();
      return;
    }
    if (this.opts.mode === "campaign") this.campaignQueue.shift();
    else this.missionBag.shift();
    this.lastMission = id;
    const m = createMission(id, this.opts.mode === "campaign" ? 0 : this.missionCycle, this.opts.relaxed);
    if (this.opts.mode === "campaign") this.campaignStatus[id] = "active";
    if (this.opts.briefings) {
      this.pendingMission = m;
      this.phase = "briefing";
      this.emit({ type: "missionBriefing", mission: m });
    } else {
      this.mission = m;
      this.emit({ type: "missionStart", mission: m });
      this.setSupplyTimersForMission();
    }
  }

  private setSupplyTimersForMission() {
    if (!this.mission) return;
    this.supplyTimers.set(this.mission.def.supply, 1.2);
  }

  private completeMission() {
    const m = this.mission!;
    const r = m.def.reward;
    const bonus = r.score;
    this.score += bonus;
    this.missionsCompleted++;
    this.missionCycle = Math.floor(this.missionsCompleted / MISSION_IDS.length);
    if (r.life && this.lives < MAX_LIVES) this.lives++;
    this.onStage(this.gov.adjust(r.power, r.approval));
    this.missionLog.push({ id: m.id, status: "completed", t: this.t });
    if (this.opts.mode === "campaign") this.campaignStatus[m.id] = "completed";
    this.emit({ type: "missionComplete", mission: m, bonus });
    this.mission = null;
    this.missionTimer = 7;
    this.supplyTimers.delete(m.def.supply);
  }

  private failMission() {
    const m = this.mission!;
    this.missionsFailed++;
    this.onStage(this.gov.adjust(-m.def.penalty.power, -m.def.penalty.approval));
    this.missionLog.push({ id: m.id, status: "failed", t: this.t });
    this.emit({ type: "missionFail", mission: m });
    this.mission = null;
    this.missionTimer = 7;
    this.supplyTimers.delete(m.def.supply);
    if (this.opts.mode === "campaign") {
      if (!this.campaignRetried.has(m.id)) {
        // one fair second chance per mission, queued at the end
        this.campaignRetried.add(m.id);
        this.campaignStatus[m.id] = "pending";
        this.campaignQueue.push(m.id);
      } else {
        this.campaignStatus[m.id] = "failed";
        this.campaignSuccess = false;
        this.end("campaignComplete");
        return;
      }
    }
    this.checkGovernanceThresholds();
  }

  private finishCampaign() {
    const ch = this.chapter;
    if (!ch) return;
    if (ch.requireFinalChallengeWin && this.fcWins === 0) {
      // The opposition tables the motion: force the final challenge.
      if (!this.fc && !this.pendingFc) {
        this.onStage(this.gov.adjust(-(this.gov.power - 14), 0));
        this.startFinalChallenge();
      }
      return;
    }
    const allDone = ch.missions.every((m) => this.campaignStatus[m] === "completed");
    const approvalOk = ch.minApprovalAtEnd === undefined || this.gov.approval >= ch.minApprovalAtEnd;
    this.campaignSuccess = allDone && approvalOk;
    this.end("campaignComplete");
  }

  // ───────────────────── final confidence challenge ─────────────────────
  private checkGovernanceThresholds() {
    if (this.phase === "over") return;
    if (this.gov.power <= 0) {
      this.end("powerZero");
      return;
    }
    if (this.gov.stage === "final" && !this.fc && !this.pendingFc && this.fcCooldown <= 0) {
      this.startFinalChallenge();
    }
  }

  private startFinalChallenge() {
    // abort the current mission without penalty – it returns to the queue
    if (this.mission) {
      const id = this.mission.id;
      this.supplyTimers.delete(this.mission.def.supply);
      this.mission = null;
      if (this.opts.mode === "campaign") {
        this.campaignStatus[id] = "pending";
        this.campaignQueue.unshift(id);
      }
    }
    if (this.boss) {
      this.boss = null;
      this.emit({ type: "bossEscaped" });
    }
    this.fcAttempts++;
    this.pendingFc = new FinalChallenge(this.rng, this.fcAttempts, this.opts.relaxed);
    if (this.opts.briefings) {
      this.phase = "briefing";
      this.emit({ type: "fcBriefing" });
    } else {
      this.emit({ type: "fcBriefing" });
      this.phase = "briefing";
      this.confirmBriefing();
    }
  }

  private updateFinalChallenge(dt: number) {
    if (this.fcCooldown > 0) this.fcCooldown -= dt;
    if (!this.fc) return;
    if (this.fc.status === "won") return this.winFinalChallenge();
    const r = this.fc.tick(dt);
    if (r === "lost") {
      this.fc = null;
      this.emit({ type: "fcLost" });
      this.onStage(this.gov.adjust(-this.gov.power, -10));
      this.end("noConfidence");
    }
  }

  private winFinalChallenge() {
    const fc = this.fc!;
    for (const o of fc.objectives) if (o.def.supply) this.supplyTimers.delete(o.def.supply);
    this.fc = null;
    this.fcWins++;
    this.fcCooldown = 20;
    this.score += BONUS.finalChallengeWon;
    const reward = FC_REWARDS[(this.fcWins - 1) % FC_REWARDS.length];
    this.rewardsUnlocked.push(reward);
    this.onStage(this.gov.adjust(GOV_RULES.finalChallengeWin.power, GOV_RULES.finalChallengeWin.approval));
    if (this.lives < MAX_LIVES) this.lives++;
    this.emit({ type: "fcWon", reward });
    this.missionTimer = Math.max(this.missionTimer, 5);
    // re-supply the active campaign mission next
  }

  // ───────────────────────────── boss ─────────────────────────────
  private updateBoss(dt: number) {
    if (!this.boss) {
      if (this.fc || this.pendingFc) return;
      this.bossTimer -= dt;
      // the boss waits politely for the current mission to finish
      if (this.bossTimer <= 0 && !this.mission && !this.pendingMission) {
        const hp = 5;
        this.boss = {
          name: this.level.boss.name,
          hp,
          maxHp: hp,
          timeLeft: 28,
          attackTimer: 2.2,
          petitionTimer: 1.4,
          warnings: [],
        };
        this.missionTimer = Math.max(this.missionTimer, 3);
        this.emit({ type: "bossStart", name: this.boss.name });
      }
      return;
    }
    const b = this.boss;
    b.timeLeft -= dt;
    for (const w of b.warnings) w.t -= dt;
    // fire queued attacks
    for (const w of b.warnings.filter((x) => x.t <= 0)) {
      for (const lane of w.lanes) {
        const vz = OBSTACLES.bossShot.vz;
        this.addEntity("obstacle", "bossShot", lane, (this.speed + vz) * 1.25, { vz });
      }
    }
    b.warnings = b.warnings.filter((x) => x.t > 0);
    b.attackTimer -= dt;
    if (b.attackTimer <= 0) {
      b.attackTimer = 1.7 - 0.4 * this.difficulty;
      const lanes = [this.rng.int(0, 2)];
      if (this.rng.chance(0.35 + 0.25 * this.difficulty)) {
        const other = this.rng.pick([0, 1, 2].filter((l) => l !== lanes[0]));
        lanes.push(other);
      }
      b.warnings.push({ lanes, t: 1.0 });
      this.emit({ type: "bossWarn", lanes });
    }
    b.petitionTimer -= dt;
    if (b.petitionTimer <= 0) {
      b.petitionTimer = 2.0;
      const blocked = new Set(b.warnings.flatMap((w) => w.lanes));
      const free = [0, 1, 2].filter((l) => !blocked.has(l));
      const lane = free.length ? this.rng.pick(free) : this.player.lane;
      this.addEntity("token", "petition", lane, SPAWN_Z * 0.6);
    }
    if (b.timeLeft <= 0) {
      this.boss = null;
      this.bossTimer = this.level.boss.interval;
      this.onStage(this.gov.adjust(GOV_RULES.bossEscaped.power, GOV_RULES.bossEscaped.approval));
      this.emit({ type: "bossEscaped" });
      this.checkGovernanceThresholds();
    }
  }

  private defeatBoss() {
    this.boss = null;
    this.bossesDefeated++;
    this.bossTimer = this.level.boss.interval;
    this.score += BONUS.bossDefeated;
    this.onStage(this.gov.adjust(GOV_RULES.bossDefeated.power, GOV_RULES.bossDefeated.approval));
    this.emit({ type: "bossDefeated" });
    // celebratory coin shower
    for (let i = 0; i < 12; i++) this.addEntity("coin", "coin", i % 3, 8 + i * 1.6);
  }

  // ─────────────────────────── spawning ───────────────────────────
  private addEntity(
    type: Entity["type"],
    kind: Entity["kind"],
    lane: number,
    z: number,
    extra: Partial<Entity> = {},
  ): Entity {
    const spec = type === "obstacle" ? OBSTACLES[kind as ObstacleKind] : null;
    const e: Entity = {
      id: this.nextId++,
      type,
      kind,
      lane,
      z,
      vz: spec?.vz ?? 0,
      length: spec?.length ?? 0.6,
      height: 0,
      resolved: false,
      hit: false,
      collected: false,
      laneOffset: 0,
      ...extra,
    };
    this.entities.push(e);
    return e;
  }

  private spawnSkyCoins() {
    for (let i = 0; i < 26; i++) {
      const lane = Math.floor(i / 9) % 3 === 1 ? 1 : this.player.lane;
      this.addEntity("coin", "coin", lane, 6 + i * 3, { height: 2.2 });
    }
  }

  /** Supplies currently demanded by missions / the final challenge with their intervals. */
  private supplyIntervals(): Map<string, number> {
    const out = new Map<string, number>();
    const m = this.mission;
    if (m) {
      const remaining = Math.max(1, m.target - m.progress);
      const window = Math.max(4, m.timeLeft - 5);
      const perItem = m.def.supply === "brick" ? 4 : 1;
      const units = m.def.supply === "brick" ? remaining : Math.ceil(remaining / (m.def.supply === "job" ? 3 : 1));
      let interval = window / (units * 1.7);
      interval = Math.max(perItem > 1 ? 4 : 0.9, Math.min(perItem > 1 ? 12 : 6, interval));
      out.set(m.def.supply, interval);
    }
    if (this.fc) {
      for (const s of this.fc.supplies) {
        if (!out.has(s)) out.set(s, s === "job" ? 3.5 : 3);
      }
    }
    return out;
  }

  private spawn(dt: number) {
    this.powerupTimer -= dt;
    for (const [k, v] of this.supplyTimers) this.supplyTimers.set(k, v - dt);
    if (this.suppressRows > 0) {
      this.suppressRows -= dt;
      return;
    }
    if (this.boss) return;
    this.rowTimer -= dt;
    if (this.rowTimer > 0) return;

    const L = this.level;
    let gap = L.rowGapStart + (L.rowGapMin - L.rowGapStart) * this.difficulty;
    if (this.opts.relaxed) gap *= 1.2;
    if (this.fc) gap *= 1.12;
    if (this.mission?.def.emergency) gap *= 1.1;
    this.rowTimer = gap;
    const gapMetres = this.speed * gap;

    // ── decide supplies due this row
    const intervals = this.supplyIntervals();
    let due: string | null = null;
    for (const [s, interval] of intervals) {
      const t = this.supplyTimers.get(s);
      if (t === undefined) {
        this.supplyTimers.set(s, Math.min(1.5, interval));
        continue;
      }
      if (t <= 0 && !due) {
        due = s;
        this.supplyTimers.set(s, interval);
      }
    }

    // ── obstacles for this row
    const row: { lane: number; kind: ObstacleKind }[] = [];
    const reserved = this.reservedLane;
    this.reservedLane = null;
    const lanesAvailable = [0, 1, 2].filter((l) => l !== reserved);

    if (due === "pothole") {
      const lane = this.rng.pick(lanesAvailable);
      row.push({ lane, kind: "pothole" });
      if (this.rng.chance(0.35)) {
        const other = lanesAvailable.filter((l) => l !== lane);
        row.push({ lane: this.rng.pick(other), kind: "pothole" });
      }
    } else if (due === "jam") {
      const candidates = lanesAvailable.filter((l) => !this.prevRowLaneBlocked[l]);
      const lane = candidates.length ? this.rng.pick(candidates) : this.rng.pick(lanesAvailable);
      row.push({ lane, kind: "jam" });
      // whistle sits ahead of the jam in the same lane
      this.addEntity("token", "whistle", lane, SPAWN_Z - Math.min(7, gapMetres * 0.55), { height: 0 });
    } else {
      const wall = this.rng.chance(0.06 * this.difficulty) && reserved === null;
      if (wall) {
        const kind = this.rng.chance(0.5) ? this.pickKindWithAvoid(["slide"]) : this.pickKindWithAvoid(["jump"]);
        if (kind) for (const l of [0, 1, 2]) row.push({ lane: l, kind });
      }
      if (!row.length) {
        const count = this.rng.chance(L.doubleChance * (0.4 + 0.6 * this.difficulty)) ? 2 : 1;
        const lanes = this.rng.shuffle([...lanesAvailable]).slice(0, Math.min(count, lanesAvailable.length));
        for (const lane of lanes) row.push({ lane, kind: this.rng.weighted(L.obstacleWeights) });
      }
    }
    // jams outside the traffic mission would be unclearable; swap them for autos
    for (const r of row) if (r.kind === "jam" && due !== "jam") r.kind = "auto";
    // fairness: never three lane-blocking obstacles in a row
    const blockers = row.filter((r) => OBSTACLES[r.kind].avoid === "lane");
    if (blockers.length >= LANES) row.pop();

    const laneBlocked = [false, false, false];
    const occupiedLen = [0, 0, 0];
    for (const r of row) {
      const spec = OBSTACLES[r.kind];
      const z = SPAWN_Z * ((this.speed + spec.vz) / this.speed);
      this.addEntity("obstacle", r.kind, r.lane, z);
      if (spec.avoid === "lane") laneBlocked[r.lane] = true;
      occupiedLen[r.lane] = Math.max(occupiedLen[r.lane], spec.length + spec.vz * gap);
      // coin arc over jumpable obstacles
      if (spec.avoid === "jump" && this.rng.chance(0.25)) {
        [-1.8, 0, 1.8].forEach((dz, i) => this.addEntity("coin", "coin", r.lane, z + dz, { height: i === 1 ? 1 : 0.7 }));
      }
    }
    this.prevRowLaneBlocked = laneBlocked;

    // ── gap content (between this row and the next) in a lane that is completely free now
    const freeLanes = [0, 1, 2].filter((l) => !row.some((r) => r.lane === l));
    const contentLane = freeLanes.length ? this.rng.pick(freeLanes) : this.rng.int(0, 2);
    const startZ = SPAWN_Z + occupiedLen[contentLane] + 1.5;
    const span = Math.max(2, gapMetres - occupiedLen[contentLane] - 3);
    let placed = false;

    if (due && due !== "pothole" && due !== "jam") {
      const kind = due as TokenKind;
      if (kind === "brick") {
        const group = this.nextBrickGroup++;
        this.brickGroups.set(group, { collected: 0, total: 4, stalled: false });
        const step = Math.min(2.4, span / 3.2);
        for (let i = 0; i < 4; i++) this.addEntity("token", "brick", contentLane, startZ + i * step, { group });
        this.rowTimer += Math.max(0, (4 * 2.4 - span) / this.speed); // stretch the gap if needed
      } else if (kind === "job") {
        const n = Math.min(3, Math.max(1, Math.floor(span / 2.2)));
        for (let i = 0; i < n; i++) this.addEntity("token", "job", contentLane, startZ + i * 2.2);
      } else {
        this.addEntity("token", kind, contentLane, startZ + Math.min(2, span / 2));
      }
      placed = true;
    } else if (this.powerupTimer <= 0 && this.speed > 0) {
      const rate = this.opts.dailyModifier?.powerupRateMult ?? 1;
      this.powerupTimer = this.rng.range(14, 22) / rate;
      const kind = this.rng.weighted(L.powerupWeights);
      this.addEntity("powerup", kind, contentLane, startZ + Math.min(2, span / 2));
      placed = true;
    }
    if (placed) {
      this.reservedLane = contentLane;
    } else {
      const coinChance = 0.65 * (this.opts.dailyModifier?.coinMult ?? 1);
      if (this.rng.chance(Math.min(0.95, coinChance))) {
        const n = Math.max(2, Math.min(8, Math.floor(span / 2.2)));
        for (let i = 0; i < n; i++) this.addEntity("coin", "coin", contentLane, startZ + i * 2.2);
        this.reservedLane = contentLane;
      }
    }
  }

  private pickKindWithAvoid(avoids: string[]): ObstacleKind | null {
    const pool = Object.entries(this.level.obstacleWeights).filter(([k]) =>
      avoids.includes(OBSTACLES[k as ObstacleKind].avoid),
    ) as [ObstacleKind, number][];
    if (!pool.length) return null;
    return this.rng.weighted(Object.fromEntries(pool) as Partial<Record<ObstacleKind, number>>);
  }

  // ─────────────────────────── snapshot ───────────────────────────
  summary(): RunSummary {
    return {
      score: Math.round(this.score),
      distance: round2(this.distance),
      coins: this.coins,
      durationSec: round2(this.t),
      missionsCompleted: this.missionsCompleted,
      bossesDefeated: this.bossesDefeated,
      finalChallengesWon: this.fcWins,
      checkpoints: this.checkpoints,
    };
  }

  snapshot(): HudSnapshot {
    const m = this.mission ?? this.pendingMission;
    return {
      phase: this.phase,
      t: this.t,
      score: Math.round(this.score),
      coins: this.coins,
      distance: Math.round(this.distance),
      lives: this.lives,
      multiplier: this.multiplier,
      speed: this.speed,
      power: this.gov.power,
      approval: this.gov.approval,
      stage: this.gov.stage,
      powerups: { ...this.powerups },
      mission: m
        ? {
            id: m.id,
            title: m.def.title,
            icon: m.def.icon,
            objective: m.def.objective(m.target),
            progress: m.progress,
            target: m.target,
            timeLeft: m.timeLeft,
            timeLimit: m.timeLimit,
            emergency: !!m.def.emergency,
          }
        : null,
      nextMissionIn: this.mission || this.boss || this.fc ? null : Math.max(0, this.missionTimer),
      fc: (this.fc ?? this.pendingFc)
        ? {
            pending: !this.fc,
            timeLeft: (this.fc ?? this.pendingFc)!.timeLeft,
            timeLimit: (this.fc ?? this.pendingFc)!.timeLimit,
            attempt: this.fcAttempts,
            objectives: (this.fc ?? this.pendingFc)!.objectives.map((o) => ({
              label: o.def.label(o.target),
              progress: o.progress,
              target: o.target,
              done: o.done,
            })),
          }
        : null,
      boss: this.boss
        ? { name: this.boss.name, hp: this.boss.hp, maxHp: this.boss.maxHp, timeLeft: this.boss.timeLeft }
        : null,
      missionsCompleted: this.missionsCompleted,
      missionsFailed: this.missionsFailed,
      campaign: this.opts.mode === "campaign" ? { ...this.campaignStatus } : null,
    };
  }
}

export interface HudSnapshot {
  phase: Phase;
  t: number;
  score: number;
  coins: number;
  distance: number;
  lives: number;
  multiplier: number;
  speed: number;
  power: number;
  approval: number;
  stage: GovernanceStage;
  powerups: Partial<Record<PowerUpKind, number>>;
  mission: {
    id: MissionId;
    title: string;
    icon: string;
    objective: string;
    progress: number;
    target: number;
    timeLeft: number;
    timeLimit: number;
    emergency: boolean;
  } | null;
  nextMissionIn: number | null;
  fc: {
    pending: boolean;
    attempt: number;
    timeLeft: number;
    timeLimit: number;
    objectives: { label: string; progress: number; target: number; done: boolean }[];
  } | null;
  boss: { name: string; hp: number; maxHp: number; timeLeft: number } | null;
  missionsCompleted: number;
  missionsFailed: number;
  campaign: Partial<Record<MissionId, MissionStatus>> | null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
