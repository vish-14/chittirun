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

// ───────────────────────────── HYDRA demolition drive ─────────────────────────────

function house(c: PixelCanvas) {
  // a family's two-storey home with a balcony, washing line and a water drum
  c.rect(4, 14, 44, 42, "#e8a87c");
  c.rect(4, 14, 44, 3, "#f3c49c");
  c.rect(2, 10, 48, 5, "#b5543a");
  c.rect(8, 22, 10, 9, "#5a7fa8");
  c.rect(34, 22, 10, 9, "#5a7fa8");
  c.rect(6, 33, 40, 2, "#7a4a22"); // balcony
  for (let i = 8; i < 46; i += 3) c.vline(i, 30, 33, "#7a4a22");
  c.rect(20, 40, 12, 16, "#7a4a22"); // door
  c.px(29, 48, "#ffd34d");
  c.rect(10, 42, 7, 7, "#5a7fa8");
  c.rect(36, 42, 7, 7, "#5a7fa8");
  c.rect(38, 2, 8, 8, "#2a2a2a"); // water drum
  c.hline(6, 30, 37, "#555");
  ["#e94b3c", "#3f7fd9", "#f6c445"].forEach((col, i) => c.rect(9 + i * 7, 37, 4, 4, col)); // washing line
}

function rubble(c: PixelCanvas) {
  const cols = ["#c98b5a", "#8a7a6a", "#e8a87c", "#6b5a4a", "#b5543a"];
  for (let i = 0; i < 40; i++) {
    const x = 4 + ((i * 37) % 44);
    const y = 34 + ((i * 13) % 20);
    c.rect(x, y, 3 + (i % 4), 2 + (i % 3), cols[i % cols.length]);
  }
  c.line(10, 50, 22, 40, "#7a4a22", 2); // broken beam
  c.line(30, 52, 44, 44, "#7a4a22", 2);
  c.rect(20, 46, 6, 6, "#5a7fa8"); // window frame in the debris
}

function hydraVan(c: PixelCanvas) {
  c.rect(2, 8, 52, 16, "#f5f5f5");
  c.rect(40, 4, 14, 12, "#f5f5f5"); // cab
  c.rect(43, 6, 9, 6, "#8fc8de");
  c.rect(2, 14, 52, 4, "#2b6cd4");
  text(c, 7, 9, "HYDRA", "#2b6cd4");
  c.rect(16, 2, 8, 4, "#e23b2e"); // siren bar
  c.rect(24, 2, 6, 4, "#2b6cd4");
  c.ellipse(12, 25, 4, 4, "#222");
  c.ellipse(44, 25, 4, 4, "#222");
  c.ellipse(12, 25, 1.5, 1.5, "#888");
  c.ellipse(44, 25, 1.5, 1.5, "#888");
}

function demoJcb(c: PixelCanvas, arm: number) {
  c.rect(4, 24, 30, 12, "#f5d01b");
  c.rect(4, 24, 30, 2, "#fff38a");
  c.rect(8, 12, 14, 13, "#f5d01b");
  c.rect(10, 14, 10, 7, "#8fc8de");
  text(c, 6, 27, "JCB", "#1b1020");
  for (let i = 0; i < 5; i++) c.rect(3 + i * 7, 36, 6, 6, "#2a2a2a");
  c.rect(2, 35, 34, 2, "#444");
  // boom + dipper + bucket, raised (arm=0) or smashing down (arm=1)
  const ex = arm ? 50 : 46;
  const ey = arm ? 30 : 6;
  c.line(30, 26, 40, arm ? 14 : 6, "#d8b40e", 4);
  c.line(40, arm ? 14 : 6, ex, ey, "#d8b40e", 3);
  c.poly([[ex - 3, ey], [ex + 4, ey - 2], [ex + 5, ey + 6], [ex - 2, ey + 5]], "#666");
}

