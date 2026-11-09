import { ROUTES, stopSlug } from "../logic/routes";
import { PixelCanvas, shade, text, textWidth, type Frame } from "./painter";

/**
 * Hyderabad street life: paan shops, malls, Irani cafés, biryani houses, metro, broken street lights,
 * green route signboards with real area names, and football-fan culture (generic pixel players –
 * no real names, faces, photos, crests or sponsor logos).
 */
const O = "#1b1020";

function make(name: string, w: number, h: number, draw: (c: PixelCanvas) => void, outline = true): Frame {
  const c = new PixelCanvas(w, h);
  draw(c);
  if (outline) c.outline(O);
  return { name, canvas: c };
}

const center = (w: number, s: string, scale = 1) => Math.floor((w - textWidth(s, scale)) / 2);

// ───────────────────────────── shops ─────────────────────────────

function paanShop(c: PixelCanvas, sign: string, signCol: string, body: string) {
  // classic wooden paan kiosk on stilts with hanging betel-leaf garlands and colourful packets
  c.rect(0, 8, 44, 9, signCol);
  c.rect(0, 8, 44, 2, shade(signCol, 0.3));
  text(c, center(44, sign), 10, sign, "#fff6c2");
  c.rect(4, 17, 36, 18, body);
  c.rect(4, 17, 36, 2, shade(body, 0.25));
  c.rect(7, 20, 30, 10, "#3a2416"); // open counter
  c.rect(16, 21, 12, 7, "#a8d8e8"); // mirror
  c.px(18, 22, "#ffffff");
  c.ellipse(22, 24, 3, 3, "#c98b5a"); // paanwala
  c.rect(19, 21, 6, 1, "#1f1b26");
  for (let i = 0; i < 6; i++) {
    // betel-leaf garlands
    c.vline(8 + i * 1, 19, 26 - (i % 3), "#3fa34d");
    c.vline(30 + i, 19, 25 - (i % 2), "#3fa34d");
  }
  const packets = ["#e94b3c", "#f6c445", "#3f7fd9", "#ff7ac2", "#46a35b", "#ffffff"];
  for (let i = 0; i < 9; i++) c.rect(7 + i * 3.4, 30, 3, 3, packets[i % packets.length]);
  c.rect(5, 35, 3, 9, "#5a3a22");
  c.rect(36, 35, 3, 9, "#5a3a22");
  c.rect(0, 4, 44, 4, "#7a4a22"); // tin roof
  for (let i = 0; i < 44; i += 4) c.px(i, 5, "#9c6a3a");
}

function mall(c: PixelCanvas) {
  c.rect(0, 10, 72, 54, "#7aa6c8");
  for (let x = 2; x < 70; x += 6) for (let y = 22; y < 50; y += 6) c.rect(x, y, 5, 5, (x + y) % 4 ? "#a8d4f0" : "#d8f0ff");
  c.rect(0, 6, 72, 14, "#1d3f8f");
  c.rect(0, 6, 72, 2, "#3d6fd0");
  text(c, center(72, "SHOPPING"), 8, "SHOPPING", "#ffd34d");
  text(c, center(72, "MALL", 1), 14, "MALL", "#ffffff");
  c.rect(22, 50, 28, 14, "#2a3a4a"); // entrance
  c.rect(24, 52, 11, 12, "#bfe6ff");
  c.rect(37, 52, 11, 12, "#bfe6ff");
  c.rect(52, 26, 16, 20, "#f07b17"); // cinema poster
  text(c, 54, 28, "NEW", "#ffffff");
  text(c, 54, 34, "FILM", "#ffffff");
  c.rect(4, 26, 14, 20, "#c62828"); // sale banner
  text(c, 5, 30, "SALE", "#ffffff");
  text(c, 5, 37, "50%", "#ffd34d");
}

