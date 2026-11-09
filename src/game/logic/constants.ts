/** Core tuning constants shared by the client simulation and server-side score validation. */
export const LANES = 3;
export const SPAWN_Z = 62; // metres ahead where things appear
export const DESPAWN_Z = -6;
export const PICKUP_WINDOW = 0.9; // metres around the player where pickups register

export const JUMP_DURATION = 0.72; // seconds
export const JUMP_CLEAR_HEIGHT = 0.28; // normalised height needed to clear low obstacles
export const SLIDE_DURATION = 0.68;
export const LANE_SWITCH_TIME = 0.13;
export const INVULN_AFTER_HIT = 1.6;
export const START_LIVES = 3;
export const MAX_LIVES = 3;

export const COIN_VALUE = 10;
export const DISTANCE_POINTS_PER_METRE = 1;

/** Score multiplier pieces (also used to bound plausible scores on the server). */
export const MULT_PER_MISSION = 0.25;
export const MULT_MISSION_CAP = 4;
export const CHAI_MULT = 2;
export const HIGH_APPROVAL_MULT = 1.5;
export const MAX_TOTAL_MULT = MULT_MISSION_CAP * CHAI_MULT * HIGH_APPROVAL_MULT; // 12

export const ABSOLUTE_MAX_SPEED = 34; // m/s – no level/effect may exceed this
export const MAX_COINS_PER_SECOND = 9; // generous upper bound incl. magnets & rocket trails

/** Governance / CM power tuning */
export const POWER_START = 100;
export const APPROVAL_START = 60;
export const STAGE_THRESHOLDS = { control: 70, pressure: 40, crisis: 15 } as const;

export const MAX_RUN_SECONDS = 2 * 60 * 60;
