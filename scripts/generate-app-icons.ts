/**
 * Generates Android launcher icons / splash screens and the iOS app icon from the game's own pixel art.
 * Run after `npx cap add android|ios` or whenever the character art changes:  npm run app:icons
 */
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { glob } from "node:fs/promises";
import { characterFrames, portraitFrames, tri } from "../src/game/art/character";
import { PixelCanvas, text, textWidth } from "../src/game/art/painter";

const BG = [0x1b, 0x10, 0x20];

function iconArt(): PixelCanvas {
  const c = new PixelCanvas(32, 32);
  for (let y = 0; y < 32; y++) c.hline(0, 31, y, tri(y, 32));
  const face = portraitFrames().find((f) => f.name === "face-grin")!.canvas;
  c.blit(face, 0, 1);
  return c;
}

function splashArt(): PixelCanvas {
  const c = new PixelCanvas(80, 90);
  const hero = characterFrames().find((f) => f.name === "victory-0")!.canvas;
  c.blit(hero, 16, 4);
  const t1 = "CHITTI NAIDU";
  const t2 = "RUN";
  text(c, Math.floor((80 - textWidth(t1)) / 2), 66, t1, "#f57c12");
  text(c, Math.floor((80 - textWidth(t2)) / 2), 74, t2, "#fbf8f1");
  for (let x = 20; x < 60; x++) {
    c.px(x, 82, x < 33 ? "#f57c12" : x < 47 ? "#fbf8f1" : "#138a3d");
    c.px(x, 83, x < 33 ? "#f57c12" : x < 47 ? "#fbf8f1" : "#138a3d");
  }
  return c;
}

/** Nearest-neighbour render of `art` onto a W×H PNG, art occupying `fill` of the shorter side. */
function render(art: PixelCanvas, W: number, H: number, fill: number, bg: number[] | null): Buffer {
  const png = new PNG({ width: W, height: H });
  const scale = Math.max(1, Math.floor((Math.min(W, H) * fill) / Math.max(art.w, art.h)));
  const ox = Math.floor((W - art.w * scale) / 2);
  const oy = Math.floor((H - art.h * scale) / 2);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      const ax = Math.floor((x - ox) / scale);
      const ay = Math.floor((y - oy) / scale);
      let r = bg ? bg[0] : 0, g = bg ? bg[1] : 0, b = bg ? bg[2] : 0, a = bg ? 255 : 0;
      if (ax >= 0 && ay >= 0 && ax < art.w && ay < art.h && x >= ox && y >= oy) {
        const i = (ay * art.w + ax) * 4;
        const sa = art.data[i + 3] / 255;
        if (sa > 0) {
          r = art.data[i] * sa + r * (1 - sa);
          g = art.data[i + 1] * sa + g * (1 - sa);
          b = art.data[i + 2] * sa + b * (1 - sa);
          a = Math.max(a, art.data[i + 3]);
        }
      }
      png.data[o] = r;
      png.data[o + 1] = g;
      png.data[o + 2] = b;
      png.data[o + 3] = a;
    }
  return PNG.sync.write(png);
}

const size = (file: string) => {
  const p = PNG.sync.read(fs.readFileSync(file));
  return [p.width, p.height] as const;
};

async function main() {
  const icon = iconArt();
  const splash = splashArt();
  let n = 0;
  if (fs.existsSync("android")) {
    for await (const f of glob("android/app/src/main/res/mipmap-*/*.png")) {
      const [w, h] = size(f);
      const name = path.basename(f);
      // adaptive foreground: art inside the 66% safe zone on transparency
      const buf = name.includes("foreground") ? render(icon, w, h, 0.62, null) : render(icon, w, h, 1, BG);
      fs.writeFileSync(f, buf);
      n++;
    }
    for await (const f of glob("android/app/src/main/res/drawable*/splash.png")) {
      const [w, h] = size(f);
      fs.writeFileSync(f, render(splash, w, h, 0.55, BG));
      n++;
    }
    const bgXml = "android/app/src/main/res/values/ic_launcher_background.xml";
    if (fs.existsSync(bgXml))
      fs.writeFileSync(bgXml, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B1020</color>\n</resources>\n`);
  }
  if (fs.existsSync("ios")) {
    for await (const f of glob("ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png")) {
      const [w, h] = size(f);
      fs.writeFileSync(f, render(icon, w, h, 1, BG)); // iOS icons must be opaque
      n++;
    }
    for await (const f of glob("ios/App/App/Assets.xcassets/Splash.imageset/*.png")) {
      const [w, h] = size(f);
      fs.writeFileSync(f, render(splash, w, h, 0.4, BG));
      n++;
    }
  }
  console.log(`Generated ${n} app icon / splash images`);
}

void main();
