export type LevelId = "old-city" | "traffic" | "pothole" | "water" | "secretariat";

export type ObstacleKind =
  | "pothole"
  | "speedBreaker"
  | "barricade"
  | "cones"
  | "banner"
  | "cables"
  | "auto"
  | "bus"
  | "tanker"
  | "cow"
  | "cart"
  | "puddle"
  | "pipe"
  | "jam"
  | "fileStack"
  | "redTape"
  | "boomGate"
  | "bossShot";

export type PowerUpKind = "chai" | "biryani" | "metro" | "fileCollector" | "rocket" | "tankerShield";

export type TokenKind = "whistle" | "tankerToken" | "job" | "service" | "brick" | "siren" | "petition" | "stayOrder";

export type EntityType = "obstacle" | "coin" | "powerup" | "token";

/** How an obstacle can be avoided. */
export type Avoid = "jump" | "slide" | "lane" | "jumpOrSlide";

export interface Entity {
  id: number;
  type: EntityType;
  kind: ObstacleKind | PowerUpKind | TokenKind | "coin";
  lane: number;
  z: number;
  /** additional approach speed (oncoming vehicles), m/s */
  vz: number;
  /** obstacle length along z */
  length: number;
  /** 0 ground, 1 = air (needs jump / rocket) */
  height: number;
  resolved: boolean;
  hit: boolean;
  collected: boolean;
  /** lateral animation (boss shots/cows can drift) */
  laneOffset: number;
  /** for jams: cleared by a whistle */
  cleared?: boolean;
  /** pothole patched */
  fixed?: boolean;
  /** brick group for construction projects */
  group?: number;
}

export type GovernanceStage = "control" | "pressure" | "crisis" | "final" | "lost";

export type MissionId =
  | "road"
  | "water"
  | "traffic"
  | "employment"
  | "publicService"
  | "infrastructure"
  | "emergency";

export type MissionStatus = "pending" | "active" | "completed" | "failed";

export type GameMode = "endless" | "daily" | "campaign";

export type EndReason = "lives" | "noConfidence" | "powerZero" | "campaignComplete" | "quit";

export type FcObjectiveId =
  | "coins"
  | "jobs"
  | "potholes"
  | "services"
  | "tankers"
  | "jams"
  | "dodges"
  | "jumps";
