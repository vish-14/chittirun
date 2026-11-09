import { PixelCanvas, type Frame } from "./painter";

/**
 * Chitti Naidu – an entirely fictional cartoon CM. Original design:
 * chibi proportions, tall swept pompadour with grey "executive" temples, neat boxed beard,
 * big expressive eyebrows, full green kurta, an orange-white-green kanduva (shoulder stole),
 * and signature teal sneakers. Not based on any real person.
 */
export const PAL = {
  outline: "#1b1020",
  skin: "#c98b5a",
  skinShade: "#a66a3e",
  skinLight: "#e2a877",
  hair: "#1f1b26",
  hairHi: "#3f3a52",
  grey: "#a7adb8",
  beard: "#2b2129",
  kurta: "#2e9d4f",
  kurtaShade: "#1d7038",
  kurtaHi: "#4fc46e",
  kanduvaOrange: "#f57c12",
  kanduvaWhite: "#fbf8f1",
  kanduvaGreen: "#0c6a2c",
  waist: "#f07b17",
  waistShade: "#bf560b",
  waistHi: "#ffa548",
  button: "#ffd34d",
  pen: "#2f6fd6",
  pajama: "#ece7dc",
  pajamaShade: "#c4bcaf",
  shoe: "#1fb5a8",
  shoeShade: "#127a72",
  sole: "#ffffff",
  eyeWhite: "#ffffff",
  mouth: "#6e2323",
  tongue: "#d9576b",
  blush: "#e2776a",
  tear: "#6ecbff",
  sweat: "#9fe4ff",
  star: "#ffe066",
  pole: "#7a4a22",
  flagOrange: "#f57c12",
  flagWhite: "#fbf8f1",
  flagGreen: "#138a3d",
  emblem: "#1d3f8f",
  emblemHi: "#5d8ff0",
} as const;

export type Outfit = "classic" | "monsoon" | "golden" | "festive";

/** Palette swaps for unlockable outfits (kurta colours only – the tricolour kanduva always stays). */
export const OUTFITS: Record<Outfit, { name: string; unlock: string; swap: Record<string, string> }> = {
  classic: { name: "Classic Green", unlock: "Default", swap: {} },
  monsoon: {
    name: "Monsoon Navy",
    unlock: "Complete campaign chapter 'Water Emergency'",
    swap: { [PAL.kurta]: "#2c4a8a", [PAL.kurtaShade]: "#1c2f5c", [PAL.kurtaHi]: "#4d74c4" },
  },
  festive: {
    name: "Festive Maroon",
    unlock: "Defeat 3 bosses (total)",
    swap: { [PAL.kurta]: "#8f1d3a", [PAL.kurtaShade]: "#5e1025", [PAL.kurtaHi]: "#c23d5e", [PAL.button]: "#ffe9a3" },
  },
  golden: {
    name: "Golden Kurta",
    unlock: "Win a Final Confidence Challenge",
    swap: { [PAL.kurta]: "#e8b923", [PAL.kurtaShade]: "#b0860f", [PAL.kurtaHi]: "#ffe27a" },
  },
};

export type Face = "smile" | "grin" | "worried" | "panic" | "shock" | "sad" | "wink" | "determined";

export const FRAME_W = 48;
export const FRAME_H = 56;
const OX = 8;
const OY = 6;

// ─────────────────────────────── parts ───────────────────────────────

function arm(c: PixelCanvas, sx: number, sy: number, hx: number, hy: number) {
  c.line(sx, sy, hx, hy, PAL.kurta, 3);
  c.line(sx + 1, sy + 1, hx + 1, hy, PAL.kurtaShade, 1);
  c.rect(hx - 1, hy - 1, 3, 3, PAL.skin);
  c.px(hx + 1, hy + 1, PAL.skinShade);
}

function vSign(c: PixelCanvas, hx: number, hy: number) {
  // two raised fingers in a V
  c.line(hx - 1, hy - 1, hx - 2, hy - 4, PAL.skin, 1);
  c.line(hx + 1, hy - 1, hx + 2, hy - 4, PAL.skin, 1);
  c.rect(hx - 1, hy - 1, 3, 3, PAL.skin);
  c.px(hx, hy + 1, PAL.skinShade);
}