function iraniCafe(c: PixelCanvas) {
  c.rect(0, 12, 48, 34, "#e8d0a8");
  c.rect(0, 4, 48, 10, "#2f6e3a");
  text(c, center(48, "IRANI CAFE"), 6, "IRANI CAFE", "#fff6c2");
  for (let i = 0; i < 3; i++) {
    c.rect(4 + i * 15, 16, 11, 14, "#3a2416");
    c.ellipse(9.5 + i * 15, 16, 5.5, 3, "#3a2416"); // arched windows
  }
  c.rect(4, 32, 40, 2, "#7a4a22"); // table
  for (let i = 0; i < 5; i++) {
    c.rect(7 + i * 8, 29, 2, 3, "#e8f4f8"); // chai glasses
    c.px(7 + i * 8, 30, "#b5651d");
  }
  for (let i = 0; i < 4; i++) {
    c.ellipse(8 + i * 11, 40, 2.5, 1.5, "#5a3a22"); // bentwood chairs
    c.vline(6 + i * 11, 40, 46, "#5a3a22");
  }
}

function biryaniHouse(c: PixelCanvas) {
  c.rect(0, 12, 44, 34, "#f3e1c0");
  c.rect(0, 2, 44, 11, "#c62828");
  text(c, center(44, "BIRYANI"), 5, "BIRYANI", "#ffd34d");
  c.ellipse(22, 34, 13, 8, "#8a5a2b"); // giant handi
  c.rect(9, 30, 26, 3, "#a8743c");
  c.ellipse(22, 29, 11, 3, "#f8e9b0");
  c.px(18, 28, "#f5a623");
  c.px(25, 29, "#f5a623");
  for (let i = 0; i < 4; i++) {
    c.px(15 + i * 4, 22 - (i % 2), "#ffffff");
    c.px(16 + i * 4, 19 - (i % 2), "#ffffff");
  }
  c.rect(2, 16, 8, 10, "#3a2416");
  c.rect(34, 16, 8, 10, "#3a2416");
}

// ───────────────────────────── infrastructure ─────────────────────────────

function metroPillar(c: PixelCanvas) {
  c.rect(12, 14, 12, 50, "#b8b2a4");
  c.rect(12, 14, 3, 50, "#d8d2c4");
  c.rect(21, 14, 3, 50, "#8f897c");
  c.rect(0, 4, 36, 12, "#c8c2b4"); // viaduct cap
  c.rect(0, 4, 36, 2, "#e8e2d4");
  c.rect(0, 0, 36, 4, "#5d6470"); // track bed
  text(c, 13, 30, "M", "#2b6cd4");
  c.rect(8, 62, 20, 2, "#555");
}

function metroTrain(c: PixelCanvas) {
  for (let k = 0; k < 3; k++) {
    const x = k * 42;
    c.rect(x, 2, 40, 16, "#f5f5f5");
    c.rect(x, 2, 40, 3, "#ffffff");
    c.rect(x, 13, 40, 2, "#2b6cd4");
    c.rect(x, 15, 40, 1, "#c62828");
    for (let i = 0; i < 5; i++) c.rect(x + 3 + i * 7, 6, 5, 5, "#5ea2ee");
    c.rect(x + 2, 18, 6, 2, "#333");
    c.rect(x + 32, 18, 6, 2, "#333");
  }
  c.rect(122, 4, 4, 9, "#ffd34d"); // headlight end
}

function brokenLamp(c: PixelCanvas, on: boolean) {
  // bent pole, cracked shade – flickers in game
  c.rect(5, 18, 2, 38, "#5d6470");
  c.line(6, 18, 9, 8, "#5d6470", 2);
  c.line(9, 8, 14, 7, "#5d6470", 2);
  c.rect(11, 8, 6, 3, on ? "#fff4b0" : "#4a4a52");
  c.px(13, 9, "#1b1020"); // crack
  if (on) {
    c.px(12, 12, "#fff4b0");
    c.px(15, 13, "#fff4b0");
  }
  c.rect(3, 53, 6, 3, "#3d424a");
  c.line(2, 46, 9, 44, "#7a7a85"); // dangling wire
}

function brokenSignal(c: PixelCanvas, on: boolean) {
  c.rect(5, 18, 2, 34, "#3d424a");
  c.rect(2, 0, 8, 20, "#222");
  c.ellipse(6, 4, 2, 2, "#4a2020");
  c.ellipse(6, 10, 2, 2, on ? "#f5d01b" : "#4a4420");
  c.ellipse(6, 16, 2, 2, "#1c3a24");
  c.line(1, 2, 10, 18, "#9aa0aa"); // tape across: out of order
}

