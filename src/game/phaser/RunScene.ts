import * as Phaser from "phaser";
import manifest from "../art/asset-manifest.json";
import { THEMES } from "../art/backgrounds";
import { mix } from "../art/painter";
import { OBSTACLES } from "../logic/catalog";
import { SPAWN_Z } from "../logic/constants";
import type { SimEvent } from "../logic/sim";
import type { Entity, GovernanceStage, ObstacleKind } from "../logic/types";
import type { GameController } from "../controller";
import { assetUrl } from "../assets";
import { CROWD_VARIANTS } from "../art/props";
import { ROUTES, STOP_SPACING, stopSlug } from "../logic/routes";

export const VIEW_W = 360;
export const VIEW_H = 640;
const CX = VIEW_W / 2;
const HORIZON = 232;
const GROUND = 588;
const CAM_D = 6;
const LANE_W = 104;
const BASE_SCALE = 2.1;
const HEIGHT_PX = 82;

const proj = (z: number) => CAM_D / (CAM_D + Math.max(-CAM_D * 0.85, z));
const yAt = (z: number) => HORIZON + (GROUND - HORIZON) * proj(z);
const xAt = (lane: number, z: number) => CX + (lane - 1) * LANE_W * proj(z);

const STAGE_SKY: Record<GovernanceStage, [string, number]> = {
  control: ["#000000", 0],
  pressure: ["#5b5b6e", 0.25],
  crisis: ["#7a3424", 0.45],
  final: ["#30080f", 0.65],
  lost: ["#222222", 0.7],
};
const STAGE_TINT: Record<GovernanceStage, [number, number]> = {
  control: [0x000000, 0],
  pressure: [0xffb020, 0.05],
  crisis: [0xff5a1f, 0.11],
  final: [0xd0101e, 0.16],
  lost: [0x000000, 0.4],
};

interface Roadside {
  sprite: Phaser.GameObjects.Sprite;
  z: number;
  side: -1 | 1;
  offset: number;
  crowd: number; // crowd variant or -1 for props
  seed: number;
  frame: string;
  back?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
  size: number;
}

