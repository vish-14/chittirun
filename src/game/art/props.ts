import { PixelCanvas, shade, text, textWidth, type Frame } from "./painter";
import { PAL, handEmblem, tri } from "./character";
import { hyderabadFrames } from "./hyderabad";

const O = "#1b1020";

function make(name: string, w: number, h: number, draw: (c: PixelCanvas) => void, outline = true): Frame {
  const c = new PixelCanvas(w, h);
  draw(c);
  if (outline) c.outline(O);
  return { name, canvas: c };
}

function wheel(c: PixelCanvas, x: number, y: number, w = 4, h = 5) {
  c.rect(x, y, w, h, "#25222b");
  c.rect(x + 1, y + 1, w - 2, 1, "#4a4655");
}

function headlight(c: PixelCanvas, x: number, y: number, r = 2) {
  c.ellipse(x, y, r, r, "#fff4b0");
  c.px(x - 1, y - 1, "#ffffff");
}

// ───────────────────────────── obstacles ─────────────────────────────

function auto(c: PixelCanvas, ox = 0, oy = 0, s = 1, body = "#f2c53d", canopy = "#1f2a1f") {
  const R = (x: number, y: number, w: number, h: number, col: string) => c.rect(ox + x * s, oy + y * s, w * s, h * s, col);
  R(6, 2, 28, 10, canopy); // canopy
  R(4, 6, 2, 22, canopy);
  R(34, 6, 2, 22, canopy);
  R(8, 6, 24, 9, "#9fd4e8"); // windshield
  R(10, 7, 6, 2, "#d9f1f8");
  R(16, 10, 8, 5, "#3b2a22"); // driver silhouette
  R(18, 8, 4, 3, "#5a3b2a");
  R(6, 15, 28, 13, body);
  R(6, 15, 28, 2, shade(body, 0.35));
  R(30, 15, 4, 13, shade(body, -0.25));
  R(17, 17, 6, 6, "#2d6b3a"); // front panel
  R(14, 24, 12, 2, "#222");
  headlight(c, ox + 20 * s, oy + 20 * s, 2 * s);
  wheel(c, ox + 17 * s, oy + 28 * s, 6 * s, 5 * s);
  wheel(c, ox + 4 * s, oy + 27 * s, 5 * s, 6 * s);
  wheel(c, ox + 31 * s, oy + 27 * s, 5 * s, 6 * s);
}

function bus(c: PixelCanvas) {
  c.rect(2, 2, 48, 52, "#d23b2f");
  c.rect(2, 2, 48, 3, "#f06a5c");
  c.rect(42, 5, 8, 49, "#9e2a20");
  c.rect(6, 6, 40, 8, "#222");
  text(c, 26 - Math.floor(textWidth("CITY 9") / 2), 8, "CITY 9", "#ffb347");
  c.rect(5, 17, 42, 18, "#8fc8de");
  c.rect(7, 18, 14, 3, "#d6f0f8");
  c.vline(26, 17, 34, "#55707c");
  c.rect(4, 38, 44, 8, "#f2f2f2");
  c.rect(4, 38, 44, 2, "#ffffff");
  headlight(c, 11, 42, 2);
  headlight(c, 41, 42, 2);
  c.rect(18, 40, 16, 4, "#333");
  for (let i = 0; i < 4; i++) c.hline(19, 32, 40 + i, i % 2 ? "#555" : "#777");
  c.rect(4, 47, 44, 3, "#2a2a2a");
  wheel(c, 5, 50, 8, 6);
  wheel(c, 39, 50, 8, 6);
}

function tanker(c: PixelCanvas) {
  c.ellipse(24, 10, 20, 9, "#2f77c9"); // tank behind cab
  c.ellipse(24, 8, 18, 5, "#5ea2ee");
  text(c, 24 - Math.floor(textWidth("WATER") / 2), 6, "WATER", "#ffffff");
  c.rect(6, 16, 36, 26, "#3d8bd9");
  c.rect(6, 16, 36, 2, "#7cbcf5");
  c.rect(37, 18, 5, 24, "#2a64a8");
  c.rect(9, 19, 30, 10, "#a8dcef");
  c.rect(11, 20, 8, 2, "#e0f6fd");
  c.rect(9, 31, 30, 6, "#264b78");
  for (let i = 0; i < 5; i++) c.vline(12 + i * 6, 32, 36, "#5c7ea8");
  headlight(c, 11, 39, 2);
  headlight(c, 37, 39, 2);
  c.rect(6, 42, 36, 3, "#1e2a3a");
  wheel(c, 7, 44, 7, 5);
  wheel(c, 34, 44, 7, 5);
  for (let i = 0; i < 4; i++) c.px(20 + i * 3, 46 + (i % 2), "#6ecbff"); // dripping
}

