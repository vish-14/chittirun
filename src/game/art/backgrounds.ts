import { Rng } from "../logic/rng";
import type { LevelId } from "../logic/types";
import { PixelCanvas, mix, shade, text, type Frame } from "./painter";

export interface LevelTheme {
  skyTop: string;
  skyBottom: string;
  far: string;
  near: string;
  road: string;
  roadDark: string;
  laneMark: string;
  edge: string;
  sidewalk: string;
  sidewalkAlt: string;
  roadside: string[];
  /** back row: packed apartments, complexes and malls standing shoulder to shoulder */
  buildings: string[];
  crowdDensity: number;
}

export const THEMES: Record<LevelId, LevelTheme> = {
  "old-city": {
    skyTop: "#3b2a5c", skyBottom: "#f29a6b", far: "#6b4466", near: "#a8645a",
    road: "#6a5f5a", roadDark: "#5c524d", laneMark: "#e8dcc0", edge: "#d9b98a",
    sidewalk: "#b08a62", sidewalkAlt: "#9c7752",
    roadside: ["rs-poster-cmdown", "rs-poster-wewant", "rs-poster-jai", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "rs-arch", "rs-bangles", "rs-paan", "rs-irani", "rs-biryani", "rs-paan2", "rs-lamp-broken", "rs-poster-football", "rs-fanflags", "rs-chai"], buildings: ["bd-apartment", "bd-apartment3", "bd-complex", "bd-apartment", "rs-arch", "bd-complex"], crowdDensity: 1,
  },
  traffic: {
    skyTop: "#1d2a4f", skyBottom: "#e3a35f", far: "#3a4466", near: "#4d5a7a",
    road: "#4a4c55", roadDark: "#40424a", laneMark: "#f5f5f5", edge: "#f5d01b",
    sidewalk: "#8a8d96", sidewalkAlt: "#7a7d86",
    roadside: ["rs-poster-cmdown", "rs-poster-wewant", "rs-poster-jai", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "rs-metro-pillar", "rs-mall", "rs-billboard", "rs-signal-broken", "rs-paan", "rs-lamp-broken", "rs-poster-football2", "rs-shop", "rs-metro-pillar"], buildings: ["bd-mall2", "rs-mall", "bd-complex", "bd-apartment2", "bd-apartment", "bd-mall2"], crowdDensity: 0.8,
  },
  pothole: {
    skyTop: "#4a7bb5", skyBottom: "#f2d9a0", far: "#7a8aa0", near: "#a08060",
    road: "#5a5650", roadDark: "#4e4a45", laneMark: "#d8d0b8", edge: "#f07b17",
    sidewalk: "#a8906a", sidewalkAlt: "#987e58",
    roadside: ["rs-poster-cmdown", "rs-poster-wewant", "rs-poster-jai", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "rs-crane", "rs-roadwork", "rs-lamp-broken", "rs-paan2", "rs-biryani", "rs-football-kids", "rs-poster-football", "rs-chai"], buildings: ["bd-apartment", "bd-complex", "bd-apartment3", "rs-mall", "bd-apartment2"], crowdDensity: 0.9,
  },
  water: {
    skyTop: "#5aa0d8", skyBottom: "#f7e3b5", far: "#a0786a", near: "#c4a07a",
    road: "#6e665c", roadDark: "#625a51", laneMark: "#efe6d0", edge: "#3d8bd9",
    sidewalk: "#c2a47c", sidewalkAlt: "#b0926a",
    roadside: ["rs-poster-cmdown", "rs-poster-wewant", "rs-poster-jai", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "rs-watertower", "rs-pots", "rs-mall", "rs-metro-pillar", "rs-paan", "rs-irani", "rs-lamp-broken", "rs-fanflags"], buildings: ["bd-apartment2", "rs-mall", "bd-mall2", "bd-complex", "bd-apartment", "rs-watertower"], crowdDensity: 1.1,
  },
  secretariat: {
    skyTop: "#2c3e6b", skyBottom: "#9fc0e0", far: "#5a6a8a", near: "#7a8a9a",
    road: "#55585e", roadDark: "#4b4e54", laneMark: "#ffffff", edge: "#e8e2d4",
    sidewalk: "#b8b2a4", sidewalkAlt: "#a8a294",
    roadside: ["rs-poster-cmdown", "rs-poster-wewant", "rs-poster-jai", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "rs-column", "rs-flagpole", "rs-tree", "rs-files", "rs-paan2", "rs-lamp-broken", "rs-poster-football2", "rs-irani"], buildings: ["bd-complex", "bd-apartment", "bd-mall2", "bd-apartment3", "rs-column"], crowdDensity: 1.2,
  },
};

