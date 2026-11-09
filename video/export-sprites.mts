import { PNG } from "pngjs";
import fs from "node:fs";
import { characterFrames, flagFrames, portraitFrames } from "../src/game/art/character";
import { propFrames } from "../src/game/art/props";
import type { PixelCanvas } from "../src/game/art/painter";
const dir = process.argv[2];
function save(c: PixelCanvas, name: string, s: number) {
  const png = new PNG({ width: c.w * s, height: c.h * s });
  for (let y = 0; y < c.h * s; y++) for (let x = 0; x < c.w * s; x++) {
    const i = (Math.floor(y / s) * c.w + Math.floor(x / s)) * 4, o = (y * c.w * s + x) * 4;
    for (let k = 0; k < 4; k++) png.data[o + k] = c.data[i + k];
  }
  fs.writeFileSync(`${dir}/${name}.png`, PNG.sync.write(png));
}
const all = [...characterFrames(), ...flagFrames(), ...portraitFrames(), ...propFrames()];
const want: Record<string, number> = { "victory-0": 10, "victory-1": 10, "victory-2": 10, "lost-0": 8, "lost-1": 8, "flag-0": 8, "flag-1": 8, "flag-2": 8,
  "np-ranga-0": 8, "np-ranga-1": 8, "np-tondal-0": 8, "np-tondal-1": 8, "dm-van": 6, "rs-poster-cmdown": 5, "rs-poster-wewant": 5, "rs-poster-jai": 5, "dm-jcb-1": 6, "ob-crater": 6 };
for (const f of all) if (want[f.name]) save(f.canvas, f.name, want[f.name]);
console.log("ok");