function cow(c: PixelCanvas) {
  c.ellipse(18, 22, 13, 9, "#f4efe6"); // body behind
  c.ellipse(26, 20, 4, 3, "#3a2e2a"); // patch
  c.rect(8, 26, 3, 8, "#e5ddd0");
  c.rect(25, 26, 3, 8, "#e5ddd0");
  c.rect(8, 33, 3, 2, "#3a2e2a");
  c.rect(25, 33, 3, 2, "#3a2e2a");
  c.ellipse(18, 14, 6, 7, "#fbf7ef"); // head
  c.ellipse(18, 19, 4.5, 3, "#e8b4a8"); // muzzle
  c.px(16, 19, "#7a3f3a");
  c.px(20, 19, "#7a3f3a");
  c.px(15, 12, O);
  c.px(21, 12, O);
  c.line(12, 8, 8, 3, "#d9c9a0", 2); // horns
  c.line(24, 8, 28, 3, "#d9c9a0", 2);
  c.ellipse(10, 11, 2.5, 1.5, "#efe6d6");
  c.ellipse(26, 11, 2.5, 1.5, "#efe6d6");
  c.rect(16, 23, 4, 2, "#f2a33a"); // marigold garland
  c.px(14, 22, "#f7c948");
  c.px(22, 22, "#f7c948");
}

function cart(c: PixelCanvas) {
  c.rect(2, 2, 2, 16, "#6b4a2b"); // umbrella pole
  c.poly([[0, 4], [24, 0], [44, 6], [22, 9]], "#e4572e");
  c.poly([[22, 1], [44, 6], [34, 7]], "#f7d046");
  c.rect(4, 14, 36, 4, "#8a5a32");
  const fruits = ["#e94b3c", "#f6c445", "#7bc043", "#f39c34", "#c0392b"];
  for (let i = 0; i < 9; i++) c.ellipse(8 + i * 3.6, 12 - (i % 2), 2, 2, fruits[i % fruits.length]);
  c.rect(4, 18, 36, 7, "#a06a3a");
  c.rect(4, 18, 36, 1, "#c48a52");
  for (let i = 0; i < 4; i++) c.vline(8 + i * 9, 19, 24, "#7a4e28");
  c.ellipse(10, 29, 4, 4, "#3a2d22");
  c.ellipse(34, 29, 4, 4, "#3a2d22");
  c.ellipse(10, 29, 1.5, 1.5, "#8a7a6a");
  c.ellipse(34, 29, 1.5, 1.5, "#8a7a6a");
}

function pothole(c: PixelCanvas, fixed: boolean) {
  if (fixed) {
    c.ellipse(20, 6, 18, 5, "#5d5d66");
    c.ellipse(20, 5, 15, 3, "#73737e");
    for (let i = 0; i < 6; i++) c.px(8 + i * 5, 5 + (i % 2), "#8d8d99");
    return;
  }
  c.ellipse(20, 6, 18, 5, "#6d5a46");
  c.ellipse(20, 7, 15, 4, "#2a211b");
  c.ellipse(21, 8, 10, 2, "#15100d");
  c.line(2, 6, 0, 4, "#2a211b");
  c.line(37, 5, 40, 3, "#2a211b");
  c.ellipse(13, 7, 4, 1, "#4a6f8a"); // a little rainwater
}

function speedBreaker(c: PixelCanvas) {
  for (let x = 0; x < 44; x++) {
    const h = Math.round(Math.sin((x / 43) * Math.PI) * 2) + 4;
    const col = Math.floor(x / 5) % 2 ? "#f5d01b" : "#1d1d1d";
    c.vline(x, 9 - h, 9, col);
  }
}

function barricade(c: PixelCanvas) {
  c.rect(4, 4, 3, 18, "#888");
  c.rect(37, 4, 3, 18, "#888");
  for (let x = 0; x < 44; x++) for (let y = 4; y < 12; y++) c.px(x, y, Math.floor((x + y) / 5) % 2 ? "#e23b2e" : "#f5f5f5");
  c.rect(0, 19, 11, 3, "#555");
  c.rect(33, 19, 11, 3, "#555");
  c.px(2, 2, "#ffcc33");
  c.px(41, 2, "#ffcc33");
}

function cone(c: PixelCanvas, x: number, y: number) {
  c.poly([[x, y + 14], [x + 5, y], [x + 7, y], [x + 12, y + 14]], "#ff7a1a");
  c.hline(x + 3, x + 9, y + 6, "#ffffff");
  c.hline(x + 2, x + 10, y + 10, "#ffffff");
  c.rect(x - 1, y + 14, 14, 2, "#c4510d");
}

/** Overhead obstacles: 64px tall so the cloth hangs at head height (slide under it). */
function overhead(c: PixelCanvas, cloth: (c: PixelCanvas) => void, postColor = "#7d6a55") {
  c.rect(1, 0, 3, 64, postColor);
  c.rect(48, 0, 3, 64, postColor);
  c.rect(0, 62, 5, 2, "#555");
  c.rect(47, 62, 5, 2, "#555");
  cloth(c);
}

function banner(c: PixelCanvas) {
  overhead(c, (c) => {
    c.rect(3, 3, 46, 17, "#f7f3e8");
    c.rect(3, 3, 46, 2, "#f07b17");
    c.rect(3, 18, 46, 2, "#f07b17");
    text(c, 26 - Math.floor(textWidth("WORK IN") / 2), 6, "WORK IN", "#1d3f8f");
    text(c, 26 - Math.floor(textWidth("PROGRESS") / 2), 12, "PROGRESS", "#1d3f8f");
    for (let i = 0; i < 4; i++) c.px(8 + i * 12, 20 + (i % 2), "#f07b17");
  });
}