const W = 256;

function wrapRect(c: PixelCanvas, x: number, y: number, w: number, h: number, col: string) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.px((((x + i) % W) + W) % W, y + j, col);
}
function wrapEllipse(c: PixelCanvas, cx: number, cy: number, rx: number, ry: number, col: string) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / (rx + 0.35);
      const dy = (y - cy) / (ry + 0.35);
      if (dx * dx + dy * dy <= 1) c.px(((x % W) + W) % W, y, col);
    }
}

function windows(c: PixelCanvas, x: number, y: number, w: number, h: number, lit: string, rng: Rng, dark?: string) {
  for (let j = y + 2; j < y + h - 2; j += 4)
    for (let i = x + 2; i < x + w - 2; i += 3) if (rng.chance(0.55)) wrapRect(c, i, j, 1, 2, rng.chance(0.6) ? lit : dark ?? lit);
}

/** Charminar silhouette: four corner minarets, central arch, upper gallery. */
function charminar(c: PixelCanvas, cx: number, base: number, col: string, hi: string, sky: string) {
  const w = 40;
  const x0 = cx - w / 2;
  wrapRect(c, x0, base - 46, w, 46, col);
  // arch opening shows the sky
  for (let y = base - 30; y < base; y++)
    for (let x = cx - 8; x <= cx + 8; x++) {
      const dy = y - (base - 22);
      if (y >= base - 22 || (x - cx) ** 2 + dy * dy <= 64) c.px(((x % W) + W) % W, y, sky);
    }
  wrapRect(c, x0 - 2, base - 50, w + 4, 4, hi); // gallery
  for (let k = 0; k < 7; k++) wrapRect(c, x0 + 2 + k * 6, base - 56, 3, 6, col); // screen arches
  wrapRect(c, x0, base - 58, w, 2, hi);
  for (const mx of [x0 - 3, x0 + w - 3]) {
    wrapRect(c, mx, base - 84, 6, 84, col);
    for (const by of [base - 62, base - 74]) wrapRect(c, mx - 1, by, 8, 2, hi); // balconies
    wrapEllipse(c, mx + 3, base - 86, 3, 3, hi); // domes
    wrapRect(c, mx + 2, base - 92, 2, 4, col);
  }
}