function leg(c: PixelCanvas, hipX: number, hipY: number, footX: number, footY: number, view: "front" | "back", lifted = false) {
  c.line(hipX, hipY, footX, footY - 2, PAL.pajama, 4);
  c.line(hipX + 1, hipY, footX + 1, footY - 2, PAL.pajamaShade, 1);
  if (view === "back" && lifted) {
    // sole of the shoe facing the camera
    c.rect(footX - 2, footY - 2, 5, 3, PAL.sole);
    c.rect(footX - 2, footY - 3, 5, 1, PAL.shoe);
  } else {
    c.rect(footX - 3, footY - 2, 6, 3, PAL.shoe);
    c.rect(footX - 3, footY - 2, 6, 1, view === "back" ? PAL.shoeShade : "#5fe0d4");
    c.rect(footX - 3, footY + 1, 6, 1, PAL.sole);
    if (view === "front") c.px(footX, footY - 1, PAL.sole); // lace
  }
}

/** Tricolour kanduva strip, 3px wide. `rev` mirrors the stripe order for the right side. */
function kanduvaStrip(c: PixelCanvas, x: number, y0: number, y1: number, rev: boolean) {
  const cols = [PAL.kanduvaOrange, PAL.kanduvaWhite, PAL.kanduvaGreen];
  if (rev) cols.reverse();
  cols.forEach((col, i) => c.vline(x + i, y0, y1, col));
  // fringe
  for (let i = 0; i < 3; i++) if ((i + y1) % 2 === 0) c.px(x + i, y1 + 1, cols[i]);
}

function torsoFront(c: PixelCanvas, x: number, y: number) {
  // full green kurta
  c.rect(x + 9, y + 22, 15, 16, PAL.kurta);
  c.rect(x + 9, y + 23, 2, 14, PAL.kurtaHi);
  c.rect(x + 21, y + 24, 3, 14, PAL.kurtaShade);
  c.vline(x + 16, y + 23, y + 31, PAL.kurtaShade); // placket
  for (const by of [25, 28, 31]) c.px(x + 16, y + by, PAL.button);
  c.px(x + 10, y + 37, PAL.kurtaShade); // side slits
  c.px(x + 22, y + 37, PAL.kurtaShade);
  // kanduva: around the neck, both ends hanging down the front
  c.hline(x + 11, x + 21, y + 21, PAL.kanduvaOrange);
  c.hline(x + 12, x + 20, y + 22, PAL.kanduvaWhite);
  kanduvaStrip(c, x + 11, y + 22, y + 33, false);
  kanduvaStrip(c, x + 19, y + 22, y + 33, true);
}

function torsoBack(c: PixelCanvas, x: number, y: number) {
  c.rect(x + 9, y + 22, 15, 16, PAL.kurta);
  c.rect(x + 9, y + 23, 2, 14, PAL.kurtaHi);
  c.rect(x + 21, y + 24, 3, 14, PAL.kurtaShade);
  c.vline(x + 16, y + 26, y + 37, PAL.kurtaShade); // back seam
  // kanduva draped across the shoulders
  c.hline(x + 10, x + 22, y + 22, PAL.kanduvaOrange);
  c.hline(x + 10, x + 22, y + 23, PAL.kanduvaWhite);
  c.hline(x + 10, x + 22, y + 24, PAL.kanduvaGreen);
  c.rect(x + 14, y + 21, 5, 1, PAL.kanduvaOrange);
}