function stayOrder(c: PixelCanvas) {
  // red octagonal STOP sign = the CM's stay order
  c.poly([[5, 0], [11, 0], [16, 5], [16, 11], [11, 16], [5, 16], [0, 11], [0, 5]], "#ffffff");
  c.poly([[5, 1], [11, 1], [15, 5], [15, 11], [11, 15], [5, 15], [1, 11], [1, 5]], "#d42a2a");
  text(c, 1, 6, "STOP", "#ffffff");
}

// ───────────────────────────── political wall posters (text only, no likenesses) ─────────────────────────────

function pasted(c: PixelCanvas, w: number, h: number, bg: string) {
  c.rect(0, 0, w, h, bg);
  c.clear(w - 1, 0); // torn corner
  c.clear(w - 2, 0);
  c.clear(w - 1, 1);
  c.px(1, 1, "#d8d0c0"); // glue/pin marks
  c.px(w - 3, h - 2, "#d8d0c0");
}

function posterCmDown(c: PixelCanvas) {
  pasted(c, 36, 50, "#1b1b1b");
  c.rect(2, 2, 32, 4, "#d42a2a");
  text(c, center(36, "CM", 3), 9, "CM", "#ff4d4d", 3);
  text(c, center(36, "DOWN"), 27, "DOWN", "#ffffff");
  text(c, center(36, "DOWN!"), 34, "DOWN!", "#ffffff");
  // thumbs down
  c.rect(14, 41, 6, 4, "#e0b08a");
  c.rect(15, 45, 2, 3, "#e0b08a");
  c.rect(2, 44, 32, 4, "#d42a2a");
}

const PINK = "#e8318c";

function posterWeWant(c: PixelCanvas) {
  pasted(c, 36, 50, PINK);
  c.rect(2, 2, 32, 46, "#f25fa8");
  text(c, center(36, "WE"), 6, "WE", "#ffffff");
  text(c, center(36, "WANT"), 13, "WANT", "#ffffff");
  text(c, center(36, "KCR", 2), 22, "KCR", "#fff36b", 2);
  c.hline(4, 31, 34, "#ffffff");
  text(c, center(36, "COME"), 37, "COME", "#ffffff");
  text(c, center(36, "BACK!"), 43, "BACK!", "#ffffff");
}

function carIcon(c: PixelCanvas, x: number, y: number, col: string) {
  c.rect(x + 3, y, 10, 4, col);
  c.rect(x, y + 4, 17, 5, col);
  c.rect(x + 5, y + 1, 3, 3, "#bfe6ff");
  c.rect(x + 9, y + 1, 3, 3, "#bfe6ff");
  c.ellipse(x + 4, y + 9, 2, 2, "#1b1020");
  c.ellipse(x + 13, y + 9, 2, 2, "#1b1020");
}

function posterVoteCar(c: PixelCanvas) {
  pasted(c, 36, 50, PINK);
  c.rect(2, 2, 32, 46, "#f25fa8");
  text(c, center(36, "VOTE"), 5, "VOTE", "#ffffff");
  text(c, center(36, "FOR"), 12, "FOR", "#ffffff");
  carIcon(c, 9, 20, "#ffffff");
  text(c, center(36, "CAR", 2), 34, "CAR", "#fff36b", 2);
}