function far(level: LevelId): PixelCanvas {
  const t = THEMES[level];
  const H = 96;
  const c = new PixelCanvas(W, H);
  const rng = new Rng(level.length * 977 + 13);
  const col = t.far;
  const hi = shade(col, 0.15);
  switch (level) {
    case "old-city":
      charminar(c, 128, H, shade(col, 0.2), shade(col, 0.4), t.skyBottom);
      for (let i = 0; i < 9; i++) {
        if (i === 4) continue; // keep the Charminar clear
        const x = i * 29 + rng.int(0, 8);
        const h = rng.int(26, 50);
        wrapRect(c, x, H - h, 22, h, col);
        wrapEllipse(c, x + 11, H - h, 10, 8, col); // dome
        wrapRect(c, x + 10, H - h - 12, 2, 5, col);
        if (i % 3 === 0) {
          // pair of slender minaret towers
          for (const mx of [x - 2, x + 22]) {
            wrapRect(c, mx, H - h - 22, 3, h + 22, hi);
            wrapEllipse(c, mx + 1, H - h - 23, 2, 3, hi);
          }
        }
        for (let k = 0; k < 3; k++) wrapEllipse(c, x + 5 + k * 6, H - h + 12, 1.5, 3, shade(col, -0.3));
      }
      break;
    case "traffic":
      for (let i = 0; i < 12; i++) {
        const x = i * 22 + rng.int(-3, 3);
        const h = rng.int(36, 88);
        const w = rng.int(14, 20);
        wrapRect(c, x, H - h, w, h, i % 2 ? col : hi);
        windows(c, x, H - h, w, h, "#ffd98a", rng, "#8a9ac0");
        if (rng.chance(0.4)) wrapRect(c, x + w / 2, H - h - 6, 1, 6, "#ff4d4d");
      }
      break;
    case "pothole":
      // Golconda Fort on its hill
      wrapEllipse(c, 190, H + 6, 46, 30, shade(col, -0.15));
      wrapRect(c, 160, H - 34, 60, 10, shade(col, 0.1));
      for (let k = 0; k < 15; k++) wrapRect(c, 160 + k * 4, H - 38, 2, 4, shade(col, 0.1)); // crenellations
      wrapRect(c, 182, H - 52, 14, 18, shade(col, 0.1));
      wrapEllipse(c, 189, H - 53, 7, 5, shade(col, 0.1));
      for (let i = 0; i < 8; i++) {
        if (i >= 5 && i <= 6) continue;
        const x = i * 32 + rng.int(0, 10);
        const h = rng.int(30, 70);
        wrapRect(c, x, H - h, 20, h, col);
        for (let j = H - h; j < H; j += 6) wrapRect(c, x - 1, j, 22, 1, shade(col, -0.25)); // scaffolding
        for (let k = x; k < x + 20; k += 5) for (let j = H - h; j < H; j++) if ((j + k) % 7 === 0) c.px(((k % W) + W) % W, j, shade(col, -0.25));
        if (i % 2 === 0) {
          wrapRect(c, x + 24, H - h - 20, 2, h + 20, "#d8b40e");
          wrapRect(c, x + 6, H - h - 20, 34, 2, "#d8b40e");
        }
      }
      break;
    case "water":
      // Cyber Towers-style curved glass IT tower + neighbours
      wrapRect(c, 120, H - 84, 34, 84, "#5a7fa8");
      wrapEllipse(c, 137, H - 84, 17, 9, "#7aa6d0");
      for (let y = H - 78; y < H - 4; y += 4) for (let x = 123; x < 152; x += 3) c.px(x, y, "#bfe0ff");
      for (const [x, h] of [[96, 60], [160, 70], [182, 52], [70, 46]] as const) {
        wrapRect(c, x, H - h, 18, h, "#6b8aa8");
        for (let y = H - h + 3; y < H - 3; y += 4) for (let xx = x + 2; xx < x + 16; xx += 3) c.px(xx, y, "#d8ecff");
      }
      // Deccan-style balancing boulders
      for (let i = 0; i < 10; i++) {
        const x = i * 26 + rng.int(0, 8);
        const r = rng.int(8, 16);
        wrapEllipse(c, x, H - r + 2, r + 4, r, col);
        wrapEllipse(c, x + rng.int(-3, 3), H - 2 * r - 3, r * 0.7, r * 0.6, hi);
        if (rng.chance(0.5)) wrapEllipse(c, x + 2, H - 2 * r - 3 - r * 0.9, r * 0.45, r * 0.4, shade(col, 0.25));
      }
      wrapEllipse(c, 200, 22, 12, 12, "#fff1b8");
      break;
    case "secretariat": {
      const base = H - 44;
      wrapRect(c, 40, base, 176, 44, col);
      for (let k = 0; k < 16; k++) wrapRect(c, 46 + k * 11, base + 10, 4, 34, hi);
      wrapRect(c, 36, base - 4, 184, 6, hi);
      wrapEllipse(c, 128, base - 8, 26, 18, col);
      wrapEllipse(c, 128, base - 10, 22, 14, hi);
      wrapRect(c, 127, base - 34, 2, 10, col);
      for (const dx of [70, 186]) {
        wrapEllipse(c, dx, base - 2, 10, 8, col);
        wrapRect(c, dx - 1, base - 14, 2, 6, col);
      }
      // Hussain Sagar lake with the monolithic standing Buddha statue on its island
      wrapRect(c, 0, H - 9, W, 9, "#3d7fb8");
      for (let x = 0; x < W; x += 7) c.px(x, H - 6 + (x % 3), "#9fd0ff");
      wrapEllipse(c, 20, H - 9, 10, 3, "#6b8a5a");
      wrapRect(c, 18, H - 40, 5, 30, "#f0ead8");
      wrapEllipse(c, 20, H - 42, 3, 3, "#f0ead8");
      wrapRect(c, 17, H - 34, 1, 12, "#e0d8c0");
      wrapRect(c, 23, H - 34, 1, 12, "#e0d8c0");
      break;
    }
  }
  return c;
}