function routeSign(c: PixelCanvas, name: string) {
  // green Indian highway-style direction board
  const label = name.toUpperCase();
  c.rect(0, 0, 64, 20, "#0f6b3a");
  c.rect(1, 1, 62, 18, "#138a4a");
  c.hline(2, 61, 2, "#ffffff");
  c.hline(2, 61, 17, "#ffffff");
  c.vline(2, 2, 17, "#ffffff");
  c.vline(61, 2, 17, "#ffffff");
  // up-arrow (straight ahead)
  c.vline(31, 4, 7, "#ffffff");
  c.hline(30, 32, 5, "#ffffff");
  c.hline(29, 33, 6, "#ffffff");
  text(c, Math.max(5, center(64, label)), 10, label.slice(0, 14), "#ffffff");
  c.rect(8, 20, 3, 26, "#7d8a99");
  c.rect(53, 20, 3, 26, "#7d8a99");
}

// ───────────────────────────── football fan culture ─────────────────────────────

/** Generic No. 10 footballer: sky-blue & white striped shirt, long hair, beard. Not any real player. */
function footballer(c: PixelCanvas, x: number, y: number, pose: "cup" | "kick") {
  const skin = "#e0b08a";
  c.rect(x + 3, y + 22, 3, 8, skin); // legs
  c.rect(x + 8, y + 22, 3, pose === "kick" ? 5 : 8, skin);
  if (pose === "kick") c.line(x + 10, y + 26, x + 14, y + 23, skin, 3);
  c.rect(x + 2, y + 18, 10, 5, "#1b1b2b"); // shorts
  for (let i = 0; i < 10; i++) c.vline(x + 2 + i, y + 9, y + 18, i % 3 === 0 ? "#ffffff" : "#7ec8f0"); // striped shirt
  text(c, x + 3, y + 11, "10", "#1b1b2b");
  c.ellipse(x + 7, y + 5, 3.5, 4, skin); // head
  c.rect(x + 3, y + 1, 8, 3, "#5a3a22"); // long hair
  c.rect(x + 3, y + 3, 1, 5, "#5a3a22");
  c.rect(x + 10, y + 3, 1, 5, "#5a3a22");
  c.rect(x + 5, y + 7, 5, 2, "#5a3a22"); // beard
  c.px(x + 6, y + 5, O);
  c.px(x + 9, y + 5, O);
  if (pose === "cup") {
    c.line(x + 2, y + 10, x, y + 2, "#7ec8f0", 2); // arms up holding a generic gold cup
    c.line(x + 12, y + 10, x + 14, y + 2, "#7ec8f0", 2);
    c.rect(x + 3, y - 6, 8, 5, "#ffd34d");
    c.rect(x + 5, y - 1, 4, 2, "#e9a920");
    c.px(x + 2, y - 5, "#ffd34d");
    c.px(x + 11, y - 5, "#ffd34d");
  } else {
    c.line(x + 2, y + 10, x - 1, y + 16, "#7ec8f0", 2);
    c.line(x + 12, y + 10, x + 15, y + 14, "#7ec8f0", 2);
    c.ellipse(x + 17, y + 25, 2.5, 2.5, "#ffffff"); // ball
    c.px(x + 17, y + 25, O);
  }
}

function footballPoster(c: PixelCanvas, pose: "cup" | "kick") {
  c.rect(0, 0, 36, 50, "#fbf8f1");
  c.gradient(2, 2, 32, 46, pose === "cup" ? "#2b6cd4" : "#0f6b3a", pose === "cup" ? "#7ec8f0" : "#46a35b", 4);
  if (pose === "kick") for (let i = 2; i < 34; i += 6) c.vline(i, 38, 47, "#ffffff");
  footballer(c, 10, pose === "cup" ? 13 : 9, pose);
  c.rect(2, 2, 32, 8, "#1b1b2b");
  text(c, center(36, pose === "cup" ? "CHAMPION" : "FOOTBALL"), 4, pose === "cup" ? "CHAMPION" : "FOOTBALL", "#ffd34d");
  c.rect(2, 41, 32, 7, "#1b1b2b");
  text(c, center(36, "NO. 10"), 42, "NO. 10", "#7ec8f0");
  c.px(1, 1, "#9aa0aa"); // pins
  c.px(34, 1, "#9aa0aa");
}