function headFront(c: PixelCanvas, x: number, y: number, face: Face) {
  // ears
  c.ellipse(x + 8.5, y + 14, 1.2, 1.8, PAL.skin);
  c.ellipse(x + 23.5, y + 14, 1.2, 1.8, PAL.skin);
  c.px(x + 8, y + 14, PAL.skinShade);
  c.px(x + 24, y + 14, PAL.skinShade);
  // face
  c.ellipse(x + 16, y + 14, 7, 7, PAL.skin);
  c.rect(x + 20, y + 10, 3, 9, PAL.skinShade);
  c.ellipse(x + 15, y + 13, 5, 5, PAL.skin);
  c.px(x + 12, y + 12, PAL.skinLight);
  // pompadour hair
  c.ellipse(x + 16, y + 7, 8, 3.6, PAL.hair);
  c.ellipse(x + 19, y + 3.6, 4.6, 2.4, PAL.hair);
  c.line(x + 14, y + 4, x + 21, y + 2, PAL.hairHi, 1);
  c.line(x + 12, y + 6, x + 17, y + 5, PAL.hairHi, 1);
  c.vline(x + 9, y + 8, y + 13, PAL.hair);
  c.vline(x + 23, y + 8, y + 13, PAL.hair);
  c.px(x + 9, y + 10, PAL.grey);
  c.px(x + 9, y + 11, PAL.grey);
  c.px(x + 23, y + 10, PAL.grey);
  c.px(x + 23, y + 11, PAL.grey);
  // neat boxed beard along the jaw
  for (let yy = 16; yy <= 21; yy++)
    for (let xx = 9; xx <= 23; xx++) {
      const dx = (xx - 16) / 7.35;
      const dy = (yy - 14) / 7.35;
      if (dx * dx + dy * dy > 1) continue;
      if (yy >= 19 || xx <= 10 || xx >= 22) c.px(x + xx, y + yy, PAL.beard);
    }
  c.hline(x + 13, x + 19, y + 17, PAL.beard); // moustache
  c.px(x + 12, y + 18, PAL.beard);
  c.px(x + 20, y + 18, PAL.beard);
  // nose
  c.px(x + 16, y + 15, PAL.skinShade);
  c.px(x + 17, y + 16, PAL.skinShade);

  const eye = (ex: number, open = true, look = 0) => {
    if (!open) {
      c.hline(x + ex, x + ex + 1, y + 13, PAL.outline);
      return;
    }
    c.rect(x + ex, y + 12, 2, 2, PAL.eyeWhite);
    c.px(x + ex + (look > 0 ? 1 : 0), y + 13, PAL.outline);
    c.px(x + ex + (look > 0 ? 1 : 0), y + 12, PAL.outline);
  };
  const brows = (l: [number, number], r: [number, number]) => {
    c.line(x + 11, y + l[0], x + 14, y + l[1], PAL.hair, 1);
    c.line(x + 18, y + r[0], x + 21, y + r[1], PAL.hair, 1);
  };

  switch (face) {
    case "smile":
    case "determined":
      eye(12, true, 1);
      eye(19, true, 0);
      brows(face === "determined" ? [10, 11] : [10, 10], face === "determined" ? [11, 10] : [10, 10]);
      c.hline(x + 14, x + 18, y + 19, PAL.mouth);
      c.px(x + 13, y + 18, PAL.mouth);
      c.px(x + 19, y + 18, PAL.mouth);
      break;
    case "grin":
    case "wink":
      eye(12, true, 1);
      eye(19, face !== "wink", 0);
      if (face === "wink") c.px(x + 20, y + 12, PAL.outline);
      brows([9, 10], [10, 9]);
      c.rect(x + 13, y + 18, 7, 2, PAL.eyeWhite);
      c.hline(x + 13, x + 19, y + 20, PAL.mouth);
      c.px(x + 12, y + 17, PAL.mouth);
      c.px(x + 20, y + 17, PAL.mouth);
      c.px(x + 11, y + 16, PAL.blush);
      c.px(x + 21, y + 16, PAL.blush);
      break;
    case "worried":
      eye(12);
      eye(19);
      brows([11, 9], [9, 11]);
      c.hline(x + 14, x + 18, y + 19, PAL.mouth);
      c.px(x + 13, y + 20, PAL.mouth);
      c.px(x + 19, y + 20, PAL.mouth);
      c.px(x + 22, y + 10, PAL.sweat);
      c.px(x + 22, y + 11, PAL.sweat);
      break;
    case "panic":
    case "shock":
      c.rect(x + 11, y + 11, 3, 3, PAL.eyeWhite);
      c.rect(x + 18, y + 11, 3, 3, PAL.eyeWhite);
      c.px(x + 12, y + 12, PAL.outline);
      c.px(x + 19, y + 12, PAL.outline);
      brows([9, 8], [8, 9]);
      c.ellipse(x + 16, y + 19.5, 1.6, 1.4, PAL.mouth);
      c.px(x + 16, y + 20, PAL.tongue);
      if (face === "panic") {
        c.px(x + 23, y + 9, PAL.sweat);
        c.rect(x + 23, y + 10, 1, 2, PAL.sweat);
        c.px(x + 8, y + 10, PAL.sweat);
      }
      break;
    case "sad":
      eye(12, false);
      eye(19, false);
      brows([11, 10], [10, 11]);
      c.hline(x + 14, x + 18, y + 20, PAL.mouth);
      c.px(x + 13, y + 19, PAL.mouth);
      c.px(x + 19, y + 19, PAL.mouth);
      c.vline(x + 12, y + 14, y + 16, PAL.tear);
      break;
  }
}

