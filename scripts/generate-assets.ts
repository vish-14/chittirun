/**
 * Generates every sprite sheet / background as optimised PNG + Phaser atlas JSON
 * into public/assets/sprites with content-hashed filenames (immutable CDN caching),
 * and writes src/game/art/asset-manifest.json. All art is procedurally drawn and original.
 *
 *   npm run assets          – regenerate
 *   npm run assets:check    – verify committed assets are up to date (CI)
 */
import { PNG } from "pngjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildAtlases, buildImages, toPhaserAtlas } from "../src/game/art/sheets";
import type { PixelCanvas } from "../src/game/art/painter";

const OUT = path.join(process.cwd(), "public/assets/sprites");
const MANIFEST = path.join(process.cwd(), "src/game/art/asset-manifest.json");
const check = process.argv.includes("--check");

function encode(c: PixelCanvas): Buffer {
  const png = new PNG({ width: c.w, height: c.h, colorType: 6 });
  png.data = Buffer.from(c.data);
  return PNG.sync.write(png, { colorType: 6, deflateLevel: 9, deflateStrategy: 1 });
}
const hash = (b: Buffer | string) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 10);

const manifest: { atlases: Record<string, { png: string; json: string }>; images: Record<string, string> } = {
  atlases: {},
  images: {},
};
const files = new Map<string, Buffer>();

for (const [key, sheet] of Object.entries(buildAtlases())) {
  const png = encode(sheet.canvas);
  const pngName = `${key}.${hash(png)}.png`;
  const json = Buffer.from(JSON.stringify(toPhaserAtlas(sheet, pngName)));
  const jsonName = `${key}.${hash(json)}.json`;
  files.set(pngName, png);
  files.set(jsonName, json);
  manifest.atlases[key] = { png: pngName, json: jsonName };
}
for (const [key, canvas] of Object.entries(buildImages())) {
  const png = encode(canvas);
  const name = `${key}.${hash(png)}.png`;
  files.set(name, png);
  manifest.images[key] = name;
}

const manifestText = JSON.stringify(manifest, null, 2) + "\n";
if (check) {
  const current = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
  const missing = [...files.keys()].filter((f) => !fs.existsSync(path.join(OUT, f)));
  if (current !== manifestText || missing.length) {
    console.error("Assets are out of date. Run `npm run assets`.", missing);
    process.exit(1);
  }
  console.log("Assets up to date.");
  process.exit(0);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, buf] of files) {
  fs.writeFileSync(path.join(OUT, name), buf);
  total += buf.length;
}
fs.writeFileSync(MANIFEST, manifestText);
console.log(`Wrote ${files.size} files (${(total / 1024).toFixed(1)} KiB) to public/assets/sprites`);
