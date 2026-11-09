import { getAudio, type SfxName } from "./audio/engine";
import { dailyChallengeFor } from "./logic/daily";
import { RunSim, type HudSnapshot, type SimEvent, type SimOptions } from "./logic/sim";
import { autopilot } from "./logic/autopilot";
import type { GameMode, LevelId } from "./logic/types";
import type { Outfit } from "./art/character";

export interface RunConfig {
  level: LevelId;
  mode: GameMode;
  outfit: Outfit;
  chapterId?: string;
  dailyDate?: string;
  relaxed: boolean;
  briefings: boolean;
  reducedMotion: boolean;
  seed?: number;
}

type Listener = (e: SimEvent) => void;

const FIXED_DT = 1 / 120;

/**
 * Owns one run: the deterministic simulation, input mapping, audio cues and pause state.
 * The Phaser scene renders `sim`, React renders `snapshot()`. No React or Phaser imports here.
 */
export class GameController {
  sim: RunSim;
  readonly config: RunConfig;
  paused = false;
  private acc = 0;
  private listeners = new Set<Listener>();
  private hudListeners = new Set<(s: HudSnapshot) => void>();
  private hudTimer = 0;
  private detachInput: (() => void) | null = null;
  demo = false;
  /** time scale for debug/testing */
  timeScale = 1;

  constructor(config: RunConfig) {
    this.config = config;
    const opts: SimOptions = {
      level: config.level,
      mode: config.mode,
      seed: config.seed ?? (Math.random() * 2 ** 31) >>> 0,
      relaxed: config.relaxed,
      briefings: config.briefings,
      chapterId: config.chapterId,
    };
    if (config.mode === "daily" && config.dailyDate) {
      const d = dailyChallengeFor(config.dailyDate);
      opts.seed = d.seed;
      opts.level = d.level;
      opts.dailyModifier = d.modifier;
    }
    this.sim = new RunSim(opts);
  }

  /** Attract/demo mode: the autopilot plays. */
  enableDemo() {
    this.demo = true;
  }

  get level(): LevelId {
    return this.sim.level.id;
  }

  // ───────────── loop ─────────────
  tick(dtSeconds: number) {
    if (this.paused) return;
    this.acc += Math.min(0.1, dtSeconds) * this.timeScale;
    while (this.acc >= FIXED_DT) {
      if (this.demo) autopilot(this.sim, 1);
      this.sim.update(FIXED_DT);
      this.acc -= FIXED_DT;
    }
    const events = this.sim.drainEvents();
    for (const e of events) this.handleEvent(e);
    this.hudTimer -= dtSeconds;
    if (this.hudTimer <= 0 || events.length) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
  }

  private handleEvent(e: SimEvent) {
    const a = getAudio();
    const sfx = (n: SfxName) => a.sfx(n, this.level);
    switch (e.type) {
      case "coin": sfx("coin"); break;
      case "jump": sfx("jump"); break;
      case "slide": sfx("slide"); break;
      case "laneChange": sfx("lane"); break;
      case "hit": sfx("hit"); this.vibrate(120); break;
      case "shieldBlock": sfx("shield"); this.vibrate(40); break;
      case "powerup": sfx("powerup"); break;
      case "powerupEnd": sfx("powerupEnd"); break;
      case "token": sfx("token"); break;
      case "potholeFixed": sfx("fix"); break;
      case "jamCleared": sfx("fix"); break;
      case "projectComplete": sfx("stageUp"); break;
      case "missionStart": sfx("missionStart"); break;
      case "missionBriefing": sfx("click"); break;
      case "missionComplete": sfx("missionComplete"); break;
      case "missionFail": sfx("missionFail"); this.vibrate(200); break;
      case "stageChange": {
        const order = ["control", "pressure", "crisis", "final", "lost"];
        const worse = order.indexOf(e.to) > order.indexOf(e.from);
        sfx(worse ? "stageWarn" : "stageUp");
        a.setStage(e.to);
        break;
      }
      case "fcBriefing": sfx("fcStart"); break;
      case "fcWon": sfx("fcWon"); break;
      case "fcLost": sfx("fcLost"); break;
      case "bossStart": sfx("bossStart"); a.setBoss(true); break;
      case "bossHit": sfx("bossHit"); break;
      case "bossDefeated": sfx("bossDefeated"); a.setBoss(false); break;
      case "bossEscaped": a.setBoss(false); break;
      case "gameOver": sfx("gameOver"); a.stopMusic(); break;
    }
    for (const l of this.listeners) l(e);
  }