function fanFlags(c: PixelCanvas) {
  // bunting of sky-blue / white / sky-blue flags with a golden sun – football-fan decorations
  c.line(0, 2, 63, 2, "#3a2a2a");
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 10;
    const sag = Math.round(Math.sin((i / 5) * Math.PI) * 3);
    c.rect(x, 3 + sag, 8, 2, "#7ec8f0");
    c.rect(x, 5 + sag, 8, 2, "#ffffff");
    c.rect(x, 7 + sag, 8, 2, "#7ec8f0");
    c.px(x + 3, 5 + sag, "#f5c518");
    c.px(x + 4, 6 + sag, "#f5c518");
  }
  c.vline(0, 0, 40, "#7a4a22");
  c.vline(63, 0, 40, "#7a4a22");
}

function footballKids(c: PixelCanvas) {
  const kid = (x: number, shirt: string, stripe: boolean, flip: boolean) => {
    c.rect(x + 2, 14, 2, 6, "#c98b5a");
    c.rect(x + 6, 14, 2, 6, "#c98b5a");
    for (let i = 0; i < 8; i++) c.vline(x + 1 + i, 6, 13, stripe && i % 3 === 0 ? "#ffffff" : shirt);
    c.ellipse(x + 5, 3, 2.5, 2.5, "#c98b5a");
    c.rect(x + 3, 0, 5, 2, "#1f1b26");
    c.line(x + (flip ? 8 : 1), 8, x + (flip ? 11 : -2), 11, "#c98b5a");
  };
  kid(2, "#7ec8f0", true, false);
  kid(26, "#f2c53d", false, true);
  c.ellipse(20, 17, 2.5, 2.5, "#ffffff");
  c.px(20, 17, O);
  c.hline(0, 37, 20, "#8a7a5a");
}

const ROADSIDE: Record<string, [number, number, (c: PixelCanvas) => void]> = {
  "rs-paan": [44, 44, (c) => paanShop(c, "PAAN", "#c62828", "#2f8a3f")],
  "rs-paan2": [44, 44, (c) => paanShop(c, "MEETHA PAAN", "#1d3f8f", "#c9772f")],
  "rs-mall": [72, 64, mall],
  "rs-irani": [48, 46, iraniCafe],
  "rs-biryani": [44, 46, biryaniHouse],
  "rs-metro-pillar": [36, 64, metroPillar],
  "rs-poster-football": [36, 50, (c) => footballPoster(c, "cup")],
  "rs-poster-football2": [36, 50, (c) => footballPoster(c, "kick")],
  "rs-fanflags": [64, 40, fanFlags],
  "rs-football-kids": [38, 21, footballKids],
  "rs-lamp-broken": [18, 56, (c) => brokenLamp(c, false)],
  "rs-lamp-broken-on": [18, 56, (c) => brokenLamp(c, true)],
  "rs-signal-broken": [12, 52, (c) => brokenSignal(c, false)],
  "rs-signal-broken-on": [12, 52, (c) => brokenSignal(c, true)],
};

export function hyderabadFrames(): Frame[] {
  const frames: Frame[] = [];
  for (const [name, [w, h, draw]] of Object.entries(ROADSIDE)) frames.push(make(name, w, h, draw));
  frames.push(make("fx-metro-train", 128, 22, metroTrain));
  const seen = new Set<string>();
  for (const r of Object.values(ROUTES))
    for (const stop of r.stops) {
      const slug = stopSlug(stop);
      if (seen.has(slug)) continue;
      seen.add(slug);
      frames.push(make(`sign-${slug}`, 64, 46, (c) => routeSign(c, stop)));
    }
  return frames;
}
