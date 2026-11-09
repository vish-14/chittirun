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
  crowdDensity: number;
}

export const THEMES: Record<LevelId, LevelTheme> = {
  "old-city": {
    skyTop: "#3b2a5c", skyBottom: "#f29a6b", far: "#6b4466", near: "#a8645a",
    road: "#6a5f5a", roadDark: "#5c524d", laneMark: "#e8dcc0", edge: "#d9b98a",
    sidewalk: "#b08a62", sidewalkAlt: "#9c7752",
    roadside: ["rs-arch", "rs-bangles", "rs-chai", "rs-shop", "rs-lamp"], crowdDensity: 1,
  },
  traffic: {
    skyTop: "#1d2a4f", skyBottom: "#e3a35f", far: "#3a4466", near: "#4d5a7a",
    road: "#4a4c55", roadDark: "#40424a", laneMark: "#f5f5f5", edge: "#f5d01b",
    sidewalk: "#8a8d96", sidewalkAlt: "#7a7d86",
    roadside: ["rs-billboard", "rs-signal", "rs-lamp", "rs-shop", "rs-tree"], crowdDensity: 0.8,
  },
  pothole: {
    skyTop: "#4a7bb5", skyBottom: "#f2d9a0", far: "#7a8aa0", near: "#a08060",
    road: "#5a5650", roadDark: "#4e4a45", laneMark: "#d8d0b8", edge: "#f07b17",
    sidewalk: "#a8906a", sidewalkAlt: "#987e58",
    roadside: ["rs-crane", "rs-roadwork", "rs-lamp", "rs-tree", "rs-chai"], crowdDensity: 0.9,
  },
  water: {
    skyTop: "#5aa0d8", skyBottom: "#f7e3b5", far: "#a0786a", near: "#c4a07a",
    road: "#6e665c", roadDark: "#625a51", laneMark: "#efe6d0", edge: "#3d8bd9",
    sidewalk: "#c2a47c", sidewalkAlt: "#b0926a",
    roadside: ["rs-watertower", "rs-pots", "rs-tree", "rs-lamp", "rs-shop"], crowdDensity: 1.1,
  },
  secretariat: {
    skyTop: "#2c3e6b", skyBottom: "#9fc0e0", far: "#5a6a8a", near: "#7a8a9a",
    road: "#55585e", roadDark: "#4b4e54", laneMark: "#ffffff", edge: "#e8e2d4",
    sidewalk: "#b8b2a4", sidewalkAlt: "#a8a294",
    roadside: ["rs-column", "rs-flagpole", "rs-tree", "rs-files", "rs-lamp"], crowdDensity: 1.2,
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

function far(level: LevelId): PixelCanvas {
  const t = THEMES[level];
  const H = 96;
  const c = new PixelCanvas(W, H);
  const rng = new Rng(level.length * 977 + 13);
  const col = t.far;
  const hi = shade(col, 0.15);
  switch (level) {
    case "old-city":
      for (let i = 0; i < 9; i++) {
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
      for (let i = 0; i < 8; i++) {
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
      for (let i = 0; i < 6; i++) wrapEllipse(c, i * 8 + 4, H - 10, 6, 10, shade(col, -0.2));
      for (let i = 0; i < 6; i++) wrapEllipse(c, 220 + i * 8, H - 10, 6, 10, shade(col, -0.2));
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
      for (let x = 4; x < W; x += 21) {
        const col = ["#d94f4f", "#f2c53d", "#3f7fd9", "#f5f5f5"][x % 4];
        c.rect(x, 13, 10, 5, col);
        c.rect(x + 2, 11, 6, 3, shade(col, -0.2));
      }
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