function cables(c: PixelCanvas) {
  overhead(c, (c) => {
    const cols = ["#111", "#2b2b2b", "#3a2a1a", "#1a2a3a", "#222"];
    for (let k = 0; k < 5; k++)
      for (let x = 3; x < 49; x++) {
        const y = 5 + k * 2 + Math.round(Math.sin(((x - 3) / 46) * Math.PI) * (5 + k));
        c.px(x, y, cols[k]);
      }
    c.rect(20, 13, 6, 5, "#5a5a5a"); // junction box
    c.px(22, 15, "#ffdd33");
  }, "#6b6b6b");
}

function redTape(c: PixelCanvas) {
  overhead(c, (c) => {
    c.line(3, 5, 49, 17, "#d42a2a", 3);
    c.line(3, 17, 49, 5, "#d42a2a", 3);
    c.line(3, 11, 49, 11, "#ff5a5a", 2);
    c.rect(22, 7, 8, 8, "#f5e6c8"); // file stuck in the middle
    c.hline(23, 28, 9, "#a08a6a");
    c.hline(23, 28, 11, "#a08a6a");
    c.ellipse(26, 13, 2, 1.5, "#b31b1b"); // wax seal
  }, "#8a7a6a");
}

function boomGate(c: PixelCanvas) {
  c.rect(0, 8, 8, 52, "#5d6470");
  c.rect(1, 9, 6, 6, "#e23b2e");
  c.ellipse(4, 12, 1.5, 1.5, "#ff9f9f");
  for (let x = 6; x < 52; x++) for (let y = 14; y < 20; y++) c.px(x, y, Math.floor(x / 5) % 2 ? "#e23b2e" : "#f5f5f5");
  c.rect(48, 19, 3, 41, "#8a8f99");
  c.rect(0, 58, 10, 2, "#333");
}

/** Waterlogged road: muddy flood water with ripples and a floating slipper. */
function puddle(c: PixelCanvas) {
  c.ellipse(22, 6, 21, 5, "#6b5a3a");
  c.ellipse(22, 6, 19, 4, "#4f6f7a");
  c.ellipse(22, 5, 15, 3, "#5f8fa6");
  c.hline(8, 14, 4, "#bfe6ff");
  c.hline(26, 31, 6, "#bfe6ff");
  c.hline(17, 21, 8, "#9fc8d8");
  c.rect(31, 3, 4, 2, "#e23b2e"); // floating chappal
  c.px(32, 3, "#ffd34d");
}

function pipe(c: PixelCanvas) {
  c.rect(0, 8, 44, 7, "#7d8a99");
  c.rect(0, 8, 44, 2, "#aab6c4");
  c.rect(0, 13, 44, 2, "#56606c");
  c.rect(19, 6, 6, 11, "#5f6b78");
  for (let i = 0; i < 7; i++) {
    c.px(20 + ((i * 5) % 7) - 3, 4 - (i % 3), "#6ecbff");
    c.px(22 + (i % 3), 1 + (i % 4), "#bfe6ff");
  }
}

function jam(c: PixelCanvas) {
  // two small cars bumper to bumper + a jam sign
  const car = (x: number, y: number, col: string) => {
    c.rect(x, y + 4, 20, 9, col);
    c.rect(x + 3, y, 14, 6, shade(col, -0.2));
    c.rect(x + 4, y + 1, 12, 3, "#9fd4e8");
    headlight(c, x + 3, y + 9, 1);
    headlight(c, x + 17, y + 9, 1);
    wheel(c, x + 1, y + 12, 4, 3);
    wheel(c, x + 15, y + 12, 4, 3);
  };
  car(2, 22, "#7b4fc9");
  car(28, 20, "#2fa66b");
  auto(c, 13, 26, 0.6);
  c.rect(17, 0, 18, 12, "#f5d01b");
  c.rect(17, 0, 18, 1, "#fff38a");
  text(c, 26 - Math.floor(textWidth("JAM") / 2), 4, "JAM", "#1d1d1d");
  c.vline(26, 12, 20, "#555");
  for (let i = 0; i < 3; i++) c.px(4 + i * 2, 16 - i, "#ff4d4d"); // honk lines
  for (let i = 0; i < 3; i++) c.px(48 - i * 2, 15 - i, "#ff4d4d");
}

function fileStack(c: PixelCanvas) {
  const cols = ["#e9d6a8", "#d8c08a", "#f0e2bb", "#cdb27a"];
  for (let i = 0; i < 9; i++) {
    const y = 40 - i * 4.4;
    const dx = Math.round(Math.sin(i * 1.7) * 2);
    c.rect(4 + dx, y, 28, 4, cols[i % 4]);
    c.hline(4 + dx, 31 + dx, y, shade(cols[i % 4], 0.3));
    c.vline(17 + dx, y, y + 3, "#c62828");
  }
  c.rect(10, 0, 16, 4, "#f7efd8");
  c.px(18, 1, "#c62828");
}

const OBSTACLE_DRAWERS: Record<string, [number, number, (c: PixelCanvas) => void]> = {
  "ob-auto": [40, 34, (c) => auto(c)],
  "ob-bus": [52, 57, bus],
  "ob-tanker": [48, 50, tanker],
  "ob-cow": [36, 36, cow],
  "ob-cart": [44, 34, cart],
  "ob-pothole": [40, 12, (c) => pothole(c, false)],
  "ob-pothole-fixed": [40, 12, (c) => pothole(c, true)],
  "ob-speedBreaker": [44, 10, speedBreaker],
  "ob-barricade": [44, 22, barricade],
  "ob-cones": [44, 18, (c) => [0, 15, 30].forEach((x, i) => cone(c, x + 1, i === 1 ? 0 : 1))],
  "ob-banner": [52, 64, banner],
  "ob-cables": [52, 64, cables],
  "ob-redTape": [52, 64, redTape],
  "ob-boomGate": [52, 60, boomGate],
  "ob-puddle": [44, 12, puddle],
  "ob-pipe": [44, 17, pipe],
  "ob-jam": [52, 40, jam],
  "ob-fileStack": [36, 45, fileStack],
};