function headBack(c: PixelCanvas, x: number, y: number) {
  c.ellipse(x + 8.5, y + 14, 1.2, 1.8, PAL.skin);
  c.ellipse(x + 23.5, y + 14, 1.2, 1.8, PAL.skin);
  c.ellipse(x + 16, y + 14, 7, 7, PAL.skin);
  c.ellipse(x + 16, y + 11, 8, 7, PAL.hair);
  c.ellipse(x + 18, y + 4, 4.6, 2.4, PAL.hair);
  c.line(x + 13, y + 6, x + 19, y + 4, PAL.hairHi, 1);
  c.line(x + 12, y + 10, x + 15, y + 8, PAL.hairHi, 1);
  c.px(x + 9, y + 12, PAL.grey);
  c.px(x + 23, y + 12, PAL.grey);
  c.hline(x + 13, x + 19, y + 18, PAL.hair); // neat nape line
  c.rect(x + 13, y + 19, 7, 2, PAL.skinShade);
}

const HAND = [
  // 7×9 raised right palm, fingers up, thumb out (1 = skin, 2 = shade, 3 = outline)
  "0303030",
  "3131313",
  "3131313",
  "3131313",
  "3111113",
  "3111112",
  "0311113",
  "0311113",
  "0033330",
];

/** Draw the hand emblem centred on (cx, cy). size 1 → 5×7 compact version, 2 → 7×9. */
export function handEmblem(c: PixelCanvas, cx: number, cy: number, size: 1 | 2) {
  const skin = "#f2c9a0";
  const shadeCol = "#d9a77a";
  const ol = "#6b3f22";
  if (size === 1) {
    const small = ["01010", "11111", "11111", "11112", "01110"];
    small.forEach((row, j) => [...row].forEach((v, i) => v !== "0" && c.px(cx - 2 + i, cy - 2 + j, v === "2" ? shadeCol : skin)));
    c.px(cx - 3, cy, skin); // thumb
    return;
  }
  HAND.forEach((row, j) =>
    [...row].forEach((v, i) => {
      if (v === "0") return;
      c.px(cx - 3 + i, cy - 4 + j, v === "1" ? skin : v === "2" ? shadeCol : ol);
    }),
  );
  c.px(cx - 4, cy, ol); // thumb
  c.px(cx - 4, cy + 1, skin);
  c.px(cx - 5, cy + 1, ol);
}

/** Orange / white / green bands for a flag of height h. */
export function tri(j: number, h: number) {
  return j < h / 3 ? PAL.flagOrange : j < (2 * h) / 3 ? PAL.flagWhite : PAL.flagGreen;
}

function flag(c: PixelCanvas, poleX: number, topY: number, wave: number, w = 14, h = 9) {
  // Fictional "Bongaram Praja Party" flag: orange over white with an original spinning-top emblem.
  for (let i = 0; i < w; i++) {
    const off = Math.round(Math.sin((i / w) * Math.PI * 1.5 + wave) * 1);
    for (let j = 0; j < h; j++) c.px(poleX + 1 + i, topY + j + off, tri(j, h));
  }
  const ex = poleX + 1 + Math.floor(w / 2);
  const ey = topY + Math.floor(h / 2) + Math.round(Math.sin(Math.PI * 0.75 + wave));
  // raised open-palm hand ✋ emblem (no blue, no wheel) so the flag can't be mistaken for the national flag
  handEmblem(c, ex, ey, h >= 12 ? 2 : 1);
  c.vline(poleX, topY - 1, topY + h + 22, PAL.pole);
  c.px(poleX, topY - 2, PAL.button);
}

// ─────────────────────────────── poses ───────────────────────────────

function frontBody(c: PixelCanvas, face: Face, bob = 0, arms: "down" | "victory" | "defeat" = "down", wave = 0) {
  const x = OX;
  const y = OY;
  leg(c, x + 13, y + 38, x + 13, y + 46, "front");
  leg(c, x + 19, y + 38, x + 19, y + 46, "front");
  const by = y + bob;
  if (arms === "victory") flag(c, x - 2, by + 3, wave);
  torsoFront(c, x, by);
  if (arms === "down") {
    arm(c, x + 9, by + 24, x + 7, by + 35);
    arm(c, x + 23, by + 24, x + 25, by + 35);
    c.px(x + 26, by + 33, PAL.button); // wristwatch
  } else if (arms === "victory") {
    arm(c, x + 9, by + 24, x - 1, by + 22); // holds flag pole
    arm(c, x + 23, by + 24, x + 28, by + 12);
    vSign(c, x + 28, by + 12);
  } else {
    arm(c, x + 9, by + 25, x + 8, by + 37);
    arm(c, x + 23, by + 25, x + 24, by + 37);
  }
  headFront(c, x, by + (arms === "defeat" ? 2 : 0), face);
}

