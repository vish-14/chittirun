/**
 * Tiny dependency-free pixel painter. Runs in Node (asset generation script) and in
 * the browser (runtime fallback if sprite sheets fail to download). All art in this
 * game is drawn procedurally with these primitives – no third-party artwork.
 */
export type RGBA = readonly [number, number, number, number];

const cache = new Map<string, RGBA>();
export function hex(c: string): RGBA {
  let v = cache.get(c);
  if (v) return v;
  const s = c.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map((x) => x + x).join("") : s.slice(0, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255;
  v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, a] as const;
  cache.set(c, v);
  return v;
}

export function shade(c: string, f: number): string {
  const [r, g, b] = hex(c);
  const m = (x: number) => Math.max(0, Math.min(255, Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f)));
  return "#" + [m(r), m(g), m(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export class PixelCanvas {
  readonly data: Uint8ClampedArray;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): RGBA {
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  alpha(x: number, y: number) {
    if (!this.inBounds(x, y)) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  px(x: number, y: number, c: string) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inBounds(x, y)) return;
    const [r, g, b, a] = hex(c);
    const i = (y * this.w + x) * 4;
    if (a === 255) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
    } else if (a > 0) {
      const t = a / 255;
      this.data[i] = this.data[i] * (1 - t) + r * t;
      this.data[i + 1] = this.data[i + 1] * (1 - t) + g * t;
      this.data[i + 2] = this.data[i + 2] * (1 - t) + b * t;
      this.data[i + 3] = Math.max(this.data[i + 3], a);
    }
  }

  clear(x: number, y: number) {
    if (!this.inBounds(x, y)) return;
    this.data[(y * this.w + x) * 4 + 3] = 0;
  }

  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  hline(x0: number, x1: number, y: number, c: string) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.px(x, y, c);
  }

  vline(x: number, y0: number, y1: number, c: string) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.px(x, y, c);
  }

  /** Filled ellipse centred on (cx, cy). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35);
        const dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  }

  /** Thick line (Bresenham with a square brush). */
  line(x0: number, y0: number, x1: number, y1: number, c: string, thick = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const o = Math.floor((thick - 1) / 2);
    for (;;) {
      this.rect(x0 - o, y0 - o, thick, thick, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Filled convex/concave polygon via scanline (even-odd). */
  poly(points: [number, number][], c: string) {
    const ys = points.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((y0 <= y + 0.5 && y1 > y + 0.5) || (y1 <= y + 0.5 && y0 > y + 0.5)) {
          xs.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.px(x, y, c);
    }
  }

  /** Classic 16-bit style 1px outline around all opaque pixels. */
  outline(c: string, diagonal = false) {
    const marks: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        const n =
          this.alpha(x - 1, y) > 128 ||
          this.alpha(x + 1, y) > 128 ||
          this.alpha(x, y - 1) > 128 ||
          this.alpha(x, y + 1) > 128 ||
          (diagonal &&
            (this.alpha(x - 1, y - 1) > 128 ||
              this.alpha(x + 1, y - 1) > 128 ||
              this.alpha(x - 1, y + 1) > 128 ||
              this.alpha(x + 1, y + 1) > 128));
        if (n) marks.push([x, y]);
      }
    for (const [x, y] of marks) this.px(x, y, c);
  }

  blit(src: PixelCanvas, dx: number, dy: number, flipX = false) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const sx = flipX ? src.w - 1 - x : x;
        const i = (y * src.w + sx) * 4;
        const a = src.data[i + 3];
        if (!a) continue;
        const tx = dx + x;
        const ty = dy + y;
        if (!this.inBounds(tx, ty)) continue;
        const j = (ty * this.w + tx) * 4;
        this.data[j] = src.data[i];
        this.data[j + 1] = src.data[i + 1];
        this.data[j + 2] = src.data[i + 2];
        this.data[j + 3] = a;
      }
  }

  /** Replace exact colours (palette swap). */
  recolor(map: Record<string, string>) {
    const pairs = Object.entries(map).map(([a, b]) => [hex(a), hex(b)] as const);
    for (let i = 0; i < this.data.length; i += 4) {
      if (!this.data[i + 3]) continue;
      for (const [from, to] of pairs) {
        if (this.data[i] === from[0] && this.data[i + 1] === from[1] && this.data[i + 2] === from[2]) {
          this.data[i] = to[0];
          this.data[i + 1] = to[1];
          this.data[i + 2] = to[2];
          break;
        }
      }
    }
  }

  /** Simple ordered dithering fill between two colours (vertical gradient). */
  gradient(x: number, y: number, w: number, h: number, top: string, bottom: string, steps = 6) {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const cols = Array.from({ length: steps }, (_, i) => mix(top, bottom, i / (steps - 1)));
    for (let j = 0; j < h; j++) {
      const t = (j / Math.max(1, h - 1)) * (steps - 1);
      const base = Math.floor(t);
      const frac = t - base;
      for (let i = 0; i < w; i++) {
        const th = bayer[((y + j) % 4) * 4 + ((x + i) % 4)] / 16;
        const c = cols[Math.min(steps - 1, base + (frac > th ? 1 : 0))];
        this.px(x + i, y + j, c);
      }
    }
  }
}

export function mix(a: string, b: string, t: number): string {
  const A = hex(a);
  const B = hex(b);
  const m = (i: number) => Math.round(A[i] + (B[i] - A[i]) * t);
  return "#" + [m(0), m(1), m(2)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** 3x5 pixel font for signage on banners, billboards and placards. Original glyph designs. */
const FONT: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
  E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
  Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111", "0": "111101101101111", "1": "010110010010111",
  "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110",
  "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110",
  "!": "010010010000010", "?": "110001010000010", "-": "000000111000000", ".": "000000000000010",
  "%": "101001010100101", "+": "000010111010000", " ": "000000000000000", ":": "000010000010000",
};

export function text(c: PixelCanvas, x: number, y: number, str: string, color: string) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch] ?? FONT["?"];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === "1") c.px(cx + i, y + j, color);
    cx += 4;
  }
}

export function textWidth(str: string) {
  return str.length * 4 - 1;
}

export interface Frame {
  name: string;
  canvas: PixelCanvas;
}

export interface PackedSheet {
  canvas: PixelCanvas;
  frames: Record<string, { x: number; y: number; w: number; h: number }>;
}

/** Shelf-pack frames into a single sheet with 1px padding (prevents bleeding). */
export function packFrames(frames: Frame[], maxWidth = 512): PackedSheet {
  const pad = 1;
  const sorted = [...frames].sort((a, b) => b.canvas.h - a.canvas.h || a.name.localeCompare(b.name));
  let x = pad;
  let y = pad;
  let shelf = 0;
  let width = 0;
  const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const f of sorted) {
    if (x + f.canvas.w + pad > maxWidth) {
      x = pad;
      y += shelf + pad;
      shelf = 0;
    }
    pos[f.name] = { x, y, w: f.canvas.w, h: f.canvas.h };
    x += f.canvas.w + pad;
    shelf = Math.max(shelf, f.canvas.h);
    width = Math.max(width, x);
  }
  const height = y + shelf + pad;
  const pow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));
  const sheet = new PixelCanvas(pow2(width), height);
  for (const f of frames) sheet.blit(f.canvas, pos[f.name].x, pos[f.name].y);
  return { canvas: sheet, frames: pos };
}