export class RunScene extends Phaser.Scene {
  private ctrl!: GameController;
  private reducedMotion = false;
  private sky!: Phaser.GameObjects.Graphics;
  private far!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private road!: Phaser.GameObjects.Graphics;
  private fxGfx!: Phaser.GameObjects.Graphics;
  private tint!: Phaser.GameObjects.Rectangle;
  private flash!: Phaser.GameObjects.Rectangle;
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private ride!: Phaser.GameObjects.Image;
  private shield!: Phaser.GameObjects.Image;
  private boss: Phaser.GameObjects.Sprite | null = null;
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private lastPos = new Map<number, { x: number; y: number; s: number; kind: string; z: number }>();
  private roadside: Roadside[] = [];
  private roadsideDist = 0;
  private buildingDist = 0;
  private decalDist = 0;
  private decals: { s: Phaser.GameObjects.Image; z: number; x: number }[] = [];
  private particles: Particle[] = [];
  private weather: Particle[] = [];
  private warnings: { lanes: number[]; t: number; icons: Phaser.GameObjects.Image[] }[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private stage: GovernanceStage = "control";
  private offset = 0;
  private time0 = 0;
  private unsub: (() => void) | null = null;
  private outfitKey = "chitti-classic";
  private lastSignLeg = 0;
  private demo: { house: Phaser.GameObjects.Image; van: Phaser.GameObjects.Image; jcb: Phaser.GameObjects.Sprite } | null = null;
  private train: Phaser.GameObjects.Image | null = null;

  constructor() {
    super("run");
  }

  init(data: { ctrl: GameController; reducedMotion: boolean }) {
    this.ctrl = data.ctrl;
    this.reducedMotion = data.reducedMotion;
    this.outfitKey = `chitti-${data.ctrl.config.outfit}`;
  }

  preload() {
    const failed = new Set<string>();
    this.load.on("loaderror", (file: Phaser.Loader.File) => failed.add(file.key));
    const atlases = manifest.atlases as Record<string, { png: string; json: string }>;
    for (const key of ["props", this.outfitKey]) {
      if (this.textures.exists(key)) continue;
      const a = atlases[key];
      this.load.atlas(key, assetUrl(a.png), assetUrl(a.json));
    }
    const lvl = this.ctrl.level;
    for (const layer of ["far", "near"]) {
      const key = `bg-${lvl}-${layer}`;
      if (this.textures.exists(key)) continue;
      this.load.image(key, assetUrl((manifest.images as Record<string, string>)[key]));
    }
    this.load.once("complete", () => {
      if (failed.size) this.registry.set("failedAssets", [...failed]);
    });
  }

  async create() {
    const failed: string[] = this.registry.get("failedAssets") ?? [];
    if (failed.length) await this.generateFallbackTextures(failed);
    this.build();
  }

  /** If the CDN is unreachable, draw the very same art locally (assets are procedural). */
  private async generateFallbackTextures(keys: string[]) {
    const { buildAtlases, buildImages } = await import("../art/sheets");
    const atlases = buildAtlases();
    const images = buildImages();
    for (const key of keys) {
      if (this.textures.exists(key)) this.textures.remove(key);
      const sheet = atlases[key];
      const img = sheet ? sheet.canvas : images[key];
      if (!img) continue;
      const canvas = document.createElement("canvas");
      canvas.width = img.w;
      canvas.height = img.h;
      canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.w, img.h), 0, 0);
      const tex = this.textures.addCanvas(key, canvas);
      if (sheet && tex) for (const [name, r] of Object.entries(sheet.frames)) tex.add(name, 0, r.x, r.y, r.w, r.h);
    }
  }

  private build() {
    const theme = THEMES[this.ctrl.level];
    this.sky = this.add.graphics().setDepth(-100);
    this.far = this.add
      .tileSprite(0, HORIZON + 8, VIEW_W, 96, `bg-${this.ctrl.level}-far`)
      .setOrigin(0, 1)
      .setDepth(-90)
      .setTileScale(1.4, 1.4);
    this.near = this.add
      .tileSprite(0, HORIZON + 10, VIEW_W, 72, `bg-${this.ctrl.level}-near`)
      .setOrigin(0, 1)
      .setDepth(-80)
      .setTileScale(1.6, 1.6);
    this.road = this.add.graphics().setDepth(-50);
    this.fxGfx = this.add.graphics().setDepth(3000);
    this.tint = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0).setOrigin(0).setDepth(2900);
    this.flash = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xffffff, 0).setOrigin(0).setDepth(3100);
    this.drawSky();

    this.shadow = this.add.ellipse(CX, GROUND, 56, 14, 0x000000, 0.28).setDepth(990);
    this.ride = this.add.image(CX, GROUND, "props", "fx-metro").setVisible(false).setDepth(995).setScale(2);
    this.player = this.add.sprite(CX, GROUND, this.outfitKey, "run-0").setOrigin(0.5, 54 / 56).setScale(2).setDepth(1000);
    this.shield = this.add.image(CX, GROUND, "props", "fx-shield").setOrigin(0.5, 1).setScale(2).setDepth(1001).setVisible(false);
    this.createAnims();

    // pre-populate roadside so the street is never empty
    for (let z = 2; z < SPAWN_Z; z += 2.6) this.spawnRoadside(z);
    for (let z = 2; z < SPAWN_Z; z += 4) {
      this.spawnBuilding(z, -1);
      this.spawnBuilding(z + 2, 1);
    }

    this.unsub = this.ctrl.onEvent((e) => this.onSimEvent(e));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub?.());
    this.time0 = this.time.now;
    this.cameras.main.setBackgroundColor(theme.skyBottom);
    this.ctrl.start();
    this.game.events.emit("run-ready");
  }

  private createAnims() {
    const k = this.outfitKey;
    const mk = (key: string, frames: string[], rate: number, repeat = -1) => {
      const full = `${k}:${key}`;
      if (!this.anims.exists(full))
        this.anims.create({ key: full, frames: frames.map((f) => ({ key: k, frame: f })), frameRate: rate, repeat });
      return full;
    };
    const keys = {
      run: mk("run", ["run-0", "run-1", "run-2", "run-3"], 10),
      panic: mk("panic", ["panic-0", "panic-1", "panic-2", "panic-3"], 13),
      jump: mk("jump", ["jump-0", "jump-1"], 4, 0),
      slide: mk("slide", ["slide-0", "slide-1"], 8),
      hit: mk("hit", ["hit-0", "hit-1"], 10),
    };
    this.registry.set("animKeys", keys);
    // alias so this.player.play("run") works
    this.player.anims.play(keys.run);
    if (!this.anims.exists("coin"))
      this.anims.create({ key: "coin", frames: [0, 1, 2, 3].map((i) => ({ key: "props", frame: `coin-${i}` })), frameRate: 10, repeat: -1 });
  }

  private anim(name: "run" | "panic" | "jump" | "slide" | "hit") {
    const keys = this.registry.get("animKeys") as Record<string, string>;
    const key = keys[name];
    if (this.player.anims.currentAnim?.key !== key) this.player.anims.play(key, true);
  }

  private drawSky() {
    const t = THEMES[this.ctrl.level];
    const [col, amt] = STAGE_SKY[this.stage];
    const top = Phaser.Display.Color.HexStringToColor(mix(t.skyTop, col, amt)).color;
    const bottom = Phaser.Display.Color.HexStringToColor(mix(t.skyBottom, col, amt * 0.8)).color;
    this.sky.clear();
    this.sky.fillGradientStyle(top, top, bottom, bottom, 1);
    this.sky.fillRect(0, 0, VIEW_W, HORIZON + 12);
    const [tc, ta] = STAGE_TINT[this.stage];
    this.tint.setFillStyle(tc, ta);
    this.far.setTint(this.stage === "control" ? 0xffffff : this.stage === "pressure" ? 0xe6e0f0 : this.stage === "crisis" ? 0xe0b0a0 : 0xa07080);
    this.near.setTint(this.stage === "control" ? 0xffffff : this.stage === "pressure" ? 0xeeeeee : this.stage === "crisis" ? 0xe8c0b0 : 0xb08890);
  }

  // ───────────────────────────── events ─────────────────────────────
  private onSimEvent(e: SimEvent) {
    switch (e.type) {
      case "hit":
        if (!this.reducedMotion) this.cameras.main.shake(180, 0.012);
        this.player.setTintFill(0xff4040);
        this.time.delayedCall(90, () => this.player.clearTint());
        this.floatText("OUCH!", CX, GROUND - 130, "#ff6b6b");
        break;
      case "shieldBlock":
        this.floatText("BIRYANI BLOCK!", CX, GROUND - 130, "#ffd34d");
        this.burst(CX, GROUND - 60, 14, [0xffd34d, 0xffffff]);
        break;
      case "coin":
        this.burst(xAt(this.ctrl.sim.player.x, 0), GROUND - 70 - this.ctrl.sim.player.y * HEIGHT_PX, 3, [0xffd447, 0xfff6c2]);
        break;
      case "potholeFixed":
        this.floatText("FIXED!", xAt(this.ctrl.sim.player.x, 0), GROUND - 110, "#7bdcff");
        this.burst(xAt(this.ctrl.sim.player.x, 0), GROUND - 10, 10, [0x8d8d99, 0xffffff]);
        break;
      case "jamCleared":
        this.floatText("JAM CLEARED!", CX, HORIZON + 140, "#7bdc7b");
        break;
      case "projectComplete":
        this.floatText("PROJECT DONE!", CX, GROUND - 140, "#ffb347");
        this.burst(CX, GROUND - 100, 18, [0xb5482f, 0xffd34d, 0xffffff]);
        break;
      case "projectStalled":
        this.floatText("PROJECT STALLED", CX, GROUND - 140, "#ff8a8a");
        break;
      case "powerup":
        this.flashScreen(0xffffff, 0.35);
        break;
      case "missionComplete":
      case "fcWon":
      case "bossDefeated":
        this.confetti();
        if (e.type === "bossDefeated" && this.boss) {
          const b = this.boss;
          this.boss = null;
          this.burst(b.x, b.y - 60, 30, [0xffffff, 0xffd34d, 0xff6b6b]);
          this.tweens.add({ targets: b, y: b.y - 200, alpha: 0, duration: 600, onComplete: () => b.destroy() });
        }
        break;
      case "missionFail":
        this.flashScreen(0xff0000, 0.25);
        break;
      case "stageChange":
        this.stage = e.to;
        this.drawSky();
        if (!this.reducedMotion) this.flashScreen(e.to === "control" ? 0xffffff : 0xff3030, 0.3);
        break;
      case "bossStart": {
        const lvl = this.ctrl.level;
        this.boss?.destroy();
        this.boss = this.add.sprite(CX, -40, "props", `boss-${lvl}-0`).setOrigin(0.5, 1).setScale(1.6).setDepth(400);
        this.tweens.add({ targets: this.boss, y: HORIZON + 60, duration: 900, ease: "Back.Out" });
        break;
      }
      case "bossEscaped":
        if (this.boss) {
          const b = this.boss;
          this.boss = null;
          this.tweens.add({ targets: b, y: -80, duration: 700, onComplete: () => b.destroy() });
        }
        break;
      case "bossHit":
        if (this.boss) {
          this.boss.setTintFill(0xffffff);
          this.time.delayedCall(80, () => this.boss?.clearTint());
        }
        break;
      case "bossWarn": {
        const icons = e.lanes.map((l) =>
          this.add.image(xAt(l, 18), yAt(18) - 12, "props", "fx-warn").setScale(2).setDepth(2000),
        );
        this.warnings.push({ lanes: e.lanes, t: 1.0, icons });
        break;
      }
      case "fcBriefing":
        this.flashScreen(0xff0000, 0.4);
        break;
      case "demolitionStart":
        this.startDemolitionSite();
        break;
      case "demolitionProgress":
        if (this.demo) this.floatText(`STAY ORDER ${e.got}/${e.needed}`, this.demo.jcb.x, this.demo.jcb.y - 70, "#ff6b6b");
        break;
      case "demolitionStopped":
        this.endDemolitionSite(true);
        break;
      case "demolitionDone":
        this.endDemolitionSite(false);
        break;
    }
  }

  /** HIDRA van + JCB threatening a family's house, shown by the roadside up ahead. */
  private startDemolitionSite() {
    this.demo?.house.destroy();
    this.demo?.van.destroy();
    this.demo?.jcb.destroy();
    const y = HORIZON + 78;
    const house = this.add.image(VIEW_W - 58, y, "props", "dm-house").setOrigin(0.5, 1).setScale(1.5).setDepth(450);
    const jcb = this.add.sprite(VIEW_W - 150, y + 6, "props", "dm-jcb-0").setOrigin(0.5, 1).setScale(1.4).setDepth(451);
    const van = this.add.image(-80, y + 10, "props", "dm-van").setOrigin(0.5, 1).setScale(1.3).setDepth(452);
    this.tweens.add({ targets: van, x: 70, duration: 800, ease: "Quad.Out" });
    this.demo = { house, van, jcb };
  }

  private endDemolitionSite(saved: boolean) {
    const d = this.demo;
    if (!d) return;
    this.demo = null;
    if (saved) {
      this.floatText("DEMOLITION STOPPED!", CX, HORIZON + 20, "#7bdc7b");
      d.jcb.setFrame("dm-jcb-0");
      // Mr. Ranga and Tondal Reddy storm out of the HIDRA van, furious
      const duo = (["ranga", "tondal"] as const).map((who, i) => {
        const s = this.add.sprite(d.van.x + 10, d.van.y - 6, "props", `np-${who}-0`).setOrigin(0.5, 1).setScale(1.8).setDepth(1990);
        // jump out, then storm down the kerb towards the CM (below the toast area)
        this.tweens.chain({
          targets: s,
          tweens: [
            { x: d.van.x + 40 + i * 30, y: d.van.y + 14, duration: 300, delay: 150 + i * 200, ease: "Back.Out" },
            { x: 40 + i * 52, y: HORIZON + 182, scale: 2.6, duration: 700, ease: "Quad.Out" },
          ],
        });
        return s;
      });
      const stomp = this.time.addEvent({ delay: 160, loop: true, callback: () => duo.forEach((s, i) => s.setFrame(`np-${i ? "tondal" : "ranga"}-${Math.floor(this.time.now / 160 + i) % 2}`)) });
      this.time.delayedCall(1100, () => this.floatText("GRRR!", 92, HORIZON + 112, "#ff8a3d"));
      this.time.delayedCall(3200, () => {
        stomp.remove();
        this.tweens.add({ targets: duo, alpha: 0, duration: 500, onComplete: () => duo.forEach((s) => s.destroy()) });
        this.tweens.add({ targets: [d.van, d.jcb], x: "-=320", duration: 1400, delay: 300, ease: "Quad.In" });
      });
    } else {
      d.jcb.setFrame("dm-jcb-1");
      d.house.setFrame("dm-rubble");
      this.burst(d.house.x, d.house.y - 40, 40, [0xc98b5a, 0x8a7a6a, 0xe8d5b0, 0xffffff]);
      if (!this.reducedMotion) this.cameras.main.shake(400, 0.018);
      this.floatText("BUILDING DEMOLISHED!", CX, HORIZON + 30, "#ff6b6b");
    }
    this.time.delayedCall(saved ? 3400 : 2200, () => {
      this.tweens.add({ targets: [d.house, d.van, d.jcb], alpha: 0, duration: 600, onComplete: () => [d.house, d.van, d.jcb].forEach((o) => o.destroy()) });
    });
  }

  private flashScreen(color: number, alpha: number) {
    if (this.reducedMotion) alpha *= 0.4;
    this.flash.setFillStyle(color, alpha);
    this.tweens.add({ targets: this.flash, fillAlpha: 0, duration: 350 });
  }

  private floatText(msg: string, x: number, y: number, color: string) {
    const t =
      this.texts.find((x) => !x.visible) ??
      this.texts[this.texts.push(this.add.text(0, 0, "", { fontFamily: "monospace", fontStyle: "bold" }).setDepth(3050)) - 1];
    t.setText(msg)
      .setStyle({ fontFamily: "monospace", fontSize: "18px", fontStyle: "bold", color, stroke: "#1b1020", strokeThickness: 4 })
      .setOrigin(0.5)
      .setPosition(x, y)
      .setAlpha(1)
      .setVisible(true);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, onComplete: () => t.setVisible(false) });
  }

  private burst(x: number, y: number, n: number, colors: number[]) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 140;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.5 + Math.random() * 0.3, color: colors[i % colors.length], size: 3 });
    }
  }

  private confetti() {
    const cols = [0xf57c12, 0xffffff, 0x2f9e55, 0x3f7fd9, 0xffd34d, 0xff6bb5];
    const n = this.reducedMotion ? 20 : 70;
    for (let i = 0; i < n; i++)
      this.particles.push({
        x: Math.random() * VIEW_W,
        y: -10 - Math.random() * 120,
        vx: -30 + Math.random() * 60,
        vy: 120 + Math.random() * 120,
        life: 2.2,
        color: cols[i % cols.length],
        size: 4,
      });
  }

  // ───────────────────────────── per-frame ─────────────────────────────
  update(_time: number, deltaMs: number) {
    if (!this.player) return;
    const dt = deltaMs / 1000;
    this.ctrl.tick(dt);
    const sim = this.ctrl.sim;
    const running = !this.ctrl.paused && sim.phase === "running";
    const moved = running ? sim.speed * Math.min(dt, 0.1) : 0;
    this.offset = (this.offset + moved) % 1000;

    this.drawRoad();
    this.updateDecals(moved);
    this.updateRoadside(moved, dt);
    this.renderEntities();
    this.renderPlayer(running);
    this.renderBoss();
    this.updateWarnings(running ? dt : 0);
    this.updateParticles(running ? dt : dt * 0.3);
    this.updateWeather(running ? dt : 0);
    this.updateTrain(dt);
    this.far.tilePositionX = sim.player.x * 6 + this.offset * 0.02;
    this.near.tilePositionX = sim.player.x * 12 + this.offset * 0.05;
  }

  private drawRoad() {
    const t = THEMES[this.ctrl.level];
    const g = this.road;
    g.clear();
    const col = (h: string) => Phaser.Display.Color.HexStringToColor(h).color;
    const road = col(t.road);
    const roadDark = col(t.roadDark);
    const mark = col(t.laneMark);
    const edge = col(t.edge);
    const side = col(t.sidewalk);
    const dirt = col("#7a6248");
    const dirtDark = col("#6b5540");
    const sideAlt = col(t.sidewalkAlt);
    g.fillStyle(side, 1);
    g.fillRect(0, HORIZON, VIEW_W, VIEW_H - HORIZON);
    const seg = 3.2;
    const start = -this.offset % (seg * 2);
    const half = 1.62 * LANE_W;
    for (let z = SPAWN_Z + 6; z > -CAM_D * 0.8; z -= seg) {
      const z0 = z + start;
      const z1 = z0 - seg;
      const i = Math.floor((z0 + this.offset) / seg);
      const y0 = yAt(z0);
      const y1 = yAt(z1);
      if (y1 < HORIZON) continue;
      const p0 = proj(z0);
      const p1 = proj(z1);
      // sidewalk stripes
      g.fillStyle(i % 2 ? side : sideAlt, 1);
      g.fillRect(0, y0, VIEW_W, y1 - y0 + 1);
      // road surface – long damaged stretches turn to broken dirt & gravel
      const damaged = this.isDamaged(i);
      g.fillStyle(damaged ? (i % 2 ? dirt : dirtDark) : i % 2 ? road : roadDark, 1);
      g.fillPoints(
        [
          { x: CX - half * p0, y: y0 },
          { x: CX + half * p0, y: y0 },
          { x: CX + half * p1, y: y1 + 1 },
          { x: CX - half * p1, y: y1 + 1 },
        ],
        true,
      );
      // kerbs
      const kerb = i % 2 ? edge : 0xf5f5f5;
      g.fillStyle(kerb, 1);
      for (const s of [-1, 1]) {
        g.fillPoints(
          [
            { x: CX + s * half * p0, y: y0 },
            { x: CX + s * (half + 10) * p0, y: y0 },
            { x: CX + s * (half + 10) * p1, y: y1 + 1 },
            { x: CX + s * half * p1, y: y1 + 1 },
          ],
          true,
        );
      }
      if (damaged) {
        // ragged leftover asphalt islands on a damaged stretch
        g.fillStyle(roadDark, 1);
        const w = half * 0.35;
        const xo = (((i * 53) % 7) - 3) * 18;
        g.fillPoints(
          [
            { x: CX + (xo - w) * p0, y: y0 },
            { x: CX + (xo + w * 0.6) * p0, y: y0 },
            { x: CX + (xo + w) * p1, y: y1 },
            { x: CX + (xo - w * 0.4) * p1, y: y1 },
          ],
          true,
        );
      }
      // dashed lane markings (worn away on damaged stretches)
      if (i % 2 === 0 && !damaged) {
        g.fillStyle(mark, 1);
        for (const l of [0.5, 1.5]) {
          const xo = (l - 1) * LANE_W;
          g.fillPoints(
            [
              { x: CX + xo * p0 - 2 * p0, y: y0 },
              { x: CX + xo * p0 + 2 * p0, y: y0 },
              { x: CX + xo * p1 + 2 * p1, y: y1 },
              { x: CX + xo * p1 - 2 * p1, y: y1 },
            ],
            true,
          );
        }
      }
    }
    // horizon haze
    g.fillStyle(col(t.skyBottom), 0.35);
    g.fillRect(0, HORIZON, VIEW_W, 10);
  }

  /** Back row: buildings and malls packed shoulder to shoulder behind the shops. */
  private spawnBuilding(z: number, side: -1 | 1) {
    const theme = THEMES[this.ctrl.level];
    const frame = Phaser.Utils.Array.GetRandom(theme.buildings) as string;
    const sprite = this.add.sprite(0, 0, "props", frame).setOrigin(0.5, 1);
    this.roadside.push({ sprite, z, side, offset: 78 + Math.random() * 8, crowd: -1, seed: Math.random() * 10, frame, back: true });
  }

  /** Deterministic long damaged-road stretches (blocks of 6 segments ≈ 19 m). */
  private isDamaged(segment: number) {
    const block = Math.floor(segment / 6);
    const h = ((block * 2654435761) >>> 0) % 100;
    const ratio = this.ctrl.level === "pothole" ? 45 : 28;
    return h < ratio;
  }

  /** Cracks, patches, gravel and small holes painted on the road surface (no collision). */
  private updateDecals(moved: number) {
    this.decalDist += moved;
    while (this.decalDist > 2.2) {
      this.decalDist -= 2.2;
      const frame = Phaser.Utils.Array.GetRandom(["dc-crack", "dc-crack2", "dc-patch", "dc-gravel", "dc-hole", "dc-crack"]) as string;
      const s = this.add.image(0, 0, "props", frame).setOrigin(0.5, 0.5);
      this.decals.push({ s, z: SPAWN_Z, x: -1.3 + Math.random() * 2.6 });
    }
    for (const d of this.decals) {
      d.z -= moved;
      const p = proj(d.z);
      d.s.setPosition(CX + d.x * LANE_W * p, yAt(d.z)).setScale(BASE_SCALE * p).setDepth(-40 + (SPAWN_Z - d.z) * 0.01);
    }
    this.decals = this.decals.filter((d) => {
      if (d.z < -4) {
        d.s.destroy();
        return false;
      }
      return true;
    });
  }

  private spawnRoadside(z: number, forced?: { frame: string; side: -1 | 1 }) {
    const theme = THEMES[this.ctrl.level];
    const side = forced?.side ?? ((Math.random() < 0.5 ? -1 : 1) as -1 | 1);
    const crowdChance = 0.55 * theme.crowdDensity * (this.stage === "control" ? 1 : this.stage === "pressure" ? 1.1 : 1.4);
    const isCrowd = !forced && Math.random() < crowdChance;
    const frame = forced?.frame ?? (isCrowd ? "crowd-0-idle-0" : Phaser.Utils.Array.GetRandom(theme.roadside));
    const sprite = this.add.sprite(0, 0, "props", frame).setOrigin(0.5, 1);
    this.roadside.push({
      sprite,
      z,
      side,
      offset: forced ? 20 : isCrowd ? 12 + Math.random() * 30 : 34 + Math.random() * 20,
      crowd: isCrowd ? Math.floor(Math.random() * CROWD_VARIANTS) : -1,
      seed: Math.random() * 10,
      frame,
    });
  }

  private crowdPose(seed: number): "idle" | "cheer" | "protest" | "chant" {
    const r = (seed * 7.3) % 1;
    switch (this.stage) {
      case "control":
        return r < 0.75 ? "cheer" : "idle";
      case "pressure":
        return r < 0.4 ? "idle" : r < 0.75 ? "chant" : "cheer";
      case "crisis":
        return r < 0.6 ? "protest" : "chant";
      default:
        return r < 0.8 ? "protest" : "chant";
    }
  }

  private updateRoadside(moved: number, dt: number) {
    const sim = this.ctrl.sim;
    this.roadsideDist += moved;
    // dense street frontage on both sides: shops/posters/crowds in front, packed buildings behind
    this.buildingDist += moved;
    while (this.roadsideDist > 2.6) {
      this.roadsideDist -= 2.6;
      this.spawnRoadside(SPAWN_Z);
    }
    while (this.buildingDist > 4) {
      this.buildingDist -= 4;
      this.spawnBuilding(SPAWN_Z, -1);
      this.spawnBuilding(SPAWN_Z + 2, 1);
    }
    // green route signboard so it reaches the player exactly at the next real stop
    const leg = Math.floor((sim.distance + SPAWN_Z) / STOP_SPACING);
    if (leg > this.lastSignLeg) {
      this.lastSignLeg = leg;
      const stops = ROUTES[this.ctrl.level].stops;
      this.spawnRoadside(SPAWN_Z, { frame: `sign-${stopSlug(stops[leg % stops.length])}`, side: leg % 2 ? 1 : -1 });
    }
    const half = 1.62 * LANE_W;
    const beat = Math.floor((this.time.now - this.time0) / (this.stage === "final" ? 160 : 260)) % 2;
    for (const r of this.roadside) {
      r.z -= moved;
      const p = proj(r.z);
      r.sprite
        .setPosition(CX + r.side * (half + 18 + r.offset) * p, yAt(r.z))
        .setScale(BASE_SCALE * p * (r.crowd >= 0 ? 1 : r.back ? 1.25 : 1.1))
        .setDepth((r.back ? 700 : 900) - r.z * 10); // never mirrored: signboards carry text
      if (r.crowd >= 0) r.sprite.setFrame(`crowd-${r.crowd}-${this.crowdPose(r.seed)}-${(beat + Math.floor(r.seed)) % 2}`);
      else if (r.frame === "rs-lamp-broken" || r.frame === "rs-signal-broken")
        // broken lights flicker irregularly
        r.sprite.setFrame(Math.sin(this.time.now / 37 + r.seed * 11) > 0.6 ? `${r.frame}-on` : r.frame);
      r.sprite.setAlpha(r.z > SPAWN_Z - 6 ? Math.max(0, (SPAWN_Z - r.z) / 6) : 1);
    }
    this.roadside = this.roadside.filter((r) => {
      if (r.z < -3) {
        r.sprite.destroy();
        return false;
      }
      return true;
    });
    void sim;
    void dt;
  }

  private frameFor(e: Entity): string {
    if (e.type === "coin") return "coin-0";
    if (e.type === "powerup") return `pu-${e.kind}`;
    if (e.type === "token") return `tk-${e.kind}`;
    if (e.kind === "bossShot") return `shot-${this.ctrl.level}`;
    if (e.kind === "pothole" && e.fixed) return "ob-pothole-fixed";
    return `ob-${e.kind}`;
  }

  private renderEntities() {
    const sim = this.ctrl.sim;
    const seen = new Set<number>();
    const bob = Math.sin((this.time.now - this.time0) / 180) * 4;
    for (const e of sim.entities) {
      if (e.z > SPAWN_Z + 4) continue;
      seen.add(e.id);
      let s = this.sprites.get(e.id);
      if (!s) {
        s = this.add.sprite(0, 0, "props", this.frameFor(e)).setOrigin(0.5, 1);
        if (e.type === "coin") s.play("coin");
        this.sprites.set(e.id, s);
      }
      const frame = this.frameFor(e);
      if (e.type !== "coin" && s.frame.name !== frame) s.setFrame(frame);
      // long vehicles stay alongside the player until their tail passes
      const rz = e.z >= 0 ? e.z : Math.min(0, e.z + e.length) - 0.02;
      const p = proj(rz);
      const lift = e.type === "obstacle" ? 0 : (e.height * HEIGHT_PX + 10 + bob) * p;
      const x = xAt(e.lane + e.laneOffset, rz);
      const y = yAt(rz) - lift;
      const scale =
        BASE_SCALE * p * (e.type === "obstacle" ? (e.kind === "bossShot" ? 1.6 : e.kind === "pothole" ? 1.35 : e.kind === "crater" ? 1.2 : 1) : 1.5);
      s.setPosition(x, y).setScale(scale).setDepth(1000 - rz * 10 + (e.type === "obstacle" ? 0 : 1));
      s.setAlpha(e.z > SPAWN_Z - 4 ? Math.max(0.2, (SPAWN_Z + 4 - e.z) / 8) : 1);
      if (e.type === "obstacle" && (OBSTACLES[e.kind as ObstacleKind].avoid === "lane" || e.kind === "pothole")) s.setAlpha(s.alpha);
      this.lastPos.set(e.id, { x, y, s: scale, kind: e.kind, z: e.z });
    }
    for (const [id, s] of this.sprites) {
      if (seen.has(id)) continue;
      const lp = this.lastPos.get(id);
      if (lp && lp.z > 1.5 && lp.kind === "jam") {
        const poof = this.add.image(lp.x, lp.y - 20 * lp.s, "props", "fx-poof").setScale(lp.s * 1.5).setDepth(2000);
        this.tweens.add({ targets: poof, scale: lp.s * 3, alpha: 0, duration: 400, onComplete: () => poof.destroy() });
      }
      s.destroy();
      this.sprites.delete(id);
      this.lastPos.delete(id);
    }
  }

  private renderPlayer(running: boolean) {
    const sim = this.ctrl.sim;
    const p = sim.player;
    const x = xAt(p.x, 0);
    const lift = p.y * HEIGHT_PX;
    const metro = (sim.powerups.metro ?? 0) > 0;
    const tanker = (sim.powerups.tankerShield ?? 0) > 0;
    const extra = metro ? 26 : tanker ? 18 : 0;
    this.player.setPosition(x, GROUND - lift - extra);
    this.shadow.setPosition(x, GROUND + 2).setScale(Math.max(0.4, 1 - p.y * 0.3));
    this.player.anims.timeScale = running ? Math.max(0.8, sim.speed / 14) : 0;
    if (p.hitFlash > 0) this.anim("hit");
    else if (sim.isFlying || p.jumpT >= 0) this.anim("jump");
    else if (p.slideT >= 0) this.anim("slide");
    else if (this.stage === "crisis" || this.stage === "final") this.anim("panic");
    else this.anim("run");
    // invulnerability blink
    this.player.setAlpha(p.invuln > 0 && Math.floor(this.time.now / 80) % 2 ? 0.45 : 1);

    // ride sprite: metro car / promise rocket / water tanker
    if (metro || sim.isFlying || tanker) {
      const frame = metro ? "fx-metro" : sim.isFlying ? "fx-rocket" : "fx-tanker";
      this.ride
        .setFrame(frame)
        .setVisible(true)
        .setOrigin(0.5, metro ? 0.1 : sim.isFlying ? 0.05 : 0.3)
        .setPosition(x, GROUND - lift - extra)
        .setScale(metro ? 2 : 2)
        .setDepth(sim.isFlying ? 999 : 1002);
    } else this.ride.setVisible(false);
    const shielded = (sim.powerups.biryani ?? 0) > 0;
    this.shield
      .setVisible(shielded)
      .setPosition(x, GROUND - lift - extra + 6)
      .setAlpha(0.5 + Math.sin(this.time.now / 120) * 0.3);

    // power-up flourish lines
    const g = this.fxGfx;
    g.clear();
    if ((sim.powerups.chai ?? 0) > 0 && running) {
      g.lineStyle(2, 0xffffff, 0.35);
      for (let i = 0; i < 8; i++) {
        const yy = (i * 83 + this.time.now * 0.9) % VIEW_H;
        const xx = i % 2 ? 12 : VIEW_W - 12;
        g.lineBetween(xx, yy, xx, yy + 40);
      }
    }
    if ((sim.powerups.fileCollector ?? 0) > 0) {
      g.lineStyle(2, 0x3b9be0, 0.6);
      g.strokeCircle(x, GROUND - lift - 50, 46 + Math.sin(this.time.now / 100) * 4);
    }
    for (const pt of this.particles) {
      g.fillStyle(pt.color, Math.min(1, pt.life * 2));
      g.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    for (const w of this.weather) {
      if (this.stage === "final") {
        g.lineStyle(1, 0x9fc7ff, 0.55);
        g.lineBetween(w.x, w.y, w.x - 3, w.y + 10);
      } else {
        g.fillStyle(0xf5f2ea, 0.85);
        g.fillRect(w.x, w.y, 7, 5);
        g.fillStyle(0x777777, 0.85);
        g.fillRect(w.x + 1, w.y + 1, 5, 1);
      }
    }
  }

  /** Hyderabad Metro trains glide along the skyline on metro routes. */
  private updateTrain(dt: number) {
    const lvl = this.ctrl.level;
    if (lvl !== "traffic" && lvl !== "water") return;
    if (!this.train) {
      // runs on the viaduct deck drawn in the near layer (traffic) / above the skyline (water)
      const deckY = lvl === "traffic" ? HORIZON - 33 : HORIZON - 40;
      this.train = this.add.image(-300, deckY, "props", "fx-metro-train").setOrigin(0, 1).setScale(1.2).setDepth(-79);
      this.train.setData("dir", 1);
    }
    const dir = this.train.getData("dir") as number;
    this.train.x += dir * 70 * dt;
    if (this.train.x > VIEW_W + 400 || this.train.x < -600) {
      const nd = -dir;
      this.train.setData("dir", nd).setFlipX(nd < 0);
      this.train.x = nd > 0 ? -300 : VIEW_W + 200;
    }
  }

  private renderBoss() {
    if (this.demo) {
      // the JCB keeps swinging at the house while the clock runs
      this.demo.jcb.setFrame(Math.floor(this.time.now / 300) % 2 ? "dm-jcb-1" : "dm-jcb-0");
      this.demo.house.x = VIEW_W - 58 + (Math.floor(this.time.now / 300) % 2 && !this.reducedMotion ? 1 : 0);
    }
    if (!this.boss) return;
    const t = (this.time.now - this.time0) / 1000;
    this.boss.x = CX + Math.sin(t * 1.6) * 70;
    this.boss.setFrame(`boss-${this.ctrl.level}-${Math.floor(t * 4) % 2}`);
  }

  private updateWarnings(dt: number) {
    for (const w of this.warnings) {
      w.t -= dt;
      for (const ic of w.icons) ic.setVisible(Math.floor(w.t * 10) % 2 === 0);
    }
    for (const w of this.warnings.filter((x) => x.t <= 0)) w.icons.forEach((i) => i.destroy());
    this.warnings = this.warnings.filter((x) => x.t > 0);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt * (p.life > 1.5 ? 0.1 : 1);
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < VIEW_H + 20);
  }

  private updateWeather(dt: number) {
    const target = this.reducedMotion ? 0 : this.stage === "final" ? 70 : this.stage === "crisis" ? 10 : 0;
    while (this.weather.length < target)
      this.weather.push({ x: Math.random() * VIEW_W, y: -Math.random() * VIEW_H, vx: 0, vy: 0, life: 1, color: 0, size: 1 });
    if (this.weather.length > target) this.weather.length = target;
    const final = this.stage === "final";
    for (const w of this.weather) {
      w.y += (final ? 520 : 70) * dt;
      w.x += (final ? -80 : 30 + Math.sin(w.y / 30) * 40) * dt;
      if (w.y > VIEW_H) {
        w.y = -10;
        w.x = Math.random() * (VIEW_W + 40);
      }
    }
    // lightning in the final stage
    if (final && !this.reducedMotion && dt > 0 && Math.random() < dt * 0.25) this.flashScreen(0xffffff, 0.5);
  }
}