// ───────────────────────────── pickups ─────────────────────────────

function coin(c: PixelCanvas, f: number) {
  const w = [6, 4, 1.5, 4][f];
  c.ellipse(8, 8, w, 6, "#e9a920");
  c.ellipse(8, 8, Math.max(0.5, w - 1.5), 4.5, "#ffd447");
  if (f === 0) {
    // original star mark
    c.px(8, 5, "#e9a920");
    c.hline(6, 10, 7, "#e9a920");
    c.hline(7, 9, 8, "#e9a920");
    c.px(7, 10, "#e9a920");
    c.px(9, 10, "#e9a920");
  }
  c.px(8 - Math.floor(w / 2), 6, "#fff6c2");
}

const PICKUP_DRAWERS: Record<string, (c: PixelCanvas) => void> = {
  "pu-chai": (c) => {
    c.poly([[4, 5], [12, 5], [11, 15], [5, 15]], "#e8f4f8");
    c.rect(5, 8, 6, 6, "#b5651d");
    c.hline(5, 10, 8, "#d4914a");
    c.px(6, 2, "#ffffff");
    c.px(8, 1, "#ffffff");
    c.px(10, 3, "#ffffff");
  },
  "pu-biryani": (c) => {
    c.ellipse(8, 11, 7, 4, "#8a5a2b");
    c.rect(1, 9, 14, 2, "#a8743c");
    c.ellipse(8, 8, 6, 3, "#f8e9b0");
    c.px(6, 7, "#f5a623");
    c.px(10, 8, "#f5a623");
    c.px(8, 6, "#e94b3c");
    c.px(4, 8, "#7bc043");
    c.px(7, 3, "#ffffff");
    c.px(9, 2, "#ffffff");
  },
  "pu-metro": (c) => {
    c.rect(1, 3, 14, 10, "#2b6cd4");
    c.rect(1, 3, 14, 2, "#5d97f0");
    c.rect(4, 6, 8, 4, "#f5f5f5");
    c.rect(5, 7, 2, 1, "#2b6cd4");
    c.rect(9, 7, 2, 1, "#2b6cd4");
    c.hline(4, 11, 11, "#ffd34d");
  },
  "pu-fileCollector": (c) => {
    c.rect(1, 5, 14, 9, "#3b9be0");
    c.rect(1, 3, 6, 3, "#3b9be0");
    c.rect(4, 7, 8, 5, "#f5f5f5");
    c.line(6, 8, 6, 10, "#e23b2e");
    c.line(10, 8, 10, 10, "#e23b2e");
    c.hline(6, 10, 11, "#e23b2e");
  },
  "pu-rocket": (c) => {
    c.ellipse(8, 7, 3, 6, "#f5f5f5");
    c.poly([[8, 0], [11, 4], [5, 4]], "#e23b2e");
    c.ellipse(8, 7, 1.2, 1.2, "#3b9be0");
    c.poly([[4, 10], [6, 9], [6, 13], [3, 14]], "#e23b2e");
    c.poly([[12, 10], [10, 9], [10, 13], [13, 14]], "#e23b2e");
    c.px(8, 14, "#ffcc33");
    c.px(8, 15, "#ff7a1a");
  },
  "pu-tankerShield": (c) => {
    c.poly([[2, 2], [14, 2], [14, 8], [8, 15], [2, 8]], "#2a64a8");
    c.poly([[4, 4], [12, 4], [12, 8], [8, 12], [4, 8]], "#5ea2ee");
    c.ellipse(8, 8, 2, 2.5, "#e0f6fd");
    c.px(8, 5, "#e0f6fd");
  },
  "tk-whistle": (c) => {
    c.ellipse(7, 9, 5, 4, "#c9ced6");
    c.rect(9, 5, 6, 4, "#c9ced6");
    c.ellipse(7, 9, 2, 1.5, "#596273");
    c.px(5, 7, "#ffffff");
    c.line(2, 5, 0, 1, "#e23b2e", 1);
  },
  "tk-tankerToken": (c) => {
    c.ellipse(8, 8, 7, 7, "#1f5fa8");
    c.ellipse(8, 8, 5.5, 5.5, "#3d8bd9");
    c.poly([[8, 3], [11, 9], [8, 12], [5, 9]], "#bfe6ff");
    c.px(7, 7, "#ffffff");
  },
  "tk-job": (c) => {
    c.rect(1, 5, 14, 9, "#2f9e55");
    c.rect(5, 2, 6, 3, "#1f7a3f");
    c.hline(1, 14, 8, "#1f7a3f");
    c.rect(7, 7, 2, 3, "#ffd34d");
  },
  "tk-service": (c) => {
    c.rect(2, 1, 12, 14, "#f0e2bb");
    c.rect(2, 1, 12, 2, "#cdb27a");
    c.hline(4, 11, 5, "#a08a6a");
    c.hline(4, 9, 7, "#a08a6a");
    c.line(5, 11, 7, 13, "#2f9e55", 2);
    c.line(7, 13, 12, 8, "#2f9e55", 2);
  },
  "tk-brick": (c) => {
    c.rect(1, 5, 14, 8, "#b5482f");
    c.hline(1, 14, 5, "#d9694d");
    c.hline(1, 14, 9, "#8c3420");
    c.vline(6, 5, 8, "#8c3420");
    c.vline(10, 9, 12, "#8c3420");
  },
  "tk-siren": (c) => {
    c.rect(2, 12, 12, 3, "#444");
    c.ellipse(8, 9, 5, 5, "#e23b2e");
    c.rect(3, 9, 10, 4, "#e23b2e");
    c.ellipse(7, 7, 1.5, 1.5, "#ffb3b3");
    c.px(1, 3, "#ffdd33");
    c.px(14, 3, "#ffdd33");
    c.px(8, 1, "#ffdd33");
  },
  "tk-petition": (c) => {
    c.rect(3, 2, 10, 12, "#fbf3dc");
    c.rect(2, 1, 12, 2, "#d8c08a");
    c.rect(2, 13, 12, 2, "#d8c08a");
    for (let i = 0; i < 4; i++) c.hline(5, 11 - (i % 2) * 2, 4 + i * 2, "#8a7a6a");
    c.ellipse(11, 12, 1.5, 1.5, "#c62828");
  },
};