function backBody(
  c: PixelCanvas,
  opts: {
    bob?: number;
    dx?: number;
    legs: [number, number, boolean, number, number, boolean]; // lfx, lfy, lifted, rfx, rfy, lifted
    arms: [number, number, number, number]; // left hand, right hand
    lean?: number;
  },
) {
  const x = OX + (opts.dx ?? 0);
  const y = OY + (opts.bob ?? 0);
  const [lfx, lfy, ll, rfx, rfy, rl] = opts.legs;
  leg(c, OX + 13, OY + 38, OX + lfx, OY + lfy, "back", ll);
  leg(c, OX + 19, OY + 38, OX + rfx, OY + rfy, "back", rl);
  const [lhx, lhy, rhx, rhy] = opts.arms;
  // arms behind torso first when hands are low/back
  torsoBack(c, x, y);
  arm(c, x + 9, y + 24, x + lhx, y + lhy);
  arm(c, x + 23, y + 24, x + rhx, y + rhy);
  headBack(c, x + (opts.lean ?? 0), y);
}

function sparkles(c: PixelCanvas, x: number, y: number, n: number, color: string, seed: number) {
  for (let i = 0; i < n; i++) {
    const a = seed + i * 2.1;
    c.px(x + Math.round(Math.cos(a) * 9), y + Math.round(Math.sin(a) * 3), color);
  }
}

function finish(c: PixelCanvas) {
  c.outline(PAL.outline);
  return c;
}

function frame(name: string, draw: (c: PixelCanvas) => void): Frame {
  const c = new PixelCanvas(FRAME_W, FRAME_H);
  draw(c);
  return { name, canvas: finish(c) };
}

export const CHARACTER_ANIMS = {
  idle: ["idle-0", "idle-1"],
  victory: ["victory-0", "victory-1", "victory-2"],
  defeat: ["defeat-0", "defeat-1"],
  run: ["run-0", "run-1", "run-2", "run-3"],
  runPanic: ["panic-0", "panic-1", "panic-2", "panic-3"],
  jump: ["jump-0", "jump-1"],
  slide: ["slide-0", "slide-1"],
  hit: ["hit-0", "hit-1"],
  lost: ["lost-0", "lost-1"],
} as const;