function near(level: LevelId): PixelCanvas {
  const t = THEMES[level];
  const H = 72;
  const c = new PixelCanvas(W, H);
  const rng = new Rng(level.length * 131 + 7);
  const base = t.near;
  switch (level) {
    case "old-city": {
      const pastel = ["#e8a87c", "#c38d9e", "#85c1a8", "#e8c66d", "#9ab8d8", "#d98c6a"];
      let x = 0;
      while (x < W) {
        const w = rng.int(20, 32);
        const h = rng.int(30, 60);
        const col = mix(pastel[rng.int(0, pastel.length - 1)], base, 0.35);
        c.rect(x, H - h, w, h, col);
        c.rect(x, H - h, w, 2, shade(col, 0.2));
        for (let j = H - h + 6; j < H - 8; j += 10)
          for (let i = x + 3; i < x + w - 4; i += 7) {
            c.rect(i, j, 4, 6, shade(col, -0.45));
            c.px(i + 1, j, shade(col, -0.2));
            c.px(i + 2, j, shade(col, -0.2));
          }
        c.rect(x + 2, H - h + 14, w - 4, 2, shade(col, -0.3)); // balcony
        x += w;
      }
      // festive string lights
      for (let i = 0; i < W; i++) {
        const y = 10 + Math.round(Math.sin((i / W) * Math.PI * 4) * 4);
        if (i % 2 === 0) c.px(i, y, "#3a2a2a");
        if (i % 8 === 0) c.px(i, y + 1, ["#ffdd33", "#ff6b6b", "#7bdcff"][(i / 8) % 3]);
      }
      break;
    }
    case "traffic": {
      // flyover with pillars and cars on top
      c.rect(0, 18, W, 8, shade(base, 0.1));
      c.rect(0, 18, W, 2, shade(base, 0.3));
      c.rect(0, 26, W, 2, shade(base, -0.3));
      for (let x = 10; x < W; x += 48) c.rect(x, 28, 8, H - 28, shade(base, -0.1));
      // (the Hyderabad Metro train itself is a moving sprite running on this viaduct)
      for (let x = 30; x < W; x += 64) {
        c.rect(x, 36, 26, 16, "#f5f5f5");
        c.rect(x + 1, 37, 24, 14, ["#1d3f8f", "#2f9e55", "#c62828", "#f07b17"][Math.floor(x / 64) % 4]);
        text(c, x + 3, 41, ["SALE", "4G++", "DOSA", "GYM"][Math.floor(x / 64) % 4], "#ffffff");
        c.rect(x + 12, 52, 2, H - 52, "#5d6470");
      }
      break;
    }
    case "pothole": {
      for (let x = 0; x < W; x += 1) {
        const h = 10 + Math.round(Math.abs(Math.sin(x / 13)) * 10 + Math.sin(x / 5) * 2);
        c.vline(x, H - h, H - 1, x % 9 === 0 ? shade(base, -0.15) : base);
      }
      for (let x = 0; x < W; x += 6) {
        c.rect(x, H - 30, 5, 14, x % 12 ? "#f5f5f5" : "#e23b2e");
      }
      c.rect(0, H - 31, W, 1, "#555");
      break;
    }
    case "water": {
      // Hitech City metro: elevated viaduct deck + pillars behind the buildings (train runs on top)
      c.rect(0, 18, W, 8, shade(base, 0.1));
      c.rect(0, 18, W, 2, shade(base, 0.3));
      c.rect(0, 26, W, 2, shade(base, -0.3));
      for (let px = 14; px < W; px += 48) c.rect(px, 28, 8, H - 28, shade(base, -0.1));
      let x = 0;
      while (x < W) {
        const w = rng.int(22, 34);
        const h = rng.int(22, 44);
        const col = mix(["#e8d5b0", "#d8b8a0", "#c8d8c0", "#e0c090"][rng.int(0, 3)], base, 0.3);
        c.rect(x, H - h, w - 2, h, col);
        c.rect(x, H - h, w - 2, 2, shade(col, 0.25));
        for (let j = H - h + 6; j < H - 6; j += 9) for (let i = x + 3; i < x + w - 6; i += 7) c.rect(i, j, 3, 4, shade(col, -0.4));
        // rooftop water drums
        c.rect(x + 4, H - h - 7, 8, 7, "#2a2a2a");
        c.rect(x + 4, H - h - 7, 8, 1, "#555");
        if (rng.chance(0.5)) c.rect(x + 14, H - h - 6, 6, 6, "#3d8bd9");
        x += w;
      }
      break;
    }
    case "secretariat": {
      c.rect(0, H - 22, W, 22, "#d8d0c0");
      c.rect(0, H - 22, W, 3, "#f0e8d8");
      for (let x = 0; x < W; x += 32) {
        c.rect(x, H - 34, 8, 34, "#e8e0d0");
        c.rect(x - 1, H - 36, 10, 3, "#f5efe2");
        c.ellipse(x + 4, H - 39, 3, 3, "#e8b923");
      }
      for (let x = 16; x < W; x += 32) {
        c.ellipse(x, H - 34, 9, 12, "#2f6e3a");
        c.ellipse(x - 3, H - 37, 4, 4, "#46a35b");
      }
      break;
    }
  }
  c.outline("#1b102055");
  return c;
}

export function backgroundFrames(level: LevelId): Frame[] {
  return [
    { name: `bg-${level}-far`, canvas: far(level) },
    { name: `bg-${level}-near`, canvas: near(level) },
  ];
}