// ───────────────────────────── crowd ─────────────────────────────

const SHIRTS = ["#d94f4f", "#3f7fd9", "#f2c53d", "#46a35b", "#9b59b6", "#f07b17", "#7ec8f0"];
/** Variant 6 is a football fan in a sky-blue & white striped jersey. */
export const CROWD_VARIANTS = 7;
/** Questions the public asks the CM (each fits a 22px placard). */
export const PLACARDS = ["ROAD?", "WHY?", "JAM!", "WATER", "FIX!", "?!", "HELP"];
const SKINS = ["#c98b5a", "#a86a3d", "#e0a878", "#8c5530"];

function person(c: PixelCanvas, v: number, pose: "idle" | "cheer" | "protest" | "chant", f: number) {
  const shirt = SHIRTS[v % SHIRTS.length];
  const skin = SKINS[v % SKINS.length];
  const hair = v % 3 === 0 ? "#2a2a2a" : v % 3 === 1 ? "#4a3020" : "#111";
  const bob = f;
  c.rect(4, 15, 2, 7, "#3b3b52");
  c.rect(7, 15, 2, 7, "#3b3b52");
  c.rect(3, 8 + bob, 7, 8, shirt);
  if (v === 6) for (let i = 3; i < 10; i += 3) c.vline(i, 8 + bob, 15 + bob, "#ffffff");
  c.ellipse(6.5, 5 + bob, 3, 3, skin);
  c.rect(4, 2 + bob, 6, 2, hair);
  if (v % 2) c.rect(3, 3 + bob, 1, 3, hair); // long hair variant
  c.px(5, 5 + bob, O);
  c.px(8, 5 + bob, O);
  if (pose === "idle") {
    c.vline(2, 9 + bob, 14 + bob, skin);
    c.vline(11, 9 + bob, 14 + bob, skin);
  } else if (pose === "cheer") {
    c.line(3, 9 + bob, 0, 3 + bob - f, skin);
    c.line(10, 9 + bob, 13, 3 + bob - f, skin);
    c.hline(5, 8, 7 + bob, "#7a2323");
  } else if (pose === "chant") {
    c.line(10, 9 + bob, 12, 2 + bob + f, skin);
    c.rect(11, 1 + bob + f, 2, 2, skin);
    c.vline(2, 9 + bob, 14 + bob, skin);
    c.px(6, 7 + bob, "#7a2323");
  } else {
    // placard with a question for the CM (questions, not accusations)
    const q = PLACARDS[v % PLACARDS.length];
    c.vline(12, 0, 12, "#7a4a22");
    const w = q.length * 4 + 1;
    c.rect(22 - w, 0 + f, w, 7, "#fbf8f1");
    text(c, 23 - w, 1 + f, q, "#d42a2a");
    c.line(10, 9 + bob, 12, 7 + bob, skin);
    c.hline(5, 8, 7 + bob, "#7a2323");
  }
}

// ───────────────────────────── roadside ─────────────────────────────