  private vibrate(ms: number) {
    if (this.config.reducedMotion) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* not supported */
    }
  }

  onEvent(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  onHud(l: (s: HudSnapshot) => void) {
    this.hudListeners.add(l);
    l(this.sim.snapshot());
    return () => this.hudListeners.delete(l);
  }

  emitHud() {
    const s = this.sim.snapshot();
    for (const l of this.hudListeners) l(s);
  }

  // ───────────── controls ─────────────
  start() {
    const a = getAudio();
    a.unlock();
    a.setStage(this.sim.stage);
    a.setBoss(false);
    a.playMusic(this.level);
  }

  pause() {
    if (this.sim.phase === "over") return;
    this.paused = true;
    getAudio().suspend();
    this.emitHud();
  }

  resume() {
    this.paused = false;
    this.acc = 0;
    getAudio().resume();
    this.emitHud();
  }

  confirmBriefing() {
    this.sim.confirmBriefing();
    this.tick(0);
  }

  quit() {
    this.paused = false;
    this.sim.quit();
    this.tick(0);
  }

  left() { if (!this.paused) this.sim.moveLeft(); }
  right() { if (!this.paused) this.sim.moveRight(); }
  jump() { if (!this.paused) this.sim.jump(); }
  slide() { if (!this.paused) this.sim.slide(); }

  /** Keyboard + swipe input. `surface` receives touch gestures (the game canvas wrapper). */
  attachInput(surface: HTMLElement, onPauseKey: () => void, onHidden: () => void = onPauseKey) {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (ev.repeat && !["ArrowLeft", "ArrowRight"].includes(ev.key)) return;
      if (this.sim.phase === "briefing" && (ev.key === " " || ev.key === "Enter")) {
        ev.preventDefault();
        this.confirmBriefing();
        return;
      }
      switch (ev.key) {
        case "ArrowLeft": case "a": case "A": this.left(); break;
        case "ArrowRight": case "d": case "D": this.right(); break;
        case "ArrowUp": case "w": case "W": case " ": this.jump(); break;
        case "ArrowDown": case "s": case "S": this.slide(); break;
        case "Escape": case "p": case "P": onPauseKey(); break;
        default: return;
      }
      ev.preventDefault();
    };
    let sx = 0, sy = 0, st = 0, tracking = false, fired = false;
    const SWIPE = 28;
    const down = (ev: PointerEvent) => {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      tracking = true;
      fired = false;
      sx = ev.clientX;
      sy = ev.clientY;
      st = performance.now();
    };
    const move = (ev: PointerEvent) => {
      if (!tracking || fired) return;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
      fired = true; // act mid-gesture for responsiveness
      if (Math.abs(dx) > Math.abs(dy)) (dx < 0 ? this.left() : this.right());
      else dy < 0 ? this.jump() : this.slide();
    };
    const up = (ev: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!fired) {
        move(ev);
        // quick tap: confirm briefing cards
        if (!fired && performance.now() - st < 250 && this.sim.phase === "briefing") this.confirmBriefing();
      }
    };
    const vis = () => {
      if (document.hidden) onHidden();
    };
    window.addEventListener("keydown", onKey);
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerup", up);
    surface.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", vis);
    this.detachInput = () => {
      window.removeEventListener("keydown", onKey);
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", up);
      surface.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", vis);
    };
  }

  destroy() {
    this.detachInput?.();
    this.listeners.clear();
    this.hudListeners.clear();
    getAudio().stopMusic();
  }
}