/** A wall plastered with overlapping posters – the classic Hyderabad compound wall. */
function posterWall(c: PixelCanvas) {
  c.rect(0, 6, 72, 34, "#cfc4b0");
  c.rect(0, 6, 72, 2, "#e0d8c8");
  for (let x = 0; x < 72; x += 9) c.vline(x, 8, 39, "#bdb29e");
  const p1 = new PixelCanvas(36, 50); posterCmDown(p1);
  const p2 = new PixelCanvas(36, 50); posterWeWant(p2);
  const p3 = new PixelCanvas(36, 50); posterVoteCar(p3);
  // half-size pastes (nearest-neighbour downscale)
  const paste = (src: PixelCanvas, ox: number, oy: number) => {
    for (let y = 0; y < 25; y++)
      for (let x = 0; x < 18; x++) {
        const [r, g, b, a] = src.get(x * 2, y * 2);
        if (a) c.px(ox + x, oy + y, "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
      }
  };
  paste(p1, 2, 10);
  paste(p2, 19, 12);
  paste(p3, 37, 10);
  paste(p1, 53, 12);
}

// ───────────────────────────── water scarcity ─────────────────────────────

const POT_COLS = ["#d9772f", "#3d8bd9", "#e9a920", "#46a35b", "#c94040", "#9b59b6"];

function potPerson(c: PixelCanvas, x: number, y: number, sari: string, pot: string, skin = "#c98b5a") {
  c.ellipse(x + 4, y + 2, 3, 2.2, pot); // pot on the head
  c.rect(x + 3, y - 1, 3, 1, shade(pot, -0.3));
  c.ellipse(x + 4, y + 6, 2.2, 2.2, skin);
  c.rect(x + 2, y + 4, 5, 1, "#1f1b26");
  c.rect(x + 1, y + 9, 7, 9, sari);
  c.line(x + 1, y + 9, x + 7, y + 15, shade(sari, 0.3));
  c.vline(x, y + 2, y + 10, skin); // arm steadying the pot
}

/** Obstacle: a queue of women carrying pots crossing the road to the water tanker. */
function potQueue(c: PixelCanvas) {
  const saris = ["#d42a2a", "#2f8a3f", "#e9a920", "#7a3f8f"];
  for (let i = 0; i < 4; i++) potPerson(c, 2 + i * 12, 6 + (i % 2), saris[i], POT_COLS[i]);
  for (let i = 0; i < 5; i++) c.ellipse(5 + i * 10, 29, 3, 2.5, POT_COLS[(i + 2) % POT_COLS.length]);
}

function waterQueue(c: PixelCanvas) {
  // long line of pots and people at a dry public tap
  c.rect(52, 6, 3, 24, "#7d8a99");
  c.rect(48, 6, 10, 3, "#7d8a99");
  c.rect(46, 9, 3, 3, "#5d6470"); // tap, bone dry
  c.rect(42, 0, 18, 7, "#fbf8f1");
  text(c, 43, 1, "NO H2O", "#d42a2a");
  for (let i = 0; i < 9; i++) c.ellipse(4 + i * 5, 28, 2.4, 2.2, POT_COLS[i % POT_COLS.length]);
  potPerson(c, 2, 4, "#d42a2a", POT_COLS[1]);
  potPerson(c, 14, 5, "#2f8a3f", POT_COLS[2], "#a86a3d");
  potPerson(c, 26, 4, "#3f7fd9", POT_COLS[0]);
}

function dryTap(c: PixelCanvas) {
  c.rect(10, 18, 4, 30, "#7d8a99");
  c.rect(4, 18, 10, 3, "#7d8a99");
  c.rect(3, 21, 3, 3, "#5d6470");
  c.rect(0, 0, 24, 16, "#fbf8f1");
  c.rect(0, 0, 24, 3, "#d42a2a");
  text(c, center(24, "NO"), 4, "NO", "#d42a2a");
  text(c, center(24, "WATER"), 10, "WATER", "#d42a2a");
  c.ellipse(4, 34, 3, 3, POT_COLS[0]);
  c.ellipse(19, 44, 3, 3, POT_COLS[1]);
}

// ───────────────────────────── crowded buildings ─────────────────────────────

function apartment(c: PixelCanvas, wall: string, floors = 6) {
  const h = floors * 13 + 8;
  const top = 92 - h;
  c.rect(2, top, 44, h, wall);
  c.rect(2, top, 44, 2, shade(wall, 0.25));
  c.rect(40, top, 6, h, shade(wall, -0.15));
  for (let f = 0; f < floors; f++) {
    const y = top + 6 + f * 13;
    c.rect(6, y, 9, 7, "#3a4a5a");
    c.rect(26, y, 9, 7, "#3a4a5a");
    c.px(7, y + 1, "#9fd0ff");
    c.px(27, y + 1, "#9fd0ff");
    c.rect(4, y + 8, 40, 2, shade(wall, -0.3)); // balcony slab
    c.rect(37, y + 1, 4, 3, "#e8e8e8"); // AC unit
    if (f % 2 === 0) ["#e94b3c", "#3f7fd9", "#f6c445"].forEach((col, i) => c.rect(17 + i * 3, y + 4, 2, 3, col)); // laundry
  }
  c.rect(8, top - 7, 9, 7, "#2a2a2a"); // rooftop water drums
  c.rect(20, top - 6, 7, 6, "#3d8bd9");
  c.vline(34, top - 10, top, "#7d8a99"); // dish antenna mast
  c.ellipse(34, top - 11, 3, 2, "#c8c8c8");
}

function complex(c: PixelCanvas) {
  c.rect(0, 10, 58, 82, "#c8c2b4");
  c.rect(0, 10, 58, 3, "#e0dacc");
  const boards: [string, string][] = [
    ["MOBILES", "#1d3f8f"],
    ["TIFFINS", "#c62828"],
    ["COACHING", "#2f8a3f"],
    ["CLINIC", "#ffffff"],
    ["SAREES", "#7a3f8f"],
    ["BANK", "#f07b17"],
  ];
  boards.forEach(([t, col], i) => {
    const y = 14 + i * 12;
    c.rect(2, y, 54, 8, col);
    text(c, center(58, t), y + 2, t, col === "#ffffff" ? "#c62828" : "#ffffff");
    c.rect(4, y + 8, 50, 3, "#3a4a5a");
  });
  c.rect(20, 86, 18, 6, "#2a2a2a");
}

function mall2(c: PixelCanvas) {
  c.rect(0, 14, 76, 66, "#9a7fb8");
  for (let x = 3; x < 74; x += 7) for (let y = 30; y < 70; y += 7) c.rect(x, y, 6, 6, (x + y) % 3 ? "#c8b8e8" : "#e8deff");
  c.rect(0, 8, 76, 18, "#e8318c");
  text(c, center(76, "CITY", 2), 10, "CITY", "#ffffff", 2);
  text(c, center(76, "MALL"), 20, "MALL", "#fff36b");
  c.rect(26, 66, 24, 14, "#2a3a4a");
  c.rect(28, 68, 9, 12, "#bfe6ff");
  c.rect(39, 68, 9, 12, "#bfe6ff");
  c.rect(56, 34, 16, 22, "#1d3f8f");
  text(c, 58, 38, "FOOD", "#ffd34d");
  text(c, 58, 45, "COURT", "#ffffff");
}

const ROADSIDE: Record<string, [number, number, (c: PixelCanvas) => void]> = {
  "rs-poster-cmdown": [36, 50, posterCmDown],
  "rs-poster-wewant": [36, 50, posterWeWant],
  "rs-poster-votecar": [36, 50, posterVoteCar],
  "rs-poster-wall": [72, 40, posterWall],
  "ob-potQueue": [52, 32, potQueue],
  "rs-water-queue": [60, 32, waterQueue],
  "rs-dry-tap": [24, 48, dryTap],
  "bd-apartment": [48, 92, (c) => apartment(c, "#e8c9a0", 6)],
  "bd-apartment2": [48, 92, (c) => apartment(c, "#a8c8d8", 5)],
  "bd-apartment3": [48, 92, (c) => apartment(c, "#e8a8b0", 6)],
  "bd-complex": [58, 92, complex],
  "bd-mall2": [76, 80, mall2],
  "dm-house": [52, 56, house],
  "dm-rubble": [52, 56, rubble],
  "dm-van": [56, 30, hydraVan],
  "dm-jcb-0": [56, 42, (c) => demoJcb(c, 0)],
  "dm-jcb-1": [56, 42, (c) => demoJcb(c, 1)],
  "tk-stayOrder": [17, 17, stayOrder],
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