const ROADSIDE: Record<string, [number, number, (c: PixelCanvas) => void]> = {
  "rs-lamp": [14, 56, (c) => {
    c.rect(5, 6, 2, 50, "#5d6470");
    c.rect(5, 6, 8, 2, "#5d6470");
    c.rect(9, 8, 5, 3, "#fff4b0");
    c.rect(3, 53, 6, 3, "#3d424a");
  }],
  "rs-tree": [28, 44, (c) => {
    c.rect(12, 26, 4, 18, "#6b4a2b");
    c.ellipse(14, 16, 12, 11, "#2f8a3f");
    c.ellipse(10, 12, 6, 5, "#46a35b");
    c.ellipse(19, 18, 5, 4, "#23702f");
  }],
  "rs-shop": [44, 40, (c) => {
    c.rect(2, 8, 40, 32, "#e8d5b0");
    for (let x = 0; x < 44; x++) c.vline(x, 4, 11, Math.floor(x / 4) % 2 ? "#e23b2e" : "#f5f5f5");
    c.rect(6, 14, 32, 4, "#1d3f8f");
    text(c, 8, 13, "KIRANA", "#ffd34d");
    c.rect(6, 20, 32, 20, "#5c3a1e");
    for (let i = 0; i < 6; i++) c.rect(8 + i * 5, 22, 4, 4, ["#f6c445", "#e94b3c", "#7bc043"][i % 3]);
  }],
  "rs-chai": [40, 38, (c) => {
    c.rect(2, 12, 36, 26, "#c9772f");
    c.rect(0, 6, 40, 7, "#2f8a3f");
    text(c, 6, 7, "CHAI 10", "#fff6c2");
    c.rect(6, 18, 28, 10, "#f3e1c0");
    for (let i = 0; i < 5; i++) c.rect(9 + i * 5, 20, 3, 5, "#e8f4f8");
    c.ellipse(30, 30, 4, 3, "#666");
    c.px(30, 25, "#ffffff");
    c.px(31, 23, "#ffffff");
  }],
  "rs-arch": [52, 60, (c) => {
    c.rect(0, 10, 52, 50, "#d8b98a");
    for (let y = 26; y < 60; y++) for (let x = 14; x < 38; x++) c.clear(x, y);
    c.ellipse(26, 26, 12, 10, "#d8b98a");
    for (let y = 16; y < 30; y++) for (let x = 14; x < 38; x++) {
      const dx = (x - 26) / 12;
      const dy = (y - 28) / 12;
      if (dx * dx + dy * dy <= 1 && y >= 18) c.clear(x, y);
    }
    c.rect(0, 6, 6, 54, "#c9a670");
    c.rect(46, 6, 6, 54, "#c9a670");
    c.ellipse(3, 5, 3, 4, "#e8d0a2");
    c.ellipse(49, 5, 3, 4, "#e8d0a2");
    c.hline(0, 51, 12, "#a8854f");
    for (let i = 0; i < 6; i++) c.rect(6 + i * 7, 8, 4, 3, "#a8854f");
  }],
  "rs-bangles": [36, 34, (c) => {
    c.rect(2, 10, 32, 24, "#7a3f8f");
    c.rect(0, 4, 36, 7, "#f2c53d");
    const cols = ["#e94b3c", "#f6c445", "#3f7fd9", "#46a35b", "#ff7ac2"];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) c.ellipse(6 + i * 5, 15 + r * 6, 2, 2, cols[(i + r) % 5]);
  }],
  "rs-billboard": [52, 52, (c) => {
    c.rect(24, 30, 4, 22, "#5d6470");
    c.rect(0, 2, 52, 30, "#f5f5f5");
    c.rect(2, 4, 48, 26, "#1d3f8f");
    text(c, 4, 7, "BUY 1 GET", "#ffd34d");
    text(c, 4, 14, "1 TRAFFIC", "#ffffff");
    text(c, 4, 21, "JAM FREE!", "#f57c12");
  }],
  "rs-signal": [12, 52, (c) => {
    c.rect(5, 18, 2, 34, "#3d424a");
    c.rect(2, 0, 8, 20, "#222");
    c.ellipse(6, 4, 2, 2, "#e23b2e");
    c.ellipse(6, 10, 2, 2, "#f5d01b");
    c.ellipse(6, 16, 2, 2, "#2f9e55");
  }],
  "rs-crane": [44, 60, (c) => {
    c.rect(8, 6, 4, 54, "#f5d01b");
    for (let y = 8; y < 58; y += 4) c.line(8, y, 11, y + 4, "#b8960b");
    c.rect(0, 4, 44, 3, "#f5d01b");
    c.vline(38, 7, 30, "#333");
    c.rect(35, 30, 7, 5, "#888");
  }],
  "rs-roadwork": [36, 34, (c) => {
    c.rect(16, 18, 3, 16, "#888");
    c.poly([[17, 0], [34, 18], [0, 18]], "#f5d01b");
    c.poly([[17, 3], [30, 16], [4, 16]], "#f07b17");
    c.line(12, 12, 16, 8, O, 2);
    c.px(19, 6, O);
    c.line(18, 9, 22, 13, O, 1);
  }],
  "rs-watertower": [36, 60, (c) => {
    c.rect(6, 20, 3, 40, "#7d8a99");
    c.rect(27, 20, 3, 40, "#7d8a99");
    c.line(6, 30, 30, 50, "#7d8a99");
    c.line(30, 30, 6, 50, "#7d8a99");
    c.rect(2, 4, 32, 18, "#5ea2ee");
    c.rect(2, 4, 32, 3, "#9fd0ff");
    c.poly([[2, 4], [18, 0], [34, 4]], "#2a64a8");
    text(c, 6, 11, "EMPTY", "#ffffff");
  }],
  "rs-pots": [40, 16, (c) => {
    const cols = ["#d9772f", "#3d8bd9", "#e9a920", "#46a35b", "#c94040"];
    for (let i = 0; i < 6; i++) {
      c.ellipse(4 + i * 6.4, 10, 3, 4, cols[i % 5]);
      c.rect(3 + i * 6.4, 4, 3, 2, shade(cols[i % 5], -0.3));
    }
  }],
  "rs-column": [24, 60, (c) => {
    c.rect(2, 0, 20, 6, "#f0ebe0");
    c.rect(5, 6, 14, 48, "#e8e2d4");
    for (let i = 0; i < 3; i++) c.vline(8 + i * 4, 6, 53, "#c9c1af");
    c.rect(2, 54, 20, 6, "#f0ebe0");
  }],
  "rs-flagpole": [28, 64, (c) => {
    c.rect(3, 4, 2, 60, "#9aa0aa");
    for (let i = 0; i < 20; i++) for (let j = 0; j < 12; j++) c.px(5 + i, 5 + j + Math.round(Math.sin(i / 4) * 1), tri(j, 12));
    handEmblem(c, 15, 11, 2);
  }],
  "rs-files": [32, 30, (c) => fileStack(c)],
};