export function characterFrames(): Frame[] {
  const frames: Frame[] = [];
  // FRONT (menus, character select, end screens)
  frames.push(frame("idle-0", (c) => frontBody(c, "smile", 0)));
  frames.push(frame("idle-1", (c) => frontBody(c, "smile", 1)));
  frames.push(frame("victory-0", (c) => frontBody(c, "grin", 0, "victory", 0)));
  frames.push(frame("victory-1", (c) => frontBody(c, "wink", -1, "victory", 2)));
  frames.push(frame("victory-2", (c) => frontBody(c, "grin", 0, "victory", 4)));
  frames.push(
    frame("defeat-0", (c) => {
      frontBody(c, "sad", 1, "defeat");
    }),
  );
  frames.push(
    frame("defeat-1", (c) => {
      frontBody(c, "sad", 2, "defeat");
      c.px(OX + 12, OY + 22, PAL.tear);
    }),
  );
  // "CM position lost": dropped flag on the floor, shocked
  frames.push(
    frame("lost-0", (c) => {
      for (let i = 0; i < 26; i++) c.px(OX - 6 + i, OY + 47, PAL.pole);
      for (let j = 0; j < 3; j++) c.hline(OX - 6, OX + 4, OY + 44 + j, tri(j, 3));
      frontBody(c, "shock", 1, "defeat");
    }),
  );
  frames.push(
    frame("lost-1", (c) => {
      for (let i = 0; i < 26; i++) c.px(OX - 6 + i, OY + 47, PAL.pole);
      for (let j = 0; j < 3; j++) c.hline(OX - 6, OX + 4, OY + 44 + j, tri(j, 3));
      frontBody(c, "sad", 2, "defeat");
    }),
  );

  // BACK (gameplay)
  const runPoses: Parameters<typeof backBody>[1][] = [
    { bob: 0, legs: [12, 46, false, 20, 42, true], arms: [6, 31, 26, 35] },
    { bob: -1, legs: [13, 45, false, 19, 45, false], arms: [7, 34, 25, 34] },
    { bob: 0, legs: [12, 42, true, 20, 46, false], arms: [6, 35, 26, 31] },
    { bob: -1, legs: [13, 45, false, 19, 45, false], arms: [7, 34, 25, 34] },
  ];
  runPoses.forEach((p, i) => frames.push(frame(`run-${i}`, (c) => backBody(c, p))));
  const panicPoses: Parameters<typeof backBody>[1][] = [
    { bob: 0, dx: -1, legs: [11, 46, false, 21, 42, true], arms: [3, 12, 27, 18], lean: -1 },
    { bob: -1, dx: 0, legs: [13, 45, false, 19, 45, false], arms: [4, 16, 28, 12] },
    { bob: 0, dx: 1, legs: [11, 42, true, 21, 46, false], arms: [5, 18, 29, 12], lean: 1 },
    { bob: -1, dx: 0, legs: [13, 45, false, 19, 45, false], arms: [3, 13, 28, 16] },
  ];
  panicPoses.forEach((p, i) =>
    frames.push(
      frame(`panic-${i}`, (c) => {
        backBody(c, p);
        c.px(OX + (i % 2 ? 4 : 28), OY + 6 + i, PAL.sweat);
        c.px(OX + (i % 2 ? 3 : 29), OY + 4 + i, PAL.sweat);
      }),
    ),
  );
  frames.push(frame("jump-0", (c) => backBody(c, { bob: -2, legs: [11, 41, true, 21, 41, true], arms: [3, 18, 29, 18] })));
  frames.push(frame("jump-1", (c) => backBody(c, { bob: -1, legs: [12, 43, true, 20, 43, true], arms: [4, 24, 28, 24] })));
  // slide: crouched low, legs splayed
  for (let i = 0; i < 2; i++)
    frames.push(
      frame(`slide-${i}`, (c) => {
        const x = OX;
        const y = OY + 13;
        leg(c, x + 12, y + 33, x + 4, y + 36, "back", true);
        leg(c, x + 20, y + 33, x + 28, y + 36, "back", true);
        torsoBack(c, x, y - 4);
        arm(c, x + 9, y + 20, x + 3, y + 30);
        arm(c, x + 23, y + 20, x + 29, y + 30);
        headBack(c, x, y - 6);
        // dust
        for (let k = 0; k < 4; k++) c.px(x + 2 + k * 9 + i * 3, y + 37 - (k % 2), "#d8c7a8");
      }),
    );
  for (let i = 0; i < 2; i++)
    frames.push(
      frame(`hit-${i}`, (c) => {
        backBody(c, { bob: 1, dx: i ? 1 : -1, legs: [10, 46, false, 22, 46, false], arms: [1, 20 + i * 3, 31, 23 - i * 3], lean: i ? 2 : -2 });
        sparkles(c, OX + 16, OY + 2, 5, PAL.star, i * 1.3);
      }),
    );
  return frames;
}

/** Large expressive face portraits for the HUD (by governance stage) and menus. */
export const PORTRAIT_FACES: Face[] = ["smile", "grin", "worried", "panic", "shock", "sad", "wink", "determined"];

export function portraitFrames(): Frame[] {
  return PORTRAIT_FACES.map((face) => {
    const c = new PixelCanvas(32, 32);
    // reuse the in-game head at native size, framed by shoulders
    c.rect(4, 24, 24, 8, PAL.kurta);
    c.rect(4, 24, 3, 8, PAL.kurtaHi);
    c.rect(24, 24, 4, 8, PAL.kurtaShade);
    c.vline(16, 26, 31, PAL.kurtaShade);
    c.hline(10, 22, 23, PAL.kanduvaOrange);
    kanduvaStrip(c, 9, 24, 31, false);
    kanduvaStrip(c, 20, 24, 31, true);
    headFront(c, 0, 2, face);
    return { name: `face-${face}`, canvas: finish(c) };
  });
}

export function flagFrames(): Frame[] {
  return [0, 1, 2].map((i) => {
    const c = new PixelCanvas(28, 40);
    flag(c, 2, 3, i * 2, 22, 14);
    return { name: `flag-${i}`, canvas: finish(c) };
  });
}