// ───────────────────────────── bosses ─────────────────────────────

function eyes(c: PixelCanvas, x1: number, x2: number, y: number, angry: boolean) {
  for (const x of [x1, x2]) {
    c.ellipse(x, y, 4, 3, "#ffffff");
    c.ellipse(x + (x === x1 ? 1 : -1), y + 1, 1.5, 1.5, O);
  }
  if (angry) {
    c.line(x1 - 4, y - 5, x1 + 4, y - 2, O, 2);
    c.line(x2 + 4, y - 5, x2 - 4, y - 2, O, 2);
  }
}

const BOSSES: Record<string, (c: PixelCanvas, f: number) => void> = {
  "old-city": (c, f) => {
    auto(c, 2, 4 + f, 2, "#f2c53d", "#1f2a1f");
    eyes(c, 28, 52, 46 + f, true);
    c.hline(30, 50, 56 + f, O);
    if (f) for (let i = 0; i < 4; i++) c.px(4 + i * 24, 2, "#ff4d4d");
  },
  traffic: (c, f) => {
    c.rect(4, 2 + f, 72, 70, "#d23b2e");
    c.rect(8, 6 + f, 64, 14, "#8fc8de");
    c.rect(8, 26 + f, 64, 16, "#8fc8de");
    text(c, 20, 47 + f, "GRIDLOCK", "#ffd34d");
    eyes(c, 26, 54, 34 + f, true);
    c.rect(8, 56 + f, 64, 8, "#f2f2f2");
    headlight(c, 16, 60 + f, 3);
    headlight(c, 64, 60 + f, 3);
    wheel(c, 8, 70, 12, 8);
    wheel(c, 60, 70, 12, 8);
  },
  pothole: (c, f) => {
    c.rect(14, 30, 52, 30, "#f5d01b");
    c.rect(14, 30, 52, 4, "#fff38a");
    c.rect(22, 16, 30, 16, "#f5d01b");
    c.rect(26, 19, 22, 9, "#8fc8de");
    eyes(c, 32, 44, 24, true);
    c.line(60, 34, 74, 14 + f * 4, "#d8b40e", 5);
    c.poly([[66, 10 + f * 4], [80, 10 + f * 4], [78, 24 + f * 4], [68, 22 + f * 4]], "#666");
    for (let i = 0; i < 6; i++) c.rect(12 + i * 10, 62, 8, 12, "#2a2a2a");
    c.rect(10, 60, 62, 3, "#444");
  },
  water: (c, f) => {
    c.ellipse(40, 18, 36, 16, "#2f77c9");
    c.ellipse(40, 14, 32, 8, "#5ea2ee");
    text(c, 40 - Math.floor(textWidth("MEGA WATER") / 2), 10, "MEGA WATER", "#ffffff");
    c.rect(10, 30, 60, 36, "#3d8bd9");
    c.rect(14, 34, 52, 12, "#a8dcef");
    eyes(c, 28, 52, 40, true);
    c.rect(14, 50, 52, 8, "#264b78");
    wheel(c, 12, 66, 12, 9);
    wheel(c, 56, 66, 12, 9);
    for (let i = 0; i < 8; i++) c.px(4 + i * 10, 28 + ((i + f) % 3) * 3, "#6ecbff");
  },
  secretariat: (c, f) => {
    const cols = ["#e9d6a8", "#d8c08a", "#f0e2bb", "#cdb27a"];
    for (let i = 0; i < 14; i++) {
      const dx = Math.round(Math.sin(i * 1.3 + f) * 3);
      c.rect(18 + dx, 70 - i * 5, 44, 5, cols[i % 4]);
      c.vline(40 + dx, 70 - i * 5, 74 - i * 5, "#c62828");
    }
    eyes(c, 30, 50, 24, true);
    c.hline(32, 48, 34, O);
    c.line(18, 40, 2, 26 - f * 4, "#d42a2a", 3);
    c.line(62, 40, 78, 26 - f * 4, "#d42a2a", 3);
    c.rect(0, 22 - f * 4, 6, 6, "#f0e2bb");
    c.rect(74, 22 - f * 4, 6, 6, "#f0e2bb");
  },
};

const SHOTS: Record<string, (c: PixelCanvas) => void> = {
  "old-city": (c) => {
    c.ellipse(10, 10, 9, 8, "#2f8a3f");
    c.ellipse(10, 10, 7, 6, "#46a35b");
    for (let i = 0; i < 4; i++) c.vline(5 + i * 3, 3, 17, "#23702f");
  },
  traffic: (c) => cone(c, 4, 3),
  pothole: (c) => {
    c.poly([[2, 12], [6, 3], [14, 2], [19, 9], [15, 18], [5, 18]], "#4a4a52");
    c.px(8, 6, "#7a7a85");
    c.px(12, 10, "#7a7a85");
  },
  water: (c) => {
    c.ellipse(10, 11, 8, 8, "#3d8bd9");
    c.poly([[10, 0], [16, 8], [4, 8]], "#3d8bd9");
    c.ellipse(8, 9, 2, 3, "#bfe6ff");
  },
  secretariat: (c) => {
    c.rect(2, 4, 16, 13, "#f0e2bb");
    c.rect(2, 4, 16, 2, "#cdb27a");
    c.vline(10, 4, 16, "#c62828");
    for (let i = 0; i < 3; i++) c.hline(4, 15, 8 + i * 3, "#a08a6a");
  },
};

// ───────────────────────────── effects & vehicles ─────────────────────────────

const FX: Record<string, [number, number, (c: PixelCanvas) => void, boolean?]> = {
  "fx-warn": [16, 16, (c) => {
    c.poly([[8, 0], [16, 15], [0, 15]], "#f5d01b");
    c.rect(7, 4, 2, 6, O);
    c.rect(7, 12, 2, 2, O);
  }],
  "fx-poof": [24, 24, (c) => {
    for (let i = 0; i < 8; i++) c.ellipse(12 + Math.cos(i) * 7, 12 + Math.sin(i) * 7, 3, 3, "#f5f2ea");
    c.ellipse(12, 12, 5, 5, "#ffffff");
  }],
  "fx-spark": [8, 8, (c) => {
    c.vline(3, 0, 7, "#fff6c2");
    c.hline(0, 7, 3, "#fff6c2");
    c.px(3, 3, "#ffffff");
  }, false],
  "fx-shield": [40, 52, (c) => {
    for (let a = 0; a < Math.PI * 2; a += 0.02) {
      c.px(20 + Math.cos(a) * 18, 26 + Math.sin(a) * 24, "#ffd34d");
    }
    for (let a = 0; a < Math.PI * 2; a += 0.05) c.px(20 + Math.cos(a) * 16, 26 + Math.sin(a) * 22, "#fff6c2");
  }, false],
  "fx-confetti": [4, 4, (c) => c.rect(0, 0, 4, 4, "#ffffff"), false],
  "fx-metro": [64, 22, (c) => {
    c.rect(0, 2, 64, 12, "#2b6cd4");
    c.rect(0, 2, 64, 3, "#5d97f0");
    for (let i = 0; i < 6; i++) c.rect(3 + i * 10, 6, 7, 5, "#bfe6ff");
    c.rect(0, 14, 64, 3, "#ffd34d");
    c.rect(6, 17, 6, 5, "#5d6470");
    c.rect(52, 17, 6, 5, "#5d6470");
  }],
  "fx-rocket": [20, 30, (c) => {
    c.ellipse(10, 10, 6, 10, "#f5f5f5");
    c.poly([[10, 0], [15, 6], [5, 6]], "#e23b2e");
    c.poly([[3, 14], [6, 12], [6, 20], [1, 22]], "#e23b2e");
    c.poly([[17, 14], [14, 12], [14, 20], [19, 22]], "#e23b2e");
    c.ellipse(10, 24, 3, 5, "#ff7a1a");
    c.ellipse(10, 23, 1.5, 3, "#ffdd33");
  }],
  "fx-tanker": [56, 30, (c) => {
    c.ellipse(28, 14, 26, 12, "#2f77c9");
    c.ellipse(28, 10, 22, 6, "#5ea2ee");
    text(c, 28 - Math.floor(textWidth("SHIELD") / 2), 9, "SHIELD", "#ffffff");
    wheel(c, 8, 22, 8, 7);
    wheel(c, 40, 22, 8, 7);
  }],
};

export function propFrames(): Frame[] {
  const frames: Frame[] = [];
  for (const [name, [w, h, draw]] of Object.entries(OBSTACLE_DRAWERS)) frames.push(make(name, w, h, draw));
  for (let f = 0; f < 4; f++) frames.push(make(`coin-${f}`, 16, 16, (c) => coin(c, f)));
  for (const [name, draw] of Object.entries(PICKUP_DRAWERS)) frames.push(make(name, 16, 16, draw));
  for (let v = 0; v < CROWD_VARIANTS; v++)
    for (const pose of ["idle", "cheer", "protest", "chant"] as const)
      for (let f = 0; f < 2; f++) frames.push(make(`crowd-${v}-${pose}-${f}`, 23, 22, (c) => person(c, v, pose, f)));
  for (const [name, [w, h, draw]] of Object.entries(ROADSIDE)) frames.push(make(name, w, h, draw));
  for (const [lvl, draw] of Object.entries(BOSSES))
    for (let f = 0; f < 2; f++) frames.push(make(`boss-${lvl}-${f}`, 80, 80, (c) => draw(c, f)));
  for (const [lvl, draw] of Object.entries(SHOTS)) frames.push(make(`shot-${lvl}`, 20, 20, draw));
  for (const [name, [w, h, draw, ol]] of Object.entries(FX)) frames.push(make(name, w, h, draw, ol ?? true));
  frames.push(...hyderabadFrames());
  return frames;
}
